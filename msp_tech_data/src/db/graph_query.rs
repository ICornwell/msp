use tokio_postgres::types::ToSql;
use std::collections::HashSet;

use crate::{
    error::{DocGraphError, Result},
    model::{
        Edge, GraphElements, QueryMessage, QueryObject, QueryRelation, QueryResponse,
        Vertex,
    },
};

use super::maps::{edge_from_row, vertex_from_row};
use super::DbClientManager;

/// Reads graph data with application-level read-committed isolation.
///
/// ## Isolation model
///
/// This system implements its own transaction layer on top of Postgres. Writes
/// are stamped with a `__transactionid` that points to a `__transaction` vertex.
/// A transaction becomes "committed" when a `__committed` edge is written from
/// that vertex. Until that edge exists the transaction is in-flight.
///
/// The SQL filter (`latest_vertex_filter`) already hides vertices whose
/// supersededBy edges belong to committed transactions, so uncommitted deletes
/// and supersedes are invisible at the SQL level for `timestamp=0` reads.
/// However, uncommitted *new* vertices can still appear in results (they have
/// no supersededBy edge yet), so we need this post-query fallback loop to
/// detect and skip them.
///
/// ## `read_uncommitted` mode
///
/// When `true` (used within an active transaction so the writer can see its own
/// in-progress writes) we skip all isolation checks and return raw results.
///
/// ## Read-committed fallback loop
///
/// 1. Run the query at `effective_timestamp` (starts as the caller's requested
///    timestamp, or 0 meaning "latest committed").
/// 2. Collect every distinct `__transactionid` seen in the returned vertices
///    and relation edges.
/// 3. For each transaction ID, look up whether it has been committed.
/// 4. If *any* are uncommitted, compute `fallback_timestamp = that transaction's
///    start time - 1 microsecond` — i.e. the instant just before the earliest
///    write that leaked through.
/// 5. Re-run the query at that earlier timestamp, which excludes all data from
///    that transaction entirely.
/// 6. Repeat until every transaction ID in the result set is committed (or the
///    result is empty / we can't go further back).
///
/// Note: supersededBy deletion edges are intentionally excluded from the SQL
/// result set, but committed-only filtering in `latest_vertex_filter` means a
/// vertex whose deletion is uncommitted remains visible — correct behaviour, and
/// it avoids needing to chase supersededBy transaction IDs here.
pub async fn read_data(
    db: &DbClientManager,
    query_message: QueryMessage,
    read_uncommitted: bool,
) -> Result<QueryResponse> {
    let mut effective_timestamp = query_message.timestamp;

    loop {
        let response = read_data_internal(db, &query_message, effective_timestamp).await?;

        // In-transaction reads bypass isolation: the writer must see its own
        // uncommitted data.
        if read_uncommitted {
            return Ok(response);
        }

        // Gather the set of transaction IDs that authored the data we got back.
        // We check all of them to find any that are still in-flight.
        let mut transaction_ids: HashSet<String> = HashSet::new();
        if let Some(graph) = response.data.as_ref() {
            if let Some(vertices) = graph.vertices.as_ref() {
                for v in vertices {
                    if !v.transaction_id.is_empty() {
                        transaction_ids.insert(v.transaction_id.clone());
                    }
                }
            }
            if let Some(edges) = graph.edges.as_ref() {
                for e in edges {
                    if !e.transaction_id.is_empty() {
                        transaction_ids.insert(e.transaction_id.clone());
                    }
                }
            }
        }

        // No transaction IDs means empty result or all data is from committed
        // system-level writes — nothing to check.
        if transaction_ids.is_empty() {
            return Ok(response);
        }

        // Find the latest timestamp among any uncommitted transactions that
        // contributed data. We want the *latest* so that our fallback lands
        // just before *all* of the uncommitted writes, not just the earliest.
        //
        // UUIDs are v7 (millisecond-precise in their time component) so we
        // cannot use lexicographic ordering to find the "most recent" — two
        // transactions started within the same millisecond would sort
        // arbitrarily. We therefore compare the i64 microsecond __timestamp
        // stored on the __transaction vertex itself.
        let mut latest_uncommitted_timestamp: Option<i64> = None;
        for transaction_id in transaction_ids {
            let Some(transaction_state) = get_transaction_state(db, &transaction_id).await? else {
                // Transaction vertex not found — treat as non-existent / ignore.
                continue;
            };
            if !transaction_state.is_committed {
                latest_uncommitted_timestamp = Some(
                    latest_uncommitted_timestamp
                        .map_or(transaction_state.timestamp, |current| current.max(transaction_state.timestamp)),
                );
            }
        }

        // All transaction IDs in the result are committed — safe to return.
        let Some(uncommitted_timestamp) = latest_uncommitted_timestamp else {
            return Ok(response);
        };

        // Step back to 1 µs before the uncommitted transaction started.
        // This is safe because all timestamps are microsecond-precision i64s.
        let fallback_timestamp = uncommitted_timestamp.saturating_sub(1);

        // Guard: don't fall back past the beginning of time, and don't fall
        // back *forward* past the timestamp the caller originally requested
        // (which would mean the uncommitted transaction predates the snapshot
        // point — shouldn't happen in practice, but prevents an infinite loop).
        if fallback_timestamp <= 0
            || (effective_timestamp > 0 && fallback_timestamp >= effective_timestamp)
        {
            return Ok(response);
        }

        // Retry the query at the earlier timestamp. The loop will keep
        // retreating until the result contains only committed data.
        effective_timestamp = fallback_timestamp;
    }
}

async fn read_data_internal(
    db: &DbClientManager,
    query_message: &QueryMessage,
    query_timestamp: i64,
) -> Result<QueryResponse> {
    let client = db.get_client().await?;
    let start = query_message
        .query_objects
        .iter()
        .find(|obj| obj.is_query_root);



    let response = match start {
        Some(query_object) => {
            let current_sql = vec![format!(
                r#"WITH S1 AS (SELECT 'v' AS otype, id, __originalId, __entityId, __transactionid, __label, __isEntity, __viewtype, __timestamp, __businessKey, __alternateKey, content, 'na' AS from_id, 'na' AS to_id
                FROM vertices v1 WHERE (__entityid = $1::varchar OR __businesskey = $1::varchar) AND __label = $2::varchar AND __isentity = true AND {}
                )"#
                ,
                latest_vertex_filter("v1", query_timestamp)
            )];

            let (final_idx, final_sql) = build_sql_for_query_object(
                query_object,
                &query_message.query_objects,
                &query_message.query_relations,
                current_sql,
                query_timestamp,
                2,
            );

            let mut cte_sql = final_sql.join(",\n");
            cte_sql = format!("{}\nSELECT * FROM S1\n", cte_sql);

            for i in 2..final_idx {
                cte_sql = format!("{}UNION\nSELECT * FROM S{}\n", cte_sql, i);
            }

            let query_key = query_message.root_query_key_value.clone();
            let params: &[&(dyn ToSql + Sync)] = if query_timestamp > 0 {
                &[&query_key, &query_object.label, &query_timestamp]
            } else {
                &[&query_key, &query_object.label]
            };
            let result: Vec<tokio_postgres::Row> = client.query(&cte_sql, params).await?;

            let edges: Vec<Edge> = result
                .iter()
                .filter_map(|row| match row.get::<usize, &str>(0) {
                    "e" => Some(edge_from_row(row)),
                    _ => None,
                })
                .collect();

            let vertices: Vec<Vertex> = result
                .iter()
                .filter_map(|row| match row.get::<usize, &str>(0) {
                    "v" => Some(vertex_from_row(row)),
                    _ => None,
                })
                .collect();

            let result_graph_elements = GraphElements {
                vertices: Some(vertices),
                edges: Some(edges),
            };

            let query_response = QueryResponse {
                data: Some(result_graph_elements),
                success: true,
                message: Some("query executed".to_string()),
            };
            Ok(query_response)
        }
        None => Err(DocGraphError::Validation("no start object".to_string())),
    }
    .map_err(|err| DocGraphError::Validation(err.to_string()))?;
    Ok(response)
}

struct TransactionState {
    timestamp: i64,
    is_committed: bool,
}

/// Look up whether a transaction has been committed and when it started.
///
/// A transaction is represented as a `__transaction` vertex whose `id` *is*
/// the transaction ID. Its `__timestamp` records the microsecond at which the
/// transaction began (used as the fallback cut-off point in the read loop).
///
/// Commitment is signalled by a `__committed` edge (or `committed` — both
/// labels are accepted for historical compatibility) whose `from_id` is the
/// transaction ID. We only need to know *whether* that edge exists, not its
/// content, so we use `SELECT 1 ... LIMIT 1`.
///
/// Returns `None` if the transaction vertex doesn't exist at all, which can
/// happen if data was written outside the normal transaction flow — callers
/// treat this as "ignore".
async fn get_transaction_state(
    db: &DbClientManager,
    transaction_id: &str,
) -> Result<Option<TransactionState>> {
    let client = db.get_client().await?;

    // The transaction vertex has the same value for both `id` and `__originalId`;
    // there is exactly one per transaction. ORDER BY + LIMIT 1 is defensive —
    // in practice there should never be more than one row.
    let vertex_sql = r#"
        SELECT __timestamp
        FROM docgraph.vertices
        WHERE id = $1 AND __label = '__transaction'
        ORDER BY __timestamp DESC
        LIMIT 1
    "#;
    let rows = client.query(vertex_sql, &[&transaction_id]).await?;
    if rows.is_empty() {
        return Ok(None);
    }

    let timestamp: i64 = rows[0].get("__timestamp");

    // A committed transaction has a `__committed` edge written by the commit call.
    // We check both label spellings for backwards compatibility.
    let commit_sql = r#"
        SELECT 1
        FROM docgraph.edges
        WHERE from_id = $1 AND __label IN ('__committed', 'committed')
        LIMIT 1
    "#;
    let commit_rows = client.query(commit_sql, &[&transaction_id]).await?;

    Ok(Some(TransactionState {
        timestamp,
        is_committed: !commit_rows.is_empty(),
    }))
}

/// Recursively builds the chain of SQL CTEs that traverse the view's object graph.
///
/// ## CTE naming convention
///
/// Each CTE is named `S<n>` with a monotonically increasing index threaded through
/// the recursion. Pairs always follow this pattern:
///
/// ```text
/// S(n)   — relation edges (label = view relation label) whose from_id exists
///           in the preceding vertex CTE S(n-1)
/// S(n+1) — target vertices reached via those edges, filtered by label and
///           latest_vertex_filter to exclude stale/deleted rows
/// ```
///
/// The root vertex CTE (S1) is built by the caller before this function is
/// invoked, which is why `idx` starts at 2 and `base_idx - 1` references S1.
///
/// ## Uniform column list
///
/// Every CTE selects the same 14 columns with an `otype` discriminator (`'v'` or
/// `'e'`) so the final UNION can combine vertex and edge rows into one flat result
/// set. Columns not applicable to a row type are filled with `'na'` (e.g.
/// `from_id`/`to_id` for vertices, `__businessKey` for edges).
///
/// ## Relation edge CTEs
///
/// Edges are filtered by `__label` (the view-defined relation name) and
/// existence-joined to the preceding vertex CTE so we only follow edges that
/// originate from vertices already in scope. `latest_vertex_filter` is not
/// applied to edges — relation edges are not versioned the same way as entity
/// vertices; their presence/absence is governed by the vertex lifecycle.
///
/// ## Vertex CTEs
///
/// Target vertices are filtered by `__label` (the view-defined object label) and
/// by `latest_vertex_filter`, which handles both snapshot-at-timestamp and
/// latest-committed semantics (see that function's doc comment).
fn build_sql_for_query_object(
    current_object: &QueryObject,
    objects: &[QueryObject],
    relations: &[QueryRelation],
    mut current_sql: Vec<String>,
    query_timestamp: i64,
    mut idx: i32,
) -> (i32, Vec<String>) {
    // Remember the index of the current parent vertex CTE so edge CTEs can
    // reference it as S(base_idx - 1).
    let base_idx = idx;
    for relation in relations {
        if relation.is_relation_from_id(&current_object.query_object_id) {
            // ── Edge CTE ────────────────────────────────────────────────────────
            // Selects all edges with the view relation's label whose from_id is a
            // vertex already in S(base_idx - 1). EXISTS acts as an inner join
            // without duplicating vertex columns.
            current_sql.push(format!(
                r#"{} AS (SELECT 'e' AS otype, e1.id, 'na' as __originalId, e1.__entityId, e1.__transactionid, e1.__label, FALSE as __isEntity, e1.__viewtype, e1.__timestamp, 'na' AS __businessKey, 'na' AS __alternateKey, e1.content, e1.from_id, e1.to_id
                FROM edges e1 WHERE e1.__label = '{}' AND EXISTS (SELECT 1 FROM {} v WHERE v.id = e1.from_id)
                )"#,
                format!("S{}", idx),
                relation.label,
                format!("S{}", base_idx - 1)
            ));
            idx += 1;

            if let Some(object) = objects.iter().find(|v| v.is_object_with_id(&relation.to_object))
            {
                // ── Target Vertex CTE ──────────────────────────────────────────────
                // Selects vertices reached by the edges in S(idx-1), filtered to the
                // expected label and to the "current" version via latest_vertex_filter
                // (excludes superseded/deleted rows).
                current_sql.push(format!(
                    r#"{} AS (SELECT 'v' AS otype, id, __originalId, __entityId, __transactionid, __label, __isEntity, __viewtype, __timestamp, __businessKey, __alternateKey, content, 'na' AS from_id, 'na' AS to_id
                    FROM vertices v2 WHERE __label = '{}' AND EXISTS (SELECT 1 FROM {} e WHERE e.to_id = v2.id) AND {}
                    )"#,
                    format!("S{}", idx),
                    object.label,
                format!("S{}", idx - 1),
                latest_vertex_filter("v2", query_timestamp)
                ));
                idx += 1;

                // Recurse to follow any further relations from this object.
                let (new_idx, new_sql) = build_sql_for_query_object(
                    object,
                    objects,
                    relations,
                    current_sql,
                    query_timestamp,
                    idx,
                );
                idx = new_idx;
                current_sql = new_sql;
            }
        }
    }

    (idx, current_sql)
}

/// Generates a SQL predicate that keeps only the "current" version of a vertex.
///
/// ## Versioning model
///
/// When a document is updated, a *new* vertex row is inserted with the same
/// `__originalId` and a higher `__timestamp`, and a `supersededBy` edge is written
/// from the old vertex id to the new one. A delete uses the same pattern, except
/// `to_id` is the literal string `"deleted"` instead of a real vertex id.
///
/// ## Snapshot mode (`query_timestamp > 0`)
///
/// Point-in-time read: find the single row that was current *at* the requested
/// timestamp. Three conditions must hold:
///
/// 1. `__timestamp <= $2` — the vertex existed by the snapshot point.
/// 2. No *newer* row for the same `__originalId` within the window — we don't
///    want a version that had already been superseded at that time.
/// 3. No `supersededBy` edge written at or before the snapshot — excludes deleted
///    vertices and rows that were replaced mid-window.
///
/// ## Latest-committed mode (`query_timestamp == 0`)
///
/// "Give me the current state" read: return the latest *committed* version of each
/// entity. We must NOT simply use `NOT EXISTS supersededBy`, because that would
/// make uncommitted deletes visible to all readers the instant the supersededBy
/// edge is written — before the transaction commits.
///
/// Instead, we exclude a vertex only when a `supersededBy` edge exists *and* the
/// transaction that wrote it has been committed (confirmed by the presence of a
/// `__committed` edge from that transaction vertex). An uncommitted supersededBy
/// edge is ignored, so the original vertex stays visible to committed-only readers
/// until the transaction is finalised.
fn latest_vertex_filter(alias: &str, query_timestamp: i64) -> String {
    if query_timestamp > 0 {
        // Snapshot read: vertex must have existed at snapshot point, must not have
        // been superseded by a newer version within the window, and must not have
        // been deleted (any supersededBy edge) within the window.
        format!(
            r#"({alias}.__timestamp <= $3::bigint
             AND NOT EXISTS (
                 -- no newer version of the same logical entity within snapshot window
                 SELECT 1 FROM vertices newer
                 WHERE newer.__originalId = {alias}.__originalId
                   AND newer.__timestamp > {alias}.__timestamp
                   AND newer.__timestamp <= $3::bigint
             )
             AND NOT EXISTS (
                 -- not deleted or replaced at or before the snapshot point
                 SELECT 1 FROM edges e
                 WHERE e.from_id = {alias}.id
                   AND e.__label = 'supersededBy'
                   AND e.__timestamp <= $3::bigint
             ))"#,
            alias = alias,
        )
    } else {
        // Latest-committed read: exclude vertices only when their supersededBy edge
        // belongs to a *committed* transaction. Uncommitted deletes/updates leave
        // the vertex visible so outside readers see a stable view until commit.
        //
        // `e.__transactionid` on the supersededBy edge identifies the transaction
        // that performed the delete/update. We confirm it is committed by checking
        // for a `__committed` edge originating from that transaction vertex.
        format!(
            r#"NOT EXISTS (
                SELECT 1 FROM edges e
                WHERE e.from_id = {alias}.id
                  AND e.__label = 'supersededBy'
                  AND EXISTS (
                      -- only counts as deleted if the deleting transaction committed
                      SELECT 1 FROM edges ce
                      WHERE ce.from_id = e.__transactionid
                        AND ce.__label IN ('__committed', 'committed')
                  )
            )"#,
            alias = alias
        )
    }
}
