use tracing::{debug, info};

use crate::error::Result;

use super::DbClientManager;

pub async fn ensure_db_setup(db: &DbClientManager) -> Result<()> {
    ensure_schema(db).await
}

pub async fn ensure_schema(db: &DbClientManager) -> Result<()> {
    let client = db.get_client().await?;
    debug!("Creating database schema if it doesn't exist");

    // DDL is intentionally idempotent so startup/deploy code can call it repeatedly
    // across environments without requiring migration state checks.
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

                -- These indexes match common graph access paths (label/type lookups,
                -- identity/version traversals, and edge fan-in/fan-out joins).
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
            "#,
        )
        .await?;

    info!("Database schema setup completed successfully");
    Ok(())
}
