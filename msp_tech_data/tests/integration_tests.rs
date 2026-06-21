mod common;

use std::net::SocketAddr;
use std::sync::Arc;

use deadpool_postgres::Pool;
use poem::listener::TcpListener;
use poem::middleware::Tracing;
use poem::{EndpointExt, Route, Server};
use poem_openapi::OpenApiService;
use serde_json::json;
use tokio::task::JoinHandle;
use uuid::Uuid;

use docgraph::{
    api::{AppState, graph::GraphApi},
    db::{DbClientManager, graph_setup, vertex_from_row},
    error::Result,
    model::Vertex,
};

struct GraphApiClient {
    client: reqwest::Client,
    base_url: String,
}

impl GraphApiClient {
    fn new(base_url: &str) -> Self {
        Self { client: reqwest::Client::new(), base_url: base_url.to_string() }
    }

    async fn update<T: serde::Serialize>(&self, body: &T, ctx: &str) -> reqwest::Response {
        self.client
            .put(format!("{}/api/graph/update", self.base_url))
            .json(body)
            .send()
            .await
            .expect(ctx)
    }

    async fn update_with_tid<T: serde::Serialize>(
        &self,
        body: &T,
        transaction_id: &str,
        ctx: &str,
    ) -> reqwest::Response {
        
        self.client
            .put(format!(
                "{}/api/graph/update?tid={}",
                self.base_url, transaction_id
            ))
            .json(body)
            .send()
            .await
            .expect(ctx)
    }

    async fn query<T: serde::Serialize>(&self, body: &T, ctx: &str) -> reqwest::Response {
        self.client
            .put(format!("{}/api/graph/query", self.base_url))
            .json(body)
            .send()
            .await
            .expect(ctx)
    }

    async fn commit(&self, transaction_id: &str, timestamp: i64) {
        let response = self.client
            .post(format!(
                "{}/api/graph/transaction?transaction_id={}&timestamp={}",
                self.base_url, transaction_id, timestamp
            ))
            .send()
            .await
            .expect("Failed to commit transaction");
        assert!(response.status().is_success());
    }

    async fn begin(&self, transaction_id: &str, timestamp: i64) {
        let response = self
            .client
            .get(format!(
                "{}/api/graph/transaction?transaction_id={}&timestamp={}",
                self.base_url, transaction_id, timestamp
            ))
            .send()
            .await
            .expect("Failed to begin transaction");
        assert!(response.status().is_success());
    }

    async fn rollback(&self, transaction_id: &str, timestamp: i64) {
        let response = self
            .client
            .delete(format!(
                "{}/api/graph/transaction?transaction_id={}&timestamp={}",
                self.base_url, transaction_id, timestamp
            ))
            .send()
            .await
            .expect("Failed to rollback transaction");
        assert!(response.status().is_success());
    }
}

// Test helper to start a real server for integration testing
async fn start_test_server(pool: Pool, bind_addr: String) -> (SocketAddr, JoinHandle<()>) {
    // Create app state
    let state = Arc::new(AppState {
        db: DbClientManager::from_pool(pool.clone()),
    });

    // Create API instance
    let api = GraphApi::new(state.clone());

    let api_service = OpenApiService::new(api, "Test API", "1.0");
    let app = Route::new().nest("/api", api_service).with(Tracing);

    // Use a caller-provided port so concurrently running tests don't collide.
    let listener = TcpListener::bind(bind_addr.clone());
    let addr: SocketAddr = bind_addr.parse().expect("Invalid test bind address");

    // Start the server in the background
    let server_handle = tokio::spawn(async move {
        let _ = Server::new(listener).run(app).await;
    });

    // Give the server a moment to start
    tokio::time::sleep(tokio::time::Duration::from_millis(100)).await;

    (addr, server_handle)
}

async fn fetch_vertex_by_business_key(pool: &Pool, business_key: &str) -> Result<Vertex> {
    let client = pool.get().await?;
    let sql = r#"
        SELECT 'v' AS otype, id, __originalId, __entityId, __transactionid, __label,
               __isEntity, __viewtype, __timestamp, __businessKey, __alternateKey, content,
               'na' AS from_id, 'na' AS to_id
        FROM docgraph.vertices
        WHERE __businessKey = $1
        ORDER BY __timestamp DESC
        LIMIT 1
    "#;
    let rows = client.query(sql, &[&business_key]).await?;
    Ok(vertex_from_row(&rows[0]))
}



#[tokio::test]
async fn test_full_lifecycle() -> Result<()> {
    // Arrange
    let pool = common::setup_test_db().await;

    // Set up database schema
    let db = DbClientManager::from_pool(pool.clone());
    graph_setup::ensure_schema(&db).await?;

    // Start a test server
    let (addr, server_handle) = start_test_server(pool.clone(), "127.0.0.1:3900".to_string()).await;
    let base_url = format!("http://{}", addr);

    let api = GraphApiClient::new(&base_url);

    let product_id = format!("product-{}", Uuid::now_v7());

    // Create test data - product and order item
    let p_id = product_id.clone();
    let product = json!({

        "__tmpId": p_id,
        "__label": product_id,
        "__viewType": "default",
        "__isEntity": true,
        "__timeStamp": 0,
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
         "__isEntity": false,
        "__timeStamp": 0,
        "content": {
            "quantity": 5,
            "unitPrice": 19.99
        }
    });

    let edge = json!({
        "id": Uuid::now_v7(),
        "__label": "forProduct",
        "__viewType": "default",
        "__isEntity": false,
        "__timeStamp": 0,
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
    let response = api.update(&update_msg, "Failed to send update request").await;

    // Assert - Part 1
    // assert!(response.status().is_success());
    let json_response: serde_json::Value = response
        .json()
        .await
        .expect("Failed to parse JSON response");
    assert_eq!(true, json_response["success"]);

    // Act - Part 2: Query the graph
    // First, we need to get the real IDs that were assigned
    let client_pg = pool.get().await?;
    let qsql = format!(
        "SELECT id FROM docgraph.vertices WHERE __label = '{}'",
        product_id.clone()
    );
    let row = client_pg.query(&qsql, &[]).await?;
    let product_key = row[0].get::<_, String>("id");

    // Create query message
    let query_msg = json!({
        "version": "1.0",
        "user": "test",
        "queryDate": "2023-10-15",
        "view": "default",
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

    let response = api.query(&query_msg, "Failed to send query request").await;

    // Assert - Part 2
    assert!(response.status().is_success());
    let json_response: serde_json::Value = response
        .json()
        .await
        .expect("Failed to parse JSON response");
    assert_eq!(true, json_response["success"]);

    // Should have vertices and edges
    assert!(json_response["data"]["vertices"].is_array());
    assert!(json_response["data"]["edges"].is_array());

    // Should have 2 vertices (product, order item) and 1 edge (forProduct)
    assert_eq!(
        2,
        json_response["data"]["vertices"].as_array().unwrap().len()
    );
    assert_eq!(1, json_response["data"]["edges"].as_array().unwrap().len());

    // Verify the content data is correct
    let vertices = json_response["data"]["vertices"].as_array().unwrap();
    let product_vertex = vertices
        .iter()
        .find(|v| v["__label"] == product_id.clone())
        .unwrap();
    let order_item_vertex = vertices
        .iter()
        .find(|v| v["__label"] == "orderItem")
        .unwrap();

    assert_eq!("Test Product", product_vertex["content"]["name"]);
    assert_eq!("TP-123", product_vertex["content"]["sku"]);
    assert_eq!(5, order_item_vertex["content"]["quantity"]);
    assert_eq!(19.99, order_item_vertex["content"]["unitPrice"]);

    // Clean up
    server_handle.abort();

    Ok(())
}

#[tokio::test]
async fn test_query_snapshot_at_timestamp() -> Result<()> {
    let pool = common::setup_test_db().await;
    let db = DbClientManager::from_pool(pool.clone());
    graph_setup::ensure_schema(&db).await?;

    let (addr, server_handle) = start_test_server(pool.clone(), "127.0.0.1:3901".to_string()).await;
    let base_url = format!("http://{}", addr);
    let api = GraphApiClient::new(&base_url);
    let scenario = common::fixtures::snapshot_history_scenario();

        api.begin(&scenario.tx_create, scenario.ts_create).await;
        assert!(api.update_with_tid(&scenario.initial_add_message(), &scenario.tx_create, "Failed to create base graph").await.status().is_success());
    api.commit(&scenario.tx_create, scenario.ts_create).await;

    let persisted_product = fetch_vertex_by_business_key(&pool, &scenario.fixture.product.business_key).await?;
        api.begin(&scenario.tx_price_v2, scenario.ts_price_v2).await;
        assert!(api.update_with_tid(&scenario.price_update_v2_message(&persisted_product), &scenario.tx_price_v2,
         "Failed to send v2 update").await.status().is_success());
    api.commit(&scenario.tx_price_v2, scenario.ts_price_v2).await;

    let persisted_product_v2 = fetch_vertex_by_business_key(&pool, &scenario.fixture.product.business_key).await?;
        api.begin(&scenario.tx_price_v3, scenario.ts_price_v3).await;
        assert!(api.update_with_tid(&scenario.price_update_v3_message(&persisted_product_v2), &scenario.tx_price_v3,
         "Failed to send v3 update").await.status().is_success());

    let query_msg = scenario.query_at_timestamp(&persisted_product.entity_id, scenario.ts_price_v2);
    let response = api.query(&query_msg, 
            "Failed to query snapshot").await;

    assert!(response.status().is_success());
    let json_response: serde_json::Value = response.json().await.expect("Failed to parse JSON response");
    assert_eq!(true, json_response["success"]);
    let vertices = json_response["data"]["vertices"].as_array().unwrap();
    assert_eq!(1, vertices.len());
    assert_eq!(scenario.price_v2, vertices[0]["content"]["unitPrice"]);

    server_handle.abort();
    Ok(())
}

#[tokio::test]
async fn test_query_read_committed_fallback_when_latest_uncommitted() -> Result<()> {
    let pool = common::setup_test_db().await;
    let db = DbClientManager::from_pool(pool.clone());
    graph_setup::ensure_schema(&db).await?;

    let (addr, server_handle) = start_test_server(pool.clone(), "127.0.0.1:3902".to_string()).await;
    let base_url = format!("http://{}", addr);
    let api = GraphApiClient::new(&base_url);
    let scenario = common::fixtures::read_committed_fallback_scenario();

    api.begin(&scenario.tx_create, scenario.ts_create).await;
    assert!(api.update_with_tid(&scenario.initial_add_message(), &scenario.tx_create,
        "Failed to create base graph").await.status().is_success());
    api.commit(&scenario.tx_create, scenario.ts_create).await;

    let persisted_product = fetch_vertex_by_business_key(&pool, &scenario.fixture.product.business_key).await?;
    api.begin(&scenario.tx_committed_update, scenario.ts_committed_update).await;
    assert!(api.update_with_tid(&scenario.committed_price_update_message(&persisted_product), &scenario.tx_committed_update,
        "Failed to send committed update").await.status().is_success());
    api.commit(&scenario.tx_committed_update, scenario.ts_committed_update).await;

    let persisted_product_committed = fetch_vertex_by_business_key(&pool, &scenario.fixture.product.business_key).await?;
    api.begin(&scenario.tx_pending_update, scenario.ts_pending_update).await;
    assert!(api.update_with_tid(&scenario.pending_price_update_message(&persisted_product_committed), &scenario.tx_pending_update,
         "Failed to send pending update").await.status().is_success());

    let query_msg = scenario.query_without_pending_tx(&persisted_product.entity_id);
    let response = api.query(&query_msg, "Failed to query committed snapshot").await;

    assert!(response.status().is_success());
    let json_response: serde_json::Value = response.json().await.expect("Failed to parse JSON response");
    assert_eq!(true, json_response["success"]);
    assert_eq!(1, json_response["data"]["vertices"].as_array().unwrap().len());
    assert_eq!(scenario.expected_read_committed_price(),
         json_response["data"]["vertices"][0]["content"]["unitPrice"]);

    server_handle.abort();
    Ok(())
}

#[tokio::test]
async fn test_rollback_preserves_transaction_audit_markers() -> Result<()> {
    let pool = common::setup_test_db().await;
    let db = DbClientManager::from_pool(pool.clone());
    graph_setup::ensure_schema(&db).await?;

    let (addr, server_handle) = start_test_server(pool.clone(), "127.0.0.1:3903".to_string()).await;
    let base_url = format!("http://{}", addr);
    let api = GraphApiClient::new(&base_url);

    let transaction_id = Uuid::now_v7().to_string();
    let timestamp = 1_710_200_000;

    api.begin(&transaction_id, timestamp).await;

    let add_msg = json!({
        "add": {
            "vertices": [
                {
                    "__tmpId": format!("product-{}", Uuid::now_v7()),
                    "__label": "product",
                    "__viewType": "default",
                    "__isEntity": true,
                    "__timeStamp": 0,
                    "content": { "name": "Rollback Audit Product" }
                }
            ]
        }
    });

    let update_response = api
        .update_with_tid(&add_msg, &transaction_id, "Failed to send rollback-seed update")
        .await;
    assert!(update_response.status().is_success());

    api.rollback(&transaction_id, timestamp).await;

    let client = pool.get().await?;

    let vertex_rows = client
        .query(
            r#"
            SELECT id, __label
            FROM docgraph.vertices
            WHERE __transactionid = $1
            ORDER BY id
            "#,
            &[&transaction_id],
        )
        .await?;
    assert_eq!(1, vertex_rows.len());
    assert_eq!(transaction_id, vertex_rows[0].get::<_, String>("id"));
    assert_eq!("__transaction", vertex_rows[0].get::<_, String>("__label"));

    let edge_rows = client
        .query(
            r#"
            SELECT id, __label, from_id, to_id
            FROM docgraph.edges
            WHERE __transactionid = $1
            ORDER BY id
            "#,
            &[&transaction_id],
        )
        .await?;
    assert_eq!(1, edge_rows.len());
    assert_eq!(transaction_id, edge_rows[0].get::<_, String>("id"));
    assert_eq!("__rolledBack", edge_rows[0].get::<_, String>("__label"));
    assert_eq!(transaction_id, edge_rows[0].get::<_, String>("from_id"));
    assert_eq!(transaction_id, edge_rows[0].get::<_, String>("to_id"));

    server_handle.abort();
    Ok(())
}

#[tokio::test]
async fn test_rollback_removes_staged_domain_rows() -> Result<()> {
    let pool = common::setup_test_db().await;
    let db = DbClientManager::from_pool(pool.clone());
    graph_setup::ensure_schema(&db).await?;

    let (addr, server_handle) = start_test_server(pool.clone(), "127.0.0.1:3904".to_string()).await;
    let base_url = format!("http://{}", addr);
    let api = GraphApiClient::new(&base_url);

    let transaction_id = Uuid::now_v7().to_string();
    let timestamp = 1_710_300_000;
    let staged_business_key = format!("rollback-staged-bk-{}", Uuid::now_v7());

    api.begin(&transaction_id, timestamp).await;

    let add_msg = json!({
        "add": {
            "vertices": [
                {
                    "__tmpId": format!("product-{}", Uuid::now_v7()),
                    "__label": "product",
                    "__viewType": "default",
                    "__isEntity": true,
                    "__businessKey": staged_business_key,
                    "__timeStamp": 0,
                    "content": { "name": "Rollback Removal Product" }
                }
            ]
        }
    });

    let update_response = api
        .update_with_tid(&add_msg, &transaction_id, "Failed to send rollback-removal update")
        .await;
    assert!(update_response.status().is_success());

    api.rollback(&transaction_id, timestamp).await;

    let client = pool.get().await?;

    let staged_vertices_count: i64 = client
        .query_one(
            r#"
            SELECT COUNT(*)::BIGINT AS count
            FROM docgraph.vertices
            WHERE __transactionid = $1
              AND id <> $1
            "#,
            &[&transaction_id],
        )
        .await?
        .get("count");
    assert_eq!(0, staged_vertices_count);

    let staged_edges_count: i64 = client
        .query_one(
            r#"
            SELECT COUNT(*)::BIGINT AS count
            FROM docgraph.edges
            WHERE __transactionid = $1
              AND id <> $1
            "#,
            &[&transaction_id],
        )
        .await?
        .get("count");
    assert_eq!(0, staged_edges_count);

    let staged_business_key_count: i64 = client
        .query_one(
            r#"
            SELECT COUNT(*)::BIGINT AS count
            FROM docgraph.vertices
            WHERE __businessKey = $1
            "#,
            &[&staged_business_key],
        )
        .await?
        .get("count");
    assert_eq!(0, staged_business_key_count);

    server_handle.abort();
    Ok(())
}

