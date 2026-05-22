use deadpool_postgres::{ Client, Pool };
use tokio_postgres::types::Json;
use uuid::Uuid;
use tracing::{ debug, info };

use crate::{
    db::check_business_key_conflicts, error::{ DocGraphError, Result }, model::{ QueryMessage, QueryResponse, UpdateMessage }
};

use super::query::read_data;

/// Database access struct that handles all database operations
pub struct GraphRepository {
    pool: Pool,
}

impl GraphRepository {
    /// Create a new database repository with the provided connection pool
    pub fn new(pool: Pool) -> Self {
        Self { pool }
    }

    /// Get a client from the connection pool
    pub async fn get_client(&self) -> Result<Client> {
        self.pool.get().await.map_err(DocGraphError::from)
    }

    /// Ensure the database schema exists
    pub async fn ensure_schema(&self) -> Result<()> {
        let client = self.get_client().await?;
        debug!("Creating database schema if it doesn't exist");

        // Create schema and tables if they don't exist
        client
            .batch_execute(
                r#"
                CREATE SCHEMA IF NOT EXISTS docgraph;

                CREATE TABLE IF NOT EXISTS docgraph.vertices (
                    id VARCHAR(36) PRIMARY KEY,
                    __originalId VARCHAR(36) NOT NULL,
                    __entityId VARCHAR(36) NOT NULL,
                    __transactionId VARCHAR(36) NOT NULL,
                    __label VARCHAR(150) NOT NULL,
                    __isEntity BOOLEAN NOT NULL,
                    __viewType VARCHAR(200) NOT NULL,
                    __timeStamp BIGINT NOT NULL,
                    __businessKey VARCHAR(300),
                    __alternateKey VARCHAR(300),
                    content JSONB NOT NULL
                );

                CREATE INDEX IF NOT EXISTS idx_vertices_label ON docgraph.vertices(__label);
                CREATE INDEX IF NOT EXISTS idx_vertices_original_id ON docgraph.vertices(__originalId);
                CREATE INDEX IF NOT EXISTS idx_vertices_entity_id ON docgraph.vertices(__entityId);
                CREATE INDEX IF NOT EXISTS idx_vertices_is_entity ON docgraph.vertices(__isEntity);
                CREATE INDEX IF NOT EXISTS idx_vertices_alternate_key ON docgraph.vertices(__alternateKey);

                CREATE TABLE IF NOT EXISTS docgraph.edges (
                    id VARCHAR(36) PRIMARY KEY,
                    __entityId VARCHAR(36) NOT NULL,
                    __transactionId VARCHAR(36) NOT NULL,
                    __label VARCHAR(150) NOT NULL,
                    __viewType VARCHAR(200) NOT NULL,
                    from_id VARCHAR(36) NOT NULL,
                    to_id VARCHAR(36) NOT NULL,
                    from_entityId VARCHAR(36) NOT NULL,
                    to_entityId VARCHAR(36) NOT NULL,
                    __timeStamp BIGINT NOT NULL,
                    content JSONB NOT NULL
                );

                CREATE INDEX IF NOT EXISTS idx_edges_label ON docgraph.edges(__label);
                CREATE INDEX IF NOT EXISTS idx_edges_from_id ON docgraph.edges(from_id);
                CREATE INDEX IF NOT EXISTS idx_edges_to_id ON docgraph.edges(to_id);
                "#
            ).await
            .map_err(DocGraphError::Database)?;

        info!("Database schema setup completed successfully");
        Ok(())
    }

    /// Process an update message to add, update, or delete graph elements
    pub async fn process_update(&self, message: UpdateMessage, transaction_id: String, timestamp: i64) -> Result<()> {
        // Get a client for the transaction
        let mut client = self.get_client().await?;

        // check for duplicated business keys before making any changes
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
        let conflicts = check_business_key_conflicts(&mut client, &vertices_to_check).await?;
        if !conflicts.is_empty() {
            let conflict_info: Vec<String> = conflicts                .iter()
                .map(|v| format!("Conflict on business key '{}' for vertex with original ID '{}'", v.business_key, v.original_id))
                .collect();
            let error_message = format!("Business key conflicts detected: {}", conflict_info.join("; "));
            debug!("{}", error_message);
            return Err(DocGraphError::Validation(error_message));
        }

                // Start a transaction
        let tx = client.transaction().await.map_err(DocGraphError::Database)?;
        debug!("Started database transaction for update");

        // Process adds
        if let Some(add) = &message.add {
            // Insert vertices
            if let Some(vertices) = &add.vertices {
                for vertex in vertices {
                    debug!("Adding vertex with label: {}", vertex.label);
                    tx
                        .execute(
                            r#"
                        INSERT INTO docgraph.vertices (
                            id, __originalId, __entityId, __transactionId, __label, __isEntity, __viewType, __timeStamp, __businessKey, __alternateKey, content
                        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
                        "#,
                            &[
                                &vertex.id,
                                &vertex.id,
                                &vertex.entity_id,
                                &transaction_id,
                                &vertex.label,
                                &vertex.is_entity,
                                &vertex.view_type,
                                &timestamp,
                                &vertex.business_key,
                                &vertex.alternate_key,
                                &Json(&vertex.content),
                            ]
                        ).await
                        .map_err(DocGraphError::Database)?;
                }
            }

            // Insert edges
            if let Some(edges) = &add.edges {
                for edge in edges {
                    debug!("Adding edge with label: {}", edge.label);
                    tx
                        .execute(
                            r#"
                        INSERT INTO docgraph.edges (
                            id, __entityId, __transactionId, __label, __viewType, 
                            from_id, to_id, from_entityId, to_entityId, __timeStamp, content
                        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
                        "#,
                            &[
                                &edge.id,
                                &edge.entity_id,
                                &transaction_id,
                                &edge.label,
                                &edge.view_type,
                                &edge.from,
                                &edge.to,
                                &edge.from_entity_id,
                                &edge.to_entity_id,
                                &timestamp,
                                &Json(&edge.content),
                            ]
                        ).await
                        .map_err(DocGraphError::Database)?;
                }
            }
        }

        // Process updates (using the append-only pattern with supersededBy edges)
        if let Some(update) = &message.update {
            if let Some(vertices) = &update.vertices {
                for vertex in vertices {
                    let updated_vertex = &vertex.clone_with_new_id(Uuid::now_v7().to_string());

                    debug!("Updating vertex with id: {}", vertex.id);
                    // First, insert the new vertex version
                    tx
                        .execute(
                            r#"
                        INSERT INTO docgraph.vertices (
                            id, __originalId, __entityId, __transactionId, __label, __isEntity, __viewType, __timeStamp, __businessKey, __alternateKey, content
                        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
                        "#,
                            &[
                                &updated_vertex.id,
                                &updated_vertex.original_id,
                                &updated_vertex.entity_id,
                                &transaction_id,
                                &updated_vertex.label,
                                &updated_vertex.is_entity,
                                &updated_vertex.view_type,
                                &timestamp,
                                &updated_vertex.business_key,
                                &updated_vertex.alternate_key,
                                &Json(&updated_vertex.content),
                            ]
                        ).await
                        .map_err(DocGraphError::Database)?;

                    // Then, add the supersededBy edge from the old to the new
                    if !vertex.original_id.is_empty() {
                        let edge_id = Uuid::now_v7().to_string();
                        debug!(
                            "Adding supersededBy edge from {} to {}",
                            updated_vertex.original_id,
                            updated_vertex.id
                        );
                        tx
                            .execute(
                                r#"
                            INSERT INTO docgraph.edges (
                                id, __entityId, __transactionId, __label, __viewType, 
                                from_id, to_id, from_entityId, to_entityId, __timeStamp, content
                            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
                            "#,
                                &[
                                    &edge_id,
                                    &updated_vertex.entity_id,
                                    &transaction_id,
                                    &"supersededBy",
                                    &updated_vertex.view_type,
                                    &updated_vertex.original_id,
                                    &updated_vertex.id,
                                    &updated_vertex.entity_id,
                                    &updated_vertex.entity_id,
                                    &timestamp,
                                    &Json(&serde_json::Value::Null),
                                ]
                            ).await
                            .map_err(DocGraphError::Database)?;
                    }     
                    // copy forward edges that point to the old version to point to the new version
                     if !updated_vertex.original_id.is_empty() {
                        debug!("Copying forward edges for updated vertex {}", updated_vertex.id);
                        tx
                            .query(
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
                                &[&updated_vertex.id,
                                &updated_vertex.id,
                                &updated_vertex.original_id,
                                &transaction_id,
                                &timestamp,
                                &updated_vertex.view_managed_edges.join(", ")],
                            )
                            .await
                            .map_err(DocGraphError::Database)?;
                        
                        tx
                            .query(
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
                                &[&updated_vertex.id,
                                &updated_vertex.id, 
                                &updated_vertex.original_id,
                                &transaction_id,
                                &timestamp,
                                &updated_vertex.view_managed_edges.join(", ")],
                            )
                            .await
                            .map_err(DocGraphError::Database)?;
                    }
                }
            }

            // For edges, simply add updated versions
            if let Some(edges) = &update.edges {
                for edge in edges {
                    debug!("Updating edge with id: {}", edge.id);
                    tx
                        .execute(
                            r#"
                        INSERT INTO docgraph.edges (
                            id, __entityId, __transactionId, __label, __viewType, 
                            from_id, to_id, from_entityId, to_entityId, __timeStamp, content
                        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
                        "#,
                            &[
                                &edge.id,
                                &edge.entity_id,
                                &edge.transaction_id,
                                &edge.label,
                                &edge.view_type,
                                &edge.from,
                                &edge.to,
                                &edge.from_entity_id,
                                &edge.to_entity_id,
                                &edge.timestamp,
                                &Json(&edge.content),
                            ]
                        ).await
                        .map_err(DocGraphError::Database)?;
                }
            }
        }
        

        // Process deletes (logical delete via supersededBy edges)
        if let Some(delete) = &message.delete {
            // For vertices, add a supersededBy edge pointing to nothing
            if let Some(vertices) = &delete.vertices {
                for vertex in vertices {
                    let edge_id = Uuid::now_v7().to_string();
                    debug!("Marking vertex {} as deleted", vertex.id);
                    tx
                        .execute(
                            r#"
                        INSERT INTO docgraph.edges (
                            id, __entityId, __transactionId, __label, __viewType, 
                            from_id, to_id, from_entityId, to_entityId, __timeStamp, content
                        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
                        "#,
                            &[
                                &edge_id,
                                &vertex.entity_id,
                                &transaction_id,
                                &"supersededBy",
                                &vertex.view_type,
                                &vertex.original_id,
                                &"deleted", // Special marker for deleted nodes
                                &vertex.entity_id,
                                &vertex.entity_id,
                                &timestamp,
                                &Json(&serde_json::Value::Null),
                            ]
                        ).await
                        .map_err(DocGraphError::Database)?;
                }
            }
        }

        // Commit the transaction
        tx.commit().await.map_err(DocGraphError::Database)?;
        info!("Update transaction committed successfully");

        Ok(())
    }

    /// Process an update message to add, update, or delete graph elements
    pub async fn query(&self, message: QueryMessage) -> Result<QueryResponse> {
        // Get a client for the transaction
        let client = self.get_client().await?;

        read_data(client, message).await
    }
}
