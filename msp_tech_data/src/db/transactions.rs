use deadpool_postgres::Client;
use tokio_postgres::types::ToSql;

use crate::{
    error::{DocGraphError, Result},
    model::{Edge, TransactionResponse, Vertex},
};

use super::maps::{edge_from_row, vertex_from_row};

pub async fn get_or_create_transaction(
    client: &Client,
    transaction_id: &str,
    timestamp: &str,
) -> Result<TransactionResponse> {
    let sql = format!(
        r#"WITH TV AS (SELECT 'v' AS otype, id, __originalId, __entityId, __transactionid, __label, __isEntity, __viewtype, __timestamp, __businessKey, __alternateKey, content, 'na' AS from_id, 'na' AS to_id
                FROM vertices v1 WHERE __entityid = $1 AND id = $1 ),
                TE AS (SELECT 'e' AS otype, e1.id, 'na' as __originalId, e1.__entityId, e1.__transactionid, e1.__label, FALSE as __isEntity, e1.__viewtype, e1.__timestamp, 'na' AS __businessKey, 'na' AS __alternateKey, e1.content, e1.from_id, e1.to_id
                FROM edges e1 WHERE EXISTS (SELECT 1 FROM TV WHERE TV.id = e1.from_id))
                SELECT * FROM TV
                UNION ALL
                SELECT * FROM TE"#
    );

    let params: &[&(dyn ToSql + Sync)] = &[&transaction_id];
    let result: Vec<tokio_postgres::Row> = client
        .query(&sql, params)
        .await
        .map_err(DocGraphError::Database)?;

    let edges: Vec<Edge> = result
        .iter()
        .filter_map(|row| match row.get::<usize, &str>(0) {
            "e" => Some(edge_from_row(row)),
            _ => None,
        })
        .collect();
    let commit_edge = edges.iter().find(|e| e.label == "committed");
    let rollback_edge = edges.iter().find(|e| e.label == "rolledBack");

    let vertices: Vec<Vertex> = result
        .iter()
        .filter_map(|row| match row.get::<usize, &str>(0) {
            "v" => Some(vertex_from_row(row)),
            _ => None,
        })
        .collect();
    if vertices.is_empty() {
        // if no transaction vertex exists, create one
        return create_transaction(client, transaction_id, timestamp).await;
    }

    let is_committed = commit_edge.is_some();
    let is_rolled_back = rollback_edge.is_some();
    Ok( TransactionResponse::success(
        transaction_id.to_string(),
        timestamp.to_string(),
        is_committed,
        is_rolled_back,
    ))
}

pub async fn commit_transaction(
    client: Client,
    transaction_id: &str,
    timestamp: &str,
) -> Result<TransactionResponse> {
    let transaction_response =
        get_or_create_transaction(&client, transaction_id, timestamp).await?;
    if transaction_response.is_rolled_back {
        return Ok(TransactionResponse::error(
            "transaction already rolled back",
        ));
    }
    if transaction_response.is_committed {
        return Ok(TransactionResponse::error(
            "transaction already committed",
        ));
    }

    let sql = r#"INSERT INTO edges (id, __entityId, __transactionid, __label, __isEntity, __viewtype, __timestamp, from_id, to_id)
     VALUES ($1, $2, $3, 'committed', false, 'transaction_edge', $4, $5, $6)"#;
    let params: &[&(dyn ToSql + Sync)] = &[
        &format!("edge-{}-committed", transaction_id),
        &transaction_id,
        &transaction_id,
        &timestamp,
        &transaction_id,
        &transaction_id,
    ];
    client
        .execute(sql, params)
        .await
        .map_err(DocGraphError::Database)?;
    Ok(TransactionResponse::success(
        transaction_id.to_string(),
        timestamp.to_string(),
        true,
        false,
    ))
}

pub async fn rollback_transaction(
    client: Client,
    transaction_id: &str,
    timestamp: &str,
) -> Result<TransactionResponse> {
    let transaction_response =
        get_or_create_transaction(&client, transaction_id, timestamp).await?;
    if transaction_response.is_committed {
        return Ok(TransactionResponse::error(
            "transaction already committed",
        ));
    }
    if transaction_response.is_rolled_back {
        return Ok(TransactionResponse::error(
            "transaction already rolled back",
        ));
    }

    let sql = r#"INSERT INTO edges (id, __entityId, __transactionid, __label, __isEntity, __viewtype, __timestamp, from_id, to_id)
     VALUES ($1, $2, $3, 'rolledBack', false, 'transaction_edge', $4, $5, $6)"#;
    let params: &[&(dyn ToSql + Sync)] = &[
        &format!("edge-{}-rolledBack", transaction_id),
        &transaction_id,
        &transaction_id,
        &timestamp,
        &transaction_id,
        &transaction_id,
    ];
    client
        .execute(sql, params)
        .await
        .map_err(DocGraphError::Database)?;
    Ok(TransactionResponse::success(
        transaction_id.to_string(),
        timestamp.to_string(),
        false,
        true,
    ))
}

async fn create_transaction(
    client: &Client,
    transaction_id: &str,
    timestamp: &str,
) -> Result<TransactionResponse> {
    // create a new vertex with the transaction id as the id and entity id and original id
    // we can add a label of "transaction" to make it easier to query for transactions in the future
    let sql = r#"INSERT INTO vertices (id, __originalId, __entityId, __transactionid, __label, __isEntity, __viewtype, __timestamp)
     VALUES ($1, $2, $3, $4, 'transaction', true, 'transaction', $5)"#;
    let params: &[&(dyn ToSql + Sync)] = &[
        &transaction_id,
        &transaction_id,
        &transaction_id,
        &transaction_id,
        &timestamp,
    ];
    client
        .execute(sql, params)
        .await
        .map_err(DocGraphError::Database)?;
    Ok(TransactionResponse::success(
        transaction_id.to_string(),
        timestamp.to_string(),
        false,
        false,
    ))
}
