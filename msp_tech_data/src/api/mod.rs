use crate::db::DbClientManager;

pub mod graph;

// Application state shared across handlers
pub struct AppState {
    pub db: DbClientManager,
}

// Module for API response handlers
pub mod handlers {
    use poem::{handler, web::Data, Result};
    use std::sync::Arc;
    
    use crate::{
        api::AppState,
        error::DocGraphError,
    };
    
    // Health check endpoint
    #[handler]
    pub async fn health_check(state: Data<&Arc<AppState>>) -> Result<String> {
        // Check database connectivity
        let _ = state.db.get_client().await.map_err(|e| {
            poem::Error::from(DocGraphError::Internal(format!("Database health check failed: {}", e)))
        })?;
        
        // Return success
        Ok("DocGraph API is healthy".to_string())
    }
}