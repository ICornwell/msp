use deadpool_postgres::{Config, Pool, Runtime};
use serde_json::json;
use std::sync::Once;
use uuid::Uuid;

// Instead of trying to import docgraph, use the crate keyword
// which refers to the crate being tested

use docgraph::model::{Vertex, Edge};

static INIT: Once = Once::new();

// Set up test database
pub async fn setup_test_db() -> deadpool_postgres::Pool {
    INIT.call_once(|| {
        // Initialize logging for tests
        let _ = tracing_subscriber::fmt::try_init();
    });
    
    // Use a unique schema for each test to allow parallel testing
    let schema = format!("test_{}", Uuid::now_v7().to_string().replace("-", "_"));
    
    // Connect to test database
    let mut config = Config::new();
    config.host = Some("localhost".to_string());
    config.dbname = Some("docgraph".to_string());
    config.user = Some("docgraph".to_string());
    config.password = Some("docgraph".to_string());
    
    let pool = config.create_pool(Some(Runtime::Tokio1), tokio_postgres::NoTls)
        .expect("Failed to create connection pool");
        
    // Create test schema
    let client = pool.get().await.expect("Failed to get client");
    client.batch_execute(&format!("CREATE SCHEMA IF NOT EXISTS {}", schema))
        .await
        .expect("Failed to create schema");
        
    pool
}

// Clean up after tests
pub async fn teardown_test_db(pool: deadpool_postgres::Pool, schema: &str) {
    let client = pool.get().await.expect("Failed to get client");
    client.batch_execute(&format!("DROP SCHEMA IF EXISTS {} CASCADE", schema))
        .await
        .expect("Failed to drop schema");
}

// Create test data
pub fn create_test_vertex(label: &str) -> Vertex {
    Vertex {
        id: Uuid::now_v7().to_string(),
        entity_id: Uuid::now_v7().to_string(),
        transaction_id: Uuid::now_v7().to_string(),
        label: label.to_string(),
        view_type: "default".to_string(),
        timestamp: chrono::Utc::now().timestamp(),
        content: json!({"test": "data"}),
        original_id: "".to_string(),
        tmp_id: "".to_string(),
        view_managed_edges: Vec::new(),
        business_key: format!("bk_{}", Uuid::now_v7().to_string()),
        alternate_key: "".to_string(),
        is_entity: true,
    }
}

pub fn create_test_edge(from: &Vertex, to: &Vertex, label: &str) -> Edge {
    Edge {
        id: Uuid::now_v7().to_string(),
        entity_id: Uuid::now_v7().to_string(),
        transaction_id: Uuid::now_v7().to_string(),
        label: label.to_string(),
        view_type: "default".to_string(),
        from: from.id.clone(),
        to: to.id.clone(),
        from_entity_id: from.entity_id.clone(),
        to_entity_id: to.entity_id.clone(),
        timestamp: chrono::Utc::now().timestamp(),
        content: json!({}),
    }
}

pub fn create_basic_test_graph() -> (Vec<Vertex>, Vec<Edge>) {
    let vertex1 = create_test_vertex("Person");
    let vertex2 = create_test_vertex("Product");
    let vertex3 = create_test_vertex("Order");
    
    let edge1 = create_test_edge(&vertex1, &vertex3, "placed");
    let edge2 = create_test_edge(&vertex3, &vertex2, "contains");
    
    (vec![vertex1, vertex2, vertex3], vec![edge1, edge2])
}
