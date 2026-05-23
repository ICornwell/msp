use std::{sync::Arc, time::Duration};

use docgraph::{api::{self, graph::GraphApi}, config::AppConfig, db};
use poem::{listener::TcpListener, middleware::Tracing, EndpointExt, Route, Server};
use poem_openapi::OpenApiService;
use tokio::signal;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    // Initialize logging
    if std::env::var_os("RUST_LOG").is_none() {
        unsafe{
            std::env::set_var("RUST_LOG", "info,docgraph=debug,poem=debug");
        }
    }
    tracing_subscriber::fmt::init();

    // Load configuration
    let config = AppConfig::load()?;
    tracing::info!("Configuration loaded successfully");
    
    // Set up database client manager and connection pool
    let db = db::DbClientManager::from_config(&config)?;
    tracing::info!("Database client manager established");
    
    // Initialize database (ensure tables exist)
    db::graph_setup::ensure_db_setup(&db).await?;
    tracing::info!("Database schema initialized");
    
    // Create shared application state
    let app_state = Arc::new(api::AppState { db });
    
    // Create API service
    let graph_api = GraphApi::new(app_state.clone());
    
    let api_service = OpenApiService::new(graph_api, "DocGraph API", env!("CARGO_PKG_VERSION"))
        .server(format!("http://{}:{}/api", config.server.host, config.server.port));

    // Create a clone of the OpenApiService for the spec endpoint
    let api_service_spec = api_service.spec_endpoint();
    
    // In poem v3, OpenApiService::swagger_ui() returns a SwaggerUiEndpoint
    // which needs to be wrapped in an endpoint
    let swagger_ui = api_service.swagger_ui();
    
    // Create and run the server
    let app = Route::new()
        .nest("/api", api_service)
        .nest("/swagger", swagger_ui)
        .at("/openapi.json", api_service_spec)
        .with(Tracing);
    
    tracing::info!("Starting server at http://{}:{}", config.server.host, config.server.port);
    let server = Server::new(TcpListener::bind(format!("{}:{}", config.server.host, config.server.port)));
    
    server.run_with_graceful_shutdown(app, async {
        let _ = signal::ctrl_c().await;
        tracing::info!("Shutdown signal received, shutting down gracefully");
    }, Some(Duration::from_secs(60))).await?;
    
    Ok(())
}