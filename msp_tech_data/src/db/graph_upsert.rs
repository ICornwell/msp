use tokio_postgres::types::Json;
use tracing::{debug, info};
use uuid::Uuid;

use crate::{
    db::{get_or_create_transaction, commit_transaction, rollback_transaction},
    error::{DocGraphError, Result},
    model::UpdateMessage
};

use super::{check_business_key_conflicts, DbClientManager};

/// Process an update message to add, update, or delete graph elements.
pub async fn process_update(
    db: &DbClientManager,
    message: UpdateMessage,
    transaction_id: String,
    timestamp: i64,
) -> Result<()> {
    // Empty transaction id means caller wants this function to own the full unit-of-work
    // lifecycle (create -> apply update -> commit/rollback).
    let auto_managed_transaction = transaction_id.trim().is_empty();
    let effective_transaction_id = if auto_managed_transaction {
        Uuid::now_v7().to_string()
    } else {
        transaction_id
    };
    let transaction_response =
        get_or_create_transaction(db, &effective_transaction_id, timestamp).await?;
    // Use the transaction vertex timestamp when present so all rows written in
    // this unit of work share a consistent transaction start time.
    let effective_timestamp = transaction_response
        .timestamp
        .parse::<i64>()
        .unwrap_or(timestamp);

    let update_result: Result<()> = async {
    let mut client = db.get_client().await?;

        // Business-key validation happens before writes so we can fail fast with a specific
        // conflict error instead of surfacing a lower-level DB failure mid-transaction.
        let mut vertices_to_check = Vec::new();
        if let Some(add) = &message.add {
            if let Some(vertices) = &add.vertices {
                vertices_to_check.extend(vertices.iter().cloned());
            }
        }
        if let Some(update) = &message.update {
            if let Some(vertices) = &update.vertices {
                vertices_to_check.extend(vertices.iter().cloned());
            }
        }
        let conflicts = check_business_key_conflicts(&client, &vertices_to_check).await?;
        if !conflicts.is_empty() {
            let conflict_info: Vec<String> = conflicts
                .iter()
                .map(|v| {
                    format!(
                        "Conflict on business key '{}' for vertex with original ID '{}'",
                        v.business_key, v.original_id
                    )
                })
                .collect();
            let error_message = format!(
                "Business key conflicts detected: {}",
                conflict_info.join("; ")
            );
            debug!("{}", error_message);
            return Err(DocGraphError::Validation(error_message));
        }

        let tx = client.begin_transaction().await?;
        debug!("Started database transaction for update");

        if let Some(add) = &message.add {
            if let Some(vertices) = &add.vertices {
                for vertex in vertices {
                    debug!("Adding vertex with label: {}", vertex.label);
                    tx.execute(
                        r#"
                        INSERT INTO docgraph.vertices (
                            id, __originalId, __entityId, __transactionId, __label, __isEntity, __viewType, __timeStamp, __businessKey, __alternateKey, content
                        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
                        "#,
                        &[
                            &vertex.id,
                            &vertex.id,
                            &vertex.entity_id,
                            &effective_transaction_id,
                            &vertex.label,
                            &vertex.is_entity,
                            &vertex.view_type,
                            &effective_timestamp,
                            &vertex.business_key,
                            &vertex.alternate_key,
                            &Json(&vertex.content),
                        ],
                    )
                    .await?;

                    let tx_edge_id = Uuid::now_v7().to_string();
                    // Every inserted version is linked to the transaction vertex so later
                    // graph queries can reconstruct what this transaction introduced.
                    tx.execute(
                        r#"
                        INSERT INTO docgraph.edges (
                            id, __entityId, __transactionId, __label, __viewType,
                            from_id, to_id, from_entityId, to_entityId, __timeStamp, content
                        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
                        "#,
                        &[
                            &tx_edge_id,
                            &tx_edge_id,
                            &effective_transaction_id,
                            &"__transaction",
                            &"transaction_edge",
                            &vertex.id,
                            &effective_transaction_id,
                            &vertex.entity_id,
                            &effective_transaction_id,
                            &effective_timestamp,
                            &Json(&serde_json::Value::Null),
                        ],
                    )
                    .await?;
                }
            }

            if let Some(edges) = &add.edges {
                for edge in edges {
                    debug!("Adding edge with label: {}", edge.label);
                    tx.execute(
                        r#"
                        INSERT INTO docgraph.edges (
                            id, __entityId, __transactionId, __label, __viewType,
                            from_id, to_id, from_entityId, to_entityId, __timeStamp, content
                        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
                        "#,
                        &[
                            &edge.id,
                            &edge.entity_id,
                            &effective_transaction_id,
                            &edge.label,
                            &edge.view_type,
                            &edge.from,
                            &edge.to,
                            &edge.from_entity_id,
                            &edge.to_entity_id,
                            &effective_timestamp,
                            &Json(&edge.content),
                        ],
                    )
                    .await?;
                }
            }
        }

        if let Some(update) = &message.update {
            if let Some(vertices) = &update.vertices {
                for vertex in vertices {
                    let updated_vertex = &vertex.clone_with_new_id(Uuid::now_v7().to_string());

                    debug!("Updating vertex with id: {}", vertex.id);
                    tx.execute(
                        r#"
                        INSERT INTO docgraph.vertices (
                            id, __originalId, __entityId, __transactionId, __label, __isEntity, __viewType, __timeStamp, __businessKey, __alternateKey, content
                        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
                        "#,
                        &[
                            &updated_vertex.id,
                            &updated_vertex.original_id,
                            &updated_vertex.entity_id,
                            &effective_transaction_id,
                            &updated_vertex.label,
                            &updated_vertex.is_entity,
                            &updated_vertex.view_type,
                            &effective_timestamp,
                            &updated_vertex.business_key,
                            &updated_vertex.alternate_key,
                            &Json(&updated_vertex.content),
                        ],
                    )
                    .await?;

                    let tx_edge_id = Uuid::now_v7().to_string();
                    tx.execute(
                        r#"
                        INSERT INTO docgraph.edges (
                            id, __entityId, __transactionId, __label, __viewType,
                            from_id, to_id, from_entityId, to_entityId, __timeStamp, content
                        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
                        "#,
                        &[
                            &tx_edge_id,
                            &tx_edge_id,
                            &effective_transaction_id,
                            &"__transaction",
                            &"transaction_edge",
                            &updated_vertex.id,
                            &effective_transaction_id,
                            &updated_vertex.entity_id,
                            &effective_transaction_id,
                            &effective_timestamp,
                            &Json(&serde_json::Value::Null),
                        ],
                    )
                    .await?;

                    if !vertex.original_id.is_empty() {
                        let edge_id = Uuid::now_v7().to_string();
                        // Versioning strategy is append-only: old version points to new version
                        // via supersededBy, rather than updating/deleting historical rows.
                        debug!(
                            "Adding supersededBy edge from {} to {}",
                            updated_vertex.original_id,
                            updated_vertex.id
                        );
                        tx.execute(
                            r#"
                            INSERT INTO docgraph.edges (
                                id, __entityId, __transactionId, __label, __viewType,
                                from_id, to_id, from_entityId, to_entityId, __timeStamp, content
                            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
                            "#,
                            &[
                                &edge_id,
                                &updated_vertex.entity_id,
                                &effective_transaction_id,
                                &"supersededBy",
                                &updated_vertex.view_type,
                                &updated_vertex.original_id,
                                &updated_vertex.id,
                                &updated_vertex.entity_id,
                                &updated_vertex.entity_id,
                                &effective_timestamp,
                                &Json(&serde_json::Value::Null),
                            ],
                        )
                        .await?;
                    }

                    if !updated_vertex.original_id.is_empty() {
                        debug!("Copying forward edges for updated vertex {}", updated_vertex.id);
                        // Copy inbound relationships from prior version to new version while:
                        // - avoiding duplicates (NOT EXISTS),
                        // - excluding explicitly managed edges (id NOT IN),
                        // - and skipping version-link edges (supersededBy).
                        tx.query(
                            r#"
                            INSERT INTO docgraph.edges (id, __entityId, __transactionId, __label, __viewType,
                                                       from_id, to_id, from_entityId, to_entityId, __timeStamp, content)
                            SELECT uuidv7(), __entityId, CAST($4 AS VARCHAR), __label, __viewType,
                                   from_id, $1, from_entityId, to_entityId, $5, content
                            FROM docgraph.edges
                            WHERE to_id = $3
                            AND NOT EXISTS (
                                SELECT 1 FROM docgraph.edges e2
                                WHERE e2.from_id = docgraph.edges.from_id
                                  AND e2.to_id = $2
                                  AND e2.__label = docgraph.edges.__label
                            )
                            AND id NOT IN ($6)
                            AND __label != 'supersededBy'
                            "#,
                            &[
                                &updated_vertex.id,
                                &updated_vertex.id,
                                &updated_vertex.original_id,
                                &effective_transaction_id,
                                &effective_timestamp,
                                &updated_vertex.view_managed_edges.join(", "),
                            ],
                        )
                        .await?;

                        // Mirror the same copy-forward rule for outbound relationships so the
                        // replacement vertex remains connected on both sides of the graph.
                        tx.query(
                            r#"
                            INSERT INTO docgraph.edges (id, __entityId, __transactionId, __label, __viewType,
                                                       from_id, to_id, from_entityId, to_entityId, __timeStamp, content)
                            SELECT uuidv7(), __entityId, CAST($4 AS VARCHAR), __label, __viewType,
                                   $1, to_id, from_entityId, to_entityId, $5, content
                            FROM docgraph.edges
                            WHERE from_id = $3
                            AND NOT EXISTS (
                                SELECT 1 FROM docgraph.edges e2
                                WHERE e2.from_id = $2
                                  AND e2.to_id = docgraph.edges.to_id
                                  AND e2.__label = docgraph.edges.__label
                            )
                            AND id NOT IN ($6)
                            AND __label != 'supersededBy'
                            "#,
                            &[
                                &updated_vertex.id,
                                &updated_vertex.id,
                                &updated_vertex.original_id,
                                &effective_transaction_id,
                                &effective_timestamp,
                                &updated_vertex.view_managed_edges.join(", "),
                            ],
                        )
                        .await?;
                    }
                }
            }

            if let Some(edges) = &update.edges {
                for edge in edges {
                    debug!("Updating edge with id: {}", edge.id);
                    tx.execute(
                        r#"
                        INSERT INTO docgraph.edges (
                            id, __entityId, __transactionId, __label, __viewType,
                            from_id, to_id, from_entityId, to_entityId, __timeStamp, content
                        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
                        "#,
                        &[
                            &edge.id,
                            &edge.entity_id,
                            &effective_transaction_id,
                            &edge.label,
                            &edge.view_type,
                            &edge.from,
                            &edge.to,
                            &edge.from_entity_id,
                            &edge.to_entity_id,
                            &effective_timestamp,
                            &Json(&edge.content),
                        ],
                    )
                    .await?;
                }
            }
        }

        if let Some(delete) = &message.delete {
            if let Some(vertices) = &delete.vertices {
                for vertex in vertices {
                    let edge_id = Uuid::now_v7().to_string();
                    debug!("Marking vertex {} as deleted", vertex.id);
                    tx.execute(
                        r#"
                        INSERT INTO docgraph.edges (
                            id, __entityId, __transactionId, __label, __viewType,
                            from_id, to_id, from_entityId, to_entityId, __timeStamp, content
                        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
                        "#,
                        &[
                            &edge_id,
                            &vertex.entity_id,
                            &effective_transaction_id,
                            &"supersededBy",
                            &vertex.view_type,
                            &vertex.original_id,
                            &"deleted",
                            &vertex.entity_id,
                            &vertex.entity_id,
                            &effective_timestamp,
                            &Json(&serde_json::Value::Null),
                        ],
                    )
                    .await?;
                }
            }
        }

    tx.commit().await?;
    info!("Update transaction committed successfully");

    Ok(())
    }
    .await;

    match update_result {
        Ok(()) => {
            if auto_managed_transaction {
                // Auto-managed mode finalizes the transaction only after all graph writes succeed.
                commit_transaction(db, &effective_transaction_id, effective_timestamp).await?;
            }
            Ok(())
        }
        Err(err) => {
            if auto_managed_transaction {
                // Best-effort rollback attempts to remove rows staged under this
                // auto-managed transaction before returning the original error.
                let _ = rollback_transaction(db, &effective_transaction_id, effective_timestamp).await;
            }
            Err(err)
        }
    }
}
