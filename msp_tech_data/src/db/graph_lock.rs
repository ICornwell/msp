use tokio_postgres::types::Json;
use tracing::debug;
use uuid::Uuid;

use crate::{error::Result, model::UpdateMessage};

use super::DbTransaction;

/// A recorded lock vertex written to the graph during lock acquisition.
/// Carried from `acquire_entity_write_locks` to `release_entity_write_locks`
/// so the release step can write the matching supersededBy audit edges.
pub struct LockRecord {
    pub lock_vertex_id: String,
    pub entity_id: String,
}

/// Collect the deduplicated, sorted set of entity IDs that must be locked
/// for a given update message.
///
/// Every vertex in add / update / delete contributes its `__entityId` — this
/// correctly captures value-object vertices whose mutations logically belong to
/// a parent entity.  The caller does not need to filter out entity roots; the
/// dedup pass handles both.
///
/// This is a pure function so it can be unit-tested without a database.
pub fn collect_lock_entity_ids(message: &UpdateMessage) -> Vec<String> {
    let mut ids: Vec<String> = Vec::new();

    if let Some(add) = &message.add {
        if let Some(vertices) = &add.vertices {
            for v in vertices {
                if !v.entity_id.is_empty() {
                    ids.push(v.entity_id.clone());
                }
            }
        }
    }
    if let Some(update) = &message.update {
        if let Some(vertices) = &update.vertices {
            for v in vertices {
                if !v.entity_id.is_empty() {
                    ids.push(v.entity_id.clone());
                }
            }
        }
    }
    if let Some(delete) = &message.delete {
        if let Some(vertices) = &delete.vertices {
            for v in vertices {
                if !v.entity_id.is_empty() {
                    ids.push(v.entity_id.clone());
                }
            }
        }
    }

    ids.sort();
    ids.dedup();
    ids
}

/// Derive a stable i64 advisory lock key from an entity UUID string.
///
/// `pg_advisory_xact_lock` accepts a single 64-bit key — that is a hard Postgres
/// limit.  To make the best use of those 64 bits we XOR-fold all 16 UUID bytes
/// into a single u64 rather than discarding the lower half.
///
/// For UUID v7, the upper 8 bytes are timestamp-heavy (48-bit millisecond clock
/// + 16 random bits), while the lower 8 bytes are almost entirely random.
/// Taking only the upper half throws away the most discriminating bits.
/// XOR-folding spreads the full 128-bit UUID entropy across the 64-bit key space,
/// keeping collision probability negligible for any realistic entity population.
///
/// A collision widens lock contention slightly (two unrelated entities queue
/// behind each other) but never produces a missed or premature unlock.
pub fn entity_id_to_advisory_lock_key(entity_id: &str) -> i64 {
    if let Ok(uuid) = Uuid::parse_str(entity_id) {
        let bytes = uuid.as_bytes();
        let high = u64::from_be_bytes(bytes[..8].try_into().unwrap_or([0u8; 8]));
        let low  = u64::from_be_bytes(bytes[8..].try_into().unwrap_or([0u8; 8]));
        (high ^ low) as i64
    } else {
        // Non-UUID entity id: stable FNV-64 hash fallback.
        entity_id.bytes().fold(
            14695981039346656037u64,
            |hash, b| hash.wrapping_mul(1099511628211).wrapping_add(b as u64),
        ) as i64
    }
}

/// Acquire a Postgres advisory transaction lock for each entity ID, then write
/// a `__writeLock` audit vertex and `__transaction` link edge into the graph.
///
/// Locks are acquired in sorted order (enforced by `collect_lock_entity_ids`)
/// so concurrent writers requesting overlapping entity sets always acquire in
/// the same sequence, preventing cross-transaction deadlocks.
///
/// The advisory locks are transaction-scoped: Postgres releases them on commit
/// or rollback automatically.  The graph vertices are the durable audit trail.
///
/// Returns a `Vec<LockRecord>` that must be passed to `release_entity_write_locks`
/// before committing.
pub async fn acquire_entity_write_locks(
    tx: &DbTransaction<'_>,
    entity_ids: &[String],
    transaction_id: &str,
    timestamp: i64,
) -> Result<Vec<LockRecord>> {
    let mut lock_records: Vec<LockRecord> = Vec::new();

    for entity_id in entity_ids {
        let lock_key = entity_id_to_advisory_lock_key(entity_id);
        debug!("Acquiring advisory lock {} for entity {}", lock_key, entity_id);
        tx.execute("SELECT pg_advisory_xact_lock($1)", &[&lock_key]).await?;

        let lock_vertex_id = Uuid::now_v7().to_string();
        tx.execute(
            r#"
            INSERT INTO docgraph.vertices (
                id, __originalId, __entityId, __transactionId, __label, __isEntity,
                __viewType, __timeStamp, __businessKey, __alternateKey, content
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
            "#,
            &[
                &lock_vertex_id,
                &lock_vertex_id,
                entity_id,
                &transaction_id,
                &"__writeLock",
                &false,
                &"lock",
                &timestamp,
                &"",
                &"",
                &Json(&serde_json::Value::Null),
            ],
        )
        .await?;

        let lock_edge_id = Uuid::now_v7().to_string();
        tx.execute(
            r#"
            INSERT INTO docgraph.edges (
                id, __entityId, __transactionId, __label, __viewType,
                from_id, to_id, from_entityId, to_entityId, __timeStamp, content
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
            "#,
            &[
                &lock_edge_id,
                &lock_edge_id,
                &transaction_id,
                &"__transaction",
                &"lock_edge",
                &lock_vertex_id,
                &transaction_id,
                entity_id,
                &transaction_id,
                &timestamp,
                &Json(&serde_json::Value::Null),
            ],
        )
        .await?;

        debug!("Write lock acquired and recorded for entity {}", entity_id);
        lock_records.push(LockRecord {
            lock_vertex_id,
            entity_id: entity_id.clone(),
        });
    }

    Ok(lock_records)
}

/// Write a `supersededBy → "released"` edge for each lock record, marking the
/// lock vertex as released in the graph audit trail.
///
/// This must be called inside the same transaction as `acquire_entity_write_locks`,
/// immediately before commit.  If the transaction rolls back, both the lock
/// vertices and release edges are discarded atomically.
pub async fn release_entity_write_locks(
    tx: &DbTransaction<'_>,
    lock_records: &[LockRecord],
    transaction_id: &str,
    timestamp: i64,
) -> Result<()> {
    for record in lock_records {
        let release_edge_id = Uuid::now_v7().to_string();
        debug!(
            "Releasing write lock vertex {} for entity {}",
            record.lock_vertex_id, record.entity_id
        );
        tx.execute(
            r#"
            INSERT INTO docgraph.edges (
                id, __entityId, __transactionId, __label, __viewType,
                from_id, to_id, from_entityId, to_entityId, __timeStamp, content
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
            "#,
            &[
                &release_edge_id,
                &record.entity_id,
                &transaction_id,
                &"supersededBy",
                &"lock",
                &record.lock_vertex_id,
                &"released",
                &record.entity_id,
                &record.entity_id,
                &timestamp,
                &Json(&serde_json::Value::Null),
            ],
        )
        .await?;
    }

    Ok(())
}

// ============================================================================
// Tests
// ============================================================================

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::Value;
    use crate::model::{UpdateMessage, GraphElements, Vertex};

    fn make_vertex(entity_id: &str) -> Vertex {
        let mut v = Vertex::new("test".to_string(), "test".to_string(), Value::Null);
        v.entity_id = entity_id.to_string();
        v
    }

    fn make_message_with_add(entity_ids: &[&str]) -> UpdateMessage {
        let vertices = entity_ids.iter().map(|id| make_vertex(id)).collect();
        UpdateMessage::new().with_add(
            GraphElements::new().with_vertices(vertices)
        )
    }

    #[test]
    fn collect_deduplicates_and_sorts() {
        let msg = UpdateMessage::new()
            .with_add(GraphElements::new().with_vertices(
                vec![make_vertex("ccc"), make_vertex("aaa")],
            ))
            .with_update(GraphElements::new().with_vertices(
                vec![make_vertex("bbb"), make_vertex("aaa")],
            ))
            .with_delete(GraphElements::new().with_vertices(
                vec![make_vertex("aaa"), make_vertex("ddd")],
            ));

        let ids = collect_lock_entity_ids(&msg);
        assert_eq!(ids, vec!["aaa", "bbb", "ccc", "ddd"]);
    }

    #[test]
    fn collect_skips_empty_entity_ids() {
        let mut v = Vertex::new("test".to_string(), "test".to_string(), Value::Null);
        v.entity_id = String::new();
        let msg = UpdateMessage::new()
            .with_add(GraphElements::new().with_vertices(vec![v]));
        assert!(collect_lock_entity_ids(&msg).is_empty());
    }

    #[test]
    fn collect_empty_message_returns_empty() {
        assert!(collect_lock_entity_ids(&UpdateMessage::new()).is_empty());
    }

    #[test]
    fn lock_key_is_deterministic() {
        let id = "01963c8a-1234-7abc-abcd-0123456789ab";
        assert_eq!(
            entity_id_to_advisory_lock_key(id),
            entity_id_to_advisory_lock_key(id)
        );
    }

    #[test]
    fn lock_key_differs_for_different_ids() {
        // Differ in first segment (upper bytes) — must produce distinct keys.
        let a = entity_id_to_advisory_lock_key("01963c8a-0000-7000-0000-000000000001");
        let b = entity_id_to_advisory_lock_key("01963c8b-0000-7000-0000-000000000001");
        assert_ne!(a, b);
    }

    #[test]
    fn lock_key_differs_when_only_last_segment_differs() {
        // XOR-fold uses all 16 bytes, so UUIDs differing only in the lower half
        // now also produce distinct keys (unlike the old first-8-bytes approach).
        let a = entity_id_to_advisory_lock_key("01963c8a-0000-7000-0000-000000000001");
        let b = entity_id_to_advisory_lock_key("01963c8a-0000-7000-0000-000000000002");
        assert_ne!(a, b);
    }

    #[test]
    fn lock_key_fallback_for_non_uuid() {
        let k1 = entity_id_to_advisory_lock_key("not-a-uuid");
        let k2 = entity_id_to_advisory_lock_key("not-a-uuid");
        assert_eq!(k1, k2);
    }

    #[test]
    fn single_entity_add_locks_that_entity() {
        let ids = collect_lock_entity_ids(&make_message_with_add(&["entity-1"]));
        assert_eq!(ids, vec!["entity-1"]);
    }
}
