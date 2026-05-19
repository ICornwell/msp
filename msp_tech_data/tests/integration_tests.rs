mod common;

use std::net::SocketAddr;
use std::sync::Arc;

use deadpool_postgres::Pool;
use poem::{listener::TcpListener, EndpointExt, Route, Server};
use poem::middleware::Tracing;
use poem_openapi::OpenApiService;
use serde_json::json;
use tokio::task::JoinHandle;
use uuid::Uuid;

use docgraph::{
  api::{AppState, graph::GraphApi},
  db::GraphRepository,
  error::Result,
 };

// Test helper to start a real server for integration testing
async fn start_test_server(pool: Pool) -> (SocketAddr, JoinHandle<()>) {
    // Create app state
    let state = Arc::new(AppState {
        db_pool: pool.clone(),
    });
    
    // Create API instance
    let api = GraphApi::new(state.clone());
    
    let api_service = OpenApiService::new(api, "Test API", "1.0");
    let app = Route::new()
        .nest("/api", api_service)
        .with(Tracing);
    
    // Find an available port
    let bind_addr = "127.0.0.1:3900";
    let listener = TcpListener::bind(bind_addr);
    let addr: SocketAddr = bind_addr.parse().unwrap();
    
    // Start the server in the background
    let server_handle = tokio::spawn(async move {
        let _ = Server::new(listener).run(app).await;
    });
    
    // Give the server a moment to start
    tokio::time::sleep(tokio::time::Duration::from_millis(100)).await;
    
    (addr, server_handle)
}

#[tokio::test]
async fn test_full_lifecycle() -> Result<()> {
    // Arrange
    let pool = common::setup_test_db().await;
    
    // Set up database schema
    let repo = GraphRepository::new(pool.clone());
    repo.ensure_schema().await?;
    
    // Start a test server
    let (addr, server_handle) = start_test_server(pool.clone()).await;
    let base_url = format!("http://{}", addr);
    
    // Create a reqwest client for testing
    let client = reqwest::Client::new();

    let product_id = format!("product-{}",Uuid::now_v7());
    
    // Create test data - product and order item
    let p_id = product_id.clone();
    let product = json!({
       
        "__tmpId": p_id,
        "__label": product_id,
        "__viewType": "default",
        "content": {
            "name": "Test Product",
            "sku": "TP-123"
        }
    });
    let i_id = Uuid::now_v7();
    let order_item = json!({
       
        "__tmpId": i_id,
        "__label": "orderItem",
        "__viewType": "default",
        "content": {
            "quantity": 5,
            "unitPrice": 19.99
        }
    });
    
    let edge = json!({
        "id": Uuid::now_v7(),
        "__label": "forProduct",
        "__viewType": "default",
        "from": p_id,
        "to": i_id,
        "content": {}
    });
    
    // Create the update message
    let update_msg = json!({
        "add": {
            "vertices": [product, order_item],
            "edges": [edge]
        }
    });
    
    // Act - Part 1: Create the graph
    let response = client
        .put(&format!("{}/api/graph/update", base_url))
        .json(&update_msg)
        .send()
        .await
        .expect("Failed to send update request");
    
    // Assert - Part 1
   // assert!(response.status().is_success());
    let json_response: serde_json::Value = response.json().await.expect("Failed to parse JSON response");
    assert_eq!(true, json_response["success"]);
    
    // Act - Part 2: Query the graph
    // First, we need to get the real IDs that were assigned
    let client_pg = pool.get().await?;
    let qsql = format!("SELECT id FROM docgraph.vertices WHERE __label = '{}'", product_id.clone());
    let row = client_pg
        .query(
            &qsql,
            &[],
        )
        .await?;
    let product_key = row[0].get::<_, String>("id");
    
    // Create query message
    let query_msg = json!({
        "version": "1.0",
        "user": "test",
        "queryDate": "2023-10-15",
        "view": "default",
        "viewVersion": "1.0",
        "rootQueryKeyProperty": "id",
        "rootQueryKeyValue": product_key,
        "rootQueryKeyTypes": "all",
        "useEntityIdAsKey": false,
        "isLatestOnly": true,
        "timeStamp": 0,
        "queryType": "graph",
        "getObjects": [
            {
                "type": "product",
                "originalType": "product",
                "isQueryRoot": true,
                "queryObjectId": "p",
                "attributes": ["id", "name", "sku"]
            },
            {
                "type": "orderItem",
                "originalType": "orderItem",
                "isQueryRoot": false,
                "queryObjectId": "i",
                "attributes": ["id", "quantity", "unitPrice"]
            }
        ],
        "getRelations": [
            {
                "from": "p",
                "to": "i",
                "type": "forProduct",
                "reverse": false
            }
        ]
    });
    
    let response = client
        .put(&format!("{}/api/graph/query", base_url))
        .json(&query_msg)
        .send()
        .await
        .expect("Failed to send query request");
    
    // Assert - Part 2
    assert!(response.status().is_success());
    let json_response: serde_json::Value = response.json().await.expect("Failed to parse JSON response");
    assert_eq!(true, json_response["success"]);
    
    // Should have vertices and edges
    assert!(json_response["data"]["vertices"].is_array());
    assert!(json_response["data"]["edges"].is_array());
    
    // Should have 2 vertices (product, order item) and 1 edge (forProduct)
    assert_eq!(2, json_response["data"]["vertices"].as_array().unwrap().len());
    assert_eq!(1, json_response["data"]["edges"].as_array().unwrap().len());
    
    // Verify the content data is correct
    let vertices = json_response["data"]["vertices"].as_array().unwrap();
    let product_vertex = vertices.iter().find(|v| v["__label"] == product_id.clone()).unwrap();
    let order_item_vertex = vertices.iter().find(|v| v["__label"] == "orderItem").unwrap();
    
    assert_eq!("Test Product", product_vertex["content"]["name"]);
    assert_eq!("TP-123", product_vertex["content"]["sku"]);
    assert_eq!(5, order_item_vertex["content"]["quantity"]);
    assert_eq!(19.99, order_item_vertex["content"]["unitPrice"]);
    
    // Clean up
    server_handle.abort();
    
    Ok(())
}