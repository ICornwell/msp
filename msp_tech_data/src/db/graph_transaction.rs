use tokio_postgres::types::ToSql;
use tokio_postgres::types::Json;
use tracing::{debug, info};

use crate::{
    error::{DocGraphError, Result},
    model::{Edge, TransactionResponse, Vertex},
};

use super::maps::{edge_from_row, vertex_from_row};
use super::{DbClient, DbClientManager};

pub async fn get_or_create_transaction(
    db: &DbClientManager,
    transaction_id: &str,
    timestamp: i64,
) -> Result<TransactionResponse> {
    let client = db.get_client().await?;
    get_or_create_transaction_with_client(&client, transaction_id, timestamp).await
}

pub async fn commit_transaction(
    db: &DbClientManager,
    transaction_id: &str,
    timestamp: i64,
) -> Result<TransactionResponse> {
    let client = db.get_client().await?;
    commit_transaction_with_client(&client, transaction_id, timestamp).await
}

pub async fn rollback_transaction(
    db: &DbClientManager,
    transaction_id: &str,
    timestamp: i64,
) -> Result<TransactionResponse> {
    let mut client = db.get_client().await?;
    rollback_transaction_with_client(&mut client, transaction_id, timestamp).await
}

async fn get_or_create_transaction_with_client(
    client: &DbClient,
    transaction_id: &str,
    timestamp: i64,
) -> Result<TransactionResponse> {
    if let Some(existing) = get_transaction_with_client(client, transaction_id, timestamp).await? {
        return Ok(existing);
    }

    create_transaction(client, transaction_id, timestamp).await
}

async fn get_transaction_with_client(
    client: &DbClient,
    transaction_id: &str,
    _timestamp: i64,
) -> Result<Option<TransactionResponse>> {
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
    let result: Vec<tokio_postgres::Row> = client.query(&sql, params).await?;

    let edges: Vec<Edge> = result
        .iter()
        .filter_map(|row| match row.get::<usize, &str>(0) {
            "e" => Some(edge_from_row(row)),
            _ => None,
        })
        .collect();
    let commit_edge = edges
        .iter()
        .find(|e| e.label == "committed" || e.label == "__committed");
    let rollback_edge = edges
        .iter()
        .find(|e| e.label == "rolledBack" || e.label == "__rolledBack");

    let vertices: Vec<Vertex> = result
        .iter()
        .filter_map(|row| match row.get::<usize, &str>(0) {
            "v" => Some(vertex_from_row(row)),
            _ => None,
        })
        .collect();
    if vertices.is_empty() {
        return Ok(None);
    }

    let transaction_vertex = vertices
        .iter()
        .find(|v| v.id == transaction_id)
        .or_else(|| vertices.first());
    let effective_timestamp = transaction_vertex
        .map(|v| v.timestamp)
        .unwrap_or(0);

    let is_committed = commit_edge.is_some();
    let is_rolled_back = rollback_edge.is_some();
    Ok(Some(TransactionResponse::success(
        transaction_id.to_string(),
        effective_timestamp.to_string(),
        is_committed,
        is_rolled_back,
    )))
}

async fn commit_transaction_with_client(
    client: &DbClient,
    transaction_id: &str,
    timestamp: i64,
) -> Result<TransactionResponse> {
    let Some(transaction_response) =
        get_transaction_with_client(client, transaction_id, timestamp).await?
    else {
        return Err(DocGraphError::NotFound("transaction not found".to_string()));
    };
    if transaction_response.is_rolled_back {
        return Err(DocGraphError::Validation(
            "transaction already rolled back".to_string(),
        ));
    }
    if transaction_response.is_committed {
        return Err(DocGraphError::Validation(
            "transaction already committed".to_string(),
        ));
    }

    let sql = r#"INSERT INTO edges (id, __entityId, __transactionid, __label, __viewtype, __timestamp, from_id, to_id, from_entityId, to_entityId, content)
     VALUES ($1, $1, $1, '__committed', 'transaction_edge', $2, $1, $1, $1, $1, $3)"#;
    let params: &[&(dyn ToSql + Sync)] = &[
        &transaction_id,
        &timestamp,
        &Json("committed"),
    ];
    client.execute(sql, params).await?;
    Ok(TransactionResponse::success(
        transaction_id.to_string(),
        timestamp.to_string(),
        true,
        false,
    ))
}

async fn rollback_transaction_with_client(
    client: &mut DbClient,
    transaction_id: &str,
    timestamp: i64,
) -> Result<TransactionResponse> {
    let Some(transaction_response) =
        get_transaction_with_client(client, transaction_id, timestamp).await?
    else {
        return Err(DocGraphError::NotFound("transaction not found".to_string()));
    };
    if transaction_response.is_committed {
        return Err(DocGraphError::Validation(
            "transaction already committed".to_string(),
        ));
    }
    if transaction_response.is_rolled_back {
        return Err(DocGraphError::Validation(
            "transaction already rolled back".to_string(),
        ));
    }

    let sql = r#"INSERT INTO edges (id, __entityId, __transactionid, __label, __viewtype, __timestamp, from_id, to_id, from_entityId, to_entityId, content)
     VALUES ($1, $1, $1, '__rolledBack', 'transaction_edge', $2, $1, $1, $1, $1, $3)"#;
    let params: &[&(dyn ToSql + Sync)] = &[
        &transaction_id,
        &timestamp,
        &Json("rolledBack"),
    ];

    let cleanup_sql = r#"DELETE FROM edges WHERE __transactionid = $1; DELETE FROM vertices WHERE __transactionid = $1"#;
    let cleanup_params: &[&(dyn ToSql + Sync)] = &[&transaction_id];

    let tx = client.begin_transaction().await?;
    debug!("Started database transaction for update");
    tx.execute(sql, params).await?;
    tx.execute(cleanup_sql, cleanup_params).await?;
    tx.commit().await?;
    info!("Update transaction committed successfully");

    Ok(TransactionResponse::success(
        transaction_id.to_string(),
        timestamp.to_string(),
        false,
        true,
    ))
}

async fn create_transaction(
    client: &DbClient,
    transaction_id: &str,
    timestamp: i64,
) -> Result<TransactionResponse> {
    let sql = r#"INSERT INTO vertices (id, __originalId, __entityId, __transactionid, __label, __isEntity, __viewtype, __timestamp, __businessKey, __alternateKey, content)
     VALUES ($1, $1, $1, $1, '__transaction', true, 'transaction', $2, $1, $1, $3)"#;
    let params: &[&(dyn ToSql + Sync)] = &[
        &transaction_id,
        &timestamp,
        &Json("transaction"),
    ];
    client.execute(sql, params).await?;
    Ok(TransactionResponse::success(
        transaction_id.to_string(),
        timestamp.to_string(),
        false,
        false,
    ))
}
