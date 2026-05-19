use std::{sync::Arc, time::Duration};

// use config::Config;
use deadpool_postgres::{Config as PgConfig, Pool, Runtime};
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
    
    // Set up database connection pool
    let pool = create_pg_pool(&config)?;
    tracing::info!("Database connection pool established");
    
    // Initialize database (ensure tables exist)
    db::setup::ensure_db_setup(&pool).await?;
    tracing::info!("Database schema initialized");
    
    // Create shared application state
    let app_state = Arc::new(api::AppState { db_pool: pool });
    
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

fn create_pg_pool(config: &AppConfig) -> Result<Pool, Box<dyn std::error::Error>> {
    let pg_config = PgConfig {
        host: Some(config.database.host.clone()),
        dbname: Some(config.database.name.clone()),
        user: Some(config.database.user.clone()),
        password: Some(config.database.password.clone()),
        application_name: Some("docgraph".to_string()),
    //    max_connections: Some(config.database.pool_size),
        ..Default::default()
    };
    
    Ok(pg_config.create_pool(Some(Runtime::Tokio1), tokio_postgres::NoTls)?)
}