use tokio_postgres::types::ToSql;

use crate::{
    error::{DocGraphError, Result},
    model::{
        Edge, GraphElements, QueryMessage, QueryObject, QueryRelation, QueryResponse,
        Vertex,
    },
};

use super::maps::{edge_from_row, vertex_from_row};
use super::DbClientManager;

pub async fn read_data(
    db: &DbClientManager,
    query_message: QueryMessage,
    read_uncommitted: bool,
) -> Result<QueryResponse> {
    let mut effective_timestamp = query_message.timestamp;

    loop {
        let response = read_data_internal(db, &query_message, effective_timestamp).await?;

        if read_uncommitted {
            return Ok(response);
        }

        let max_transaction_id = response
            .data
            .as_ref()
            .and_then(|g| g.vertices.as_ref())
            .and_then(|vertices| {
                vertices
                    .iter()
                    .filter(|v| !v.transaction_id.is_empty())
                    .map(|v| v.transaction_id.clone())
                    .max()
            });

        let Some(transaction_id) = max_transaction_id else {
            return Ok(response);
        };

        let Some(transaction_state) = get_transaction_state(db, &transaction_id).await? else {
            return Ok(response);
        };

        if transaction_state.is_committed {
            return Ok(response);
        }

        let fallback_timestamp = transaction_state.timestamp.saturating_sub(1);
        if fallback_timestamp <= 0 || fallback_timestamp >= effective_timestamp {
            return Ok(response);
        }

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
                FROM vertices v1 WHERE __entityid = $1::varchar AND __isentity = true AND {}
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
            let params: &[&(dyn ToSql + Sync)] = &[&query_key, &query_timestamp];
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

async fn get_transaction_state(
    db: &DbClientManager,
    transaction_id: &str,
) -> Result<Option<TransactionState>> {
    let client = db.get_client().await?;
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

fn build_sql_for_query_object(
    current_object: &QueryObject,
    objects: &[QueryObject],
    relations: &[QueryRelation],
    mut current_sql: Vec<String>,
    query_timestamp: i64,
    mut idx: i32,
) -> (i32, Vec<String>) {
    let base_idx = idx;
    for relation in relations {
        if relation.is_relation_from_id(&current_object.query_object_id) {
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

fn latest_vertex_filter(alias: &str, query_timestamp: i64) -> String {
    if query_timestamp > 0 {
        format!(
            r#"({alias}.__timestamp <= $2::bigint AND NOT EXISTS (SELECT 1 FROM vertices newer WHERE newer.__originalId = {alias}.__originalId AND newer.__timestamp > {alias}.__timestamp AND newer.__timestamp <= $2::bigint))"#,
            alias = alias,
        )
    } else {
        format!(
            r#"NOT EXISTS (SELECT 1 FROM edges e WHERE e.from_id = {alias}.id AND e.__label = 'supersededBy')"#,
            alias = alias
        )
    }
}
