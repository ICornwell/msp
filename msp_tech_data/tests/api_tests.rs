mod common;

use std::sync::Arc;

use poem::{ Route, test::TestClient };
use poem_openapi::OpenApiService;
use serde_json::{ json, Value };


use docgraph::{
    api::{ AppState, graph::GraphApi },
    db::DbClientManager,
    error::Result,
    model::{ GraphElements, UpdateMessage },
};

#[tokio::test]
async fn test_api_hello_endpoint() -> Result<()> {
    // Arrange
    let pool = common::setup_test_db().await;

    // Create app state
    let state = Arc::new(AppState {
        db: DbClientManager::from_pool(pool.clone()),
    });

    // Create API instance
    let api = GraphApi::new(state.clone());

    let api_service = OpenApiService::new(api, "Test API", "1.0");
    let app = Route::new().nest("/api", api_service);
    let client = TestClient::new(app);

    // Act
    let resp = client.get("/api/graph/hello").send().await;

    // Assert
    resp.assert_status_is_ok();
    resp.assert_text("Welcome to DocGraph DB Gateway API").await;

    Ok(())
}

#[tokio::test]
async fn test_api_with_name_parameter() -> Result<()> {
    // Arrange
    let pool = common::setup_test_db().await;

    // Create app state
    let state = Arc::new(AppState {
        db: DbClientManager::from_pool(pool.clone()),
    });

    // Create API instance
    let api = GraphApi::new(state.clone());

    let api_service = OpenApiService::new(api, "Test API", "1.0");
    let app = Route::new().nest("/api", api_service);
    let client = TestClient::new(app);

    // Act
    let resp = client.get("/api/graph/hello?name=TestUser").send().await;

    // Assert
    resp.assert_status_is_ok();
    resp.assert_text("Hello, TestUser!").await;

    Ok(())
}

#[tokio::test]
async fn test_api_ensure_db() -> Result<()> {
    // Arrange
    let pool = common::setup_test_db().await;

    // Create app state
    let state = Arc::new(AppState {
        db: DbClientManager::from_pool(pool.clone()),
    });

    // Create API instance
    let api = GraphApi::new(state.clone());

    let api_service = OpenApiService::new(api, "Test API", "1.0");
    let app = Route::new().nest("/api", api_service);
    let client = TestClient::new(app);

    // Act
    let resp = client.post("/api/graph/db").send().await;

    // Get the body as bytes
    resp.assert_status_is_ok();

    resp.assert_json(json!({"entity_ids": Value::Null,"message": "Operation completed successfully", "success": true, "update_message": Value::Null})).await;

    Ok(())
}

#[tokio::test]
async fn test_api_update_graph() -> Result<()> {
    // Arrange
    let pool = common::setup_test_db().await;

    // Create app state
    let state = Arc::new(AppState {
        db: DbClientManager::from_pool(pool.clone()),
    });

    // Create API instance
    let api = GraphApi::new(state.clone());

    let api_service = OpenApiService::new(api, "Test API", "1.0");

    let app = Route::new().nest("/api", api_service);
    let client = TestClient::new(app);

    // Set up database
    client.post("/api/graph/db").send().await;

    // Create test data
    let (vertices, edges) = common::create_basic_test_graph();

    // Create update message
    let update_msg = UpdateMessage {
        add: Some(GraphElements {
            vertices: Some(vertices.clone()),
            edges: Some(edges.clone()),
        }),
        update: None,
        delete: None,
    };

    let json_msg = serde_json::to_string(&update_msg).unwrap();
    println!("{}", json_msg);
    // Act
    let resp = client
        .put("/api/graph/update?response_type=execute")
        .body_json(&update_msg)
        .send().await;

    let _a = resp.json().await;
    // Assert
    //  resp.assert_status_is_ok();
    //  resp.assert_json(json!({"success": true})).await;

    Ok(())
}

#[tokio::test]
async fn test_api_query_graph() -> Result<()> {
    // Arrange
    let pool = common::setup_test_db().await;

    // Create app state
    let state = Arc::new(AppState {
        db: DbClientManager::from_pool(pool.clone()),
    });

    // Create API instance
    let api = GraphApi::new(state.clone());

    let api_service = OpenApiService::new(api, "Test API", "1.0");
    let app = Route::new().nest("/api", api_service);
    let client = TestClient::new(app);

    // Set up database
    client.post("/api/graph/db").send().await;

    // Create test data
    let person = common::create_test_vertex("Person");

    // Add data
    let update_msg = UpdateMessage {
        add: Some(GraphElements {
            vertices: Some(vec![person.clone()]),
            edges: None,
        }),
        update: None,
        delete: None,
    };

    let update_resp = client
        .put("/api/graph/update")
        .header("Content-Type", "application/json")
        .body_json(&update_msg)
        .send().await;

    let body_bytes = update_resp.0.into_body().into_vec().await.unwrap();

    // Convert bytes to string
    let body_str = String::from_utf8(body_bytes).unwrap();

    // Log the raw JSON string
    println!("Raw response body: {}", body_str);

    // update_resp.assert_status_is_ok();

    // Create query message
    let query_msg =
        json!({
        "version": "1.0",
        "user": "test",
        "queryDate": "2023-10-15",
        "view": "default",
        "rootQueryKeyProperty": "id",
        "rootQueryKeyValue": person.entity_id,
        "rootQueryKeyTypes": "all",
        "useEntityIdAsKey": false,
        "isLatestOnly": true,
        "timeStamp": 0,
        "queryType": "graph",
        "getObjects": [
            {
                "type": "Person",
                "originalType": "Person",
                "isQueryRoot": true,
                "queryObjectId": "p",
                "attributes": ["id"]
            }
        ],
        "getRelations": []
    });

    // Act
    let resp = client.put("/api/graph/query").body_json(&query_msg).send().await;

    // Assert
    resp.assert_status_is_ok();
    let body = resp.json().await;
    let body_value = body.value();
    assert_eq!(true, body_value.object().get("success").bool());

    assert_eq!(false, body_value.object().get("data").object().get("vertices").array().is_empty());

    // Should have 1 vertex (person)
    assert_eq!(1, body_value.object().get("data").object().get("vertices").array().len());

    Ok(())
}
