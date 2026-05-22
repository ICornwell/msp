use std::collections::HashMap;

use deadpool_postgres::Client;
use tokio_postgres::types::ToSql;

use crate::{
    error::{DocGraphError, Result},
    model::Vertex,
};

use super::maps::vertex_from_row;

/// Find active DB vertices that share a business_key with any of the provided vertices
/// but belong to a different entity (different __originalId).
pub async fn check_business_key_conflicts(
    client: &mut Client,
    vertices: &[Vertex],
) -> Result<Vec<Vertex>> {
    let business_keys: Vec<String> = vertices
        .iter()
        .filter(|v| !v.business_key.is_empty())
        .map(|v| v.business_key.clone())
        .collect();

    if business_keys.is_empty() {
        return Ok(Vec::new());
    }

    // Same leading 'v' otype column so vertex_from_row indices align
    let sql = r#"
        SELECT 'v' AS otype, id, __originalId, __entityId, __transactionid,
               __label, __isEntity, __viewtype, __timestamp,
               __businessKey, __alternateKey, content
        FROM vertices v
        WHERE __businessKey = ANY($1)
          AND NOT EXISTS (
              SELECT 1 FROM edges e
              WHERE e.from_id = v.id AND e.__label = 'supersededBy'
          )
    "#;

    let params: &[&(dyn ToSql + Sync)] = &[&business_keys];
    let rows = client
        .query(sql, params)
        .await
        .map_err(DocGraphError::Database)?;

    // Build map of business_key -> original_ids from the input so we can exclude them
    let mut input_originals: HashMap<&str, Vec<&str>> = HashMap::new();
    for v in vertices {
        if !v.business_key.is_empty() {
            input_originals
                .entry(&v.business_key)
                .or_default()
                .push(&v.original_id);
        }
    }

    let conflicts = rows
        .iter()
        .map(vertex_from_row)
        .filter(|db_v| {
            input_originals
                .get(db_v.business_key.as_str())
                .map(|orig_ids| !orig_ids.contains(&db_v.original_id.as_str()))
                .unwrap_or(false)
        })
        .collect();

    Ok(conflicts)
}