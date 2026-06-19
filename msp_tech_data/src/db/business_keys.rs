use std::collections::HashMap;

use tokio_postgres::types::ToSql;

use crate::{
    error::Result,
    model::Vertex,
};

use super::DbClient;
use super::maps::vertex_from_row;

/// Find active DB vertices that share a business_key with any of the provided vertices
/// but belong to a different entity (different __originalId).
pub async fn check_business_key_conflicts(
    client: &DbClient,
    vertices: &[Vertex],
) -> Result<Vec<Vertex>> {
    let business_key_pairs: Vec<(String, String)> = vertices
        .iter()
        .filter(|v| !v.business_key.is_empty())
        .map(|v| (v.label.clone(), v.business_key.clone()))
        .collect();

    if business_key_pairs.is_empty() {
        return Ok(Vec::new());
    }

    let labels: Vec<String> = business_key_pairs
        .iter()
        .map(|(label, _)| label.clone())
        .collect();
    let business_keys: Vec<String> = business_key_pairs
        .iter()
        .map(|(_, key)| key.clone())
        .collect();

    // Same leading 'v' otype column so vertex_from_row indices align
    let sql = r#"
        SELECT 'v' AS otype, id, __originalId, __entityId, __transactionid,
               __label, __isEntity, __viewtype, __timestamp,
               __businessKey, __alternateKey, content
        FROM vertices v
        JOIN unnest($1::text[], $2::text[]) AS input_keys(label, business_key)
          ON v.__label = input_keys.label
         AND v.__businessKey = input_keys.business_key
                WHERE NOT EXISTS (
              SELECT 1 FROM edges e
              WHERE e.from_id = v.id AND e.__label = 'supersededBy'
          )
    "#;

    let params: &[&(dyn ToSql + Sync)] = &[&labels, &business_keys];
    let rows = client.query(sql, params).await?;

    // Build map of (label, business_key) -> original_ids from input so we can exclude same entities.
    let mut input_originals: HashMap<(&str, &str), Vec<&str>> = HashMap::new();
    for v in vertices {
        if !v.business_key.is_empty() {
            input_originals
                .entry((&v.label, &v.business_key))
                .or_default()
                .push(&v.original_id);
        }
    }

    let conflicts = rows
        .iter()
        .map(vertex_from_row)
        .filter(|db_v| {
            input_originals
                .get(&(db_v.label.as_str(), db_v.business_key.as_str()))
                .map(|orig_ids| !orig_ids.contains(&db_v.original_id.as_str()))
                .unwrap_or(false)
        })
        .collect();

    Ok(conflicts)
}