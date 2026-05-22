use std::sync::Arc;

use poem::web::Data;
use poem_openapi::payload::PlainText;
use poem_openapi::{ApiResponse, Object, OpenApi, Tags, param::Query, payload::Json};
use uuid::{Uuid};

use crate::util::generate_ids;
use crate::{
    api::AppState,
    db::{GraphRepository, get_or_create_transaction, commit_transaction, rollback_transaction},
    error::DocGraphError,
    model::{QueryMessage, QueryResponse, UpdateMessage, TransactionResponse, TransactionSuccessResponse},
};

/// Tags for API endpoints
#[derive(Tags)]
pub enum GraphApiTags {
    /// Operations on the document graph
    #[oai(rename = "Graph")]
    Graph,
}

#[derive(Object, Debug)]
pub struct KeyIdPair {
    pub key: String,
    pub id: String,
}

/// Response type for update operations
#[derive(Object, Debug)]
pub struct UpdateResponse {
    /// Whether the operation was successful
    pub success: bool,

    /// Response message
    pub message: String,

    /// Optional root entity ID (for updates that create a new root entity)    
    pub entity_ids: Option<Vec<KeyIdPair>>,

    /// Optional updated message (for validation only calls)
    pub update_message: Option<UpdateMessage>,
}

impl UpdateResponse {
    /// Create a success response
    pub fn success(entity_ids: Option<Vec<KeyIdPair>>) -> Self {
        Self {
            success: true,
            message: "Operation completed successfully".to_string(),
            entity_ids: entity_ids,
            update_message: None,
        }
    }

    /// Create an error response
    pub fn error(message: &str) -> Self {
        Self {
            success: false,
            message: message.to_string(),
            entity_ids: None,
            update_message: None,
        }
    }

    /// Create an error response
    pub fn validation(update_message: UpdateMessage) -> Self {
        Self {
            success: false,
            message: "Validation results".to_string(),
            entity_ids: None,
            update_message: Some(update_message),
        }
    }
}

/// API success response for UpdateResponse
#[derive(ApiResponse)]
pub enum UpdateSuccessResponse {
    /// Success response
    #[oai(status = 200)]
    Ok(Json<UpdateResponse>),
}

/// API success response for QueryResponse
#[derive(ApiResponse)]
pub enum QuerySuccessResponse {
    /// Success response
    #[oai(status = 200)]
    Ok(Json<QueryResponse>),
}

/// Error response for API endpoints
#[derive(ApiResponse)]
pub enum ApiErrorResponse<T: poem_openapi::types::ToJSON> {
    /// Bad request (validation failed)
    #[oai(status = 400)]
    BadRequest(Json<T>),

    /// Not found error
    #[oai(status = 404)]
    NotFound(Json<T>),

    /// Internal server error
    #[oai(status = 500)]
    InternalServerError(Json<T>),
}

/// Request parameters for graph operations
#[derive(Debug, serde::Deserialize, Clone, Object)]
pub struct GraphQueryParams {
    /// Type of response to return
    #[serde(default)]
    pub response_type: String,
}

/// Main API implementation for graph operations

pub struct GraphApi {
    state: Data<Arc<AppState>>,
}

#[OpenApi(prefix_path = "/graph", tag = "GraphApiTags::Graph")]
impl GraphApi {
    /// Create a new GraphApi instance
    pub fn new(state: Arc<AppState>) -> Self {
        Self { state: Data(state) }
    }

    /// Helper to get the graph repository
    fn repo(&self) -> GraphRepository {
        GraphRepository::new(self.state.db_pool.clone())
    }

    /// Convert DocGraphError to an appropriate API response for UpdateResponse
    fn handle_update_error(err: DocGraphError) -> Result<UpdateSuccessResponse, ApiErrorResponse<UpdateResponse>> {
        match err {
            DocGraphError::Validation(msg) => Err(ApiErrorResponse::BadRequest(Json(
                UpdateResponse::error(&msg),
            ))),
            DocGraphError::NotFound(msg) => Err(ApiErrorResponse::NotFound(Json(
                UpdateResponse::error(&msg),
            ))),
            err => {
                // Log the error
                eprintln!("Internal server error: {:?}", err);
                Err(ApiErrorResponse::InternalServerError(Json(
                    UpdateResponse::error(&format!("Internal server error: {}", err)),
                )))
            }
        }
    }

    /// Convert DocGraphError to an appropriate API response for QueryResponse
    fn handle_query_error(err: DocGraphError) -> Result<QuerySuccessResponse, ApiErrorResponse<QueryResponse>> {
        match err {
            DocGraphError::Validation(msg) => Err(ApiErrorResponse::BadRequest(Json(
                QueryResponse::error(msg),
            ))),
            DocGraphError::NotFound(msg) => Err(ApiErrorResponse::NotFound(Json(
                QueryResponse::error(msg),
            ))),
            err => {
                // Log the error
                eprintln!("Internal server error: {:?}", err);
                Err(ApiErrorResponse::InternalServerError(Json(
                    QueryResponse::error(format!("Internal server error: {}", err)),
                )))
            }
        }
    }

    fn handle_transaction_error(err: DocGraphError) -> Result<TransactionSuccessResponse, ApiErrorResponse<TransactionResponse>> {
        match err {
            
            err => {
                // Log the error
                eprintln!("Internal server error: {:?}", err);
                Err(ApiErrorResponse::InternalServerError(Json(
                    TransactionResponse::error(&format!("Internal server error: {}", err)),
                )))
            }
        }
    }

    /// Query the graph database with a structured query
    #[oai(path = "/query", method = "put")]
    async fn query_graph(
        &self,
        body: Json<QueryMessage>,
    ) -> Result<QuerySuccessResponse, ApiErrorResponse<QueryResponse>> {
        let repo = self.repo();

        // Execute the query
        match repo.query(body.0).await {
            Ok(graph_elements) => Ok(QuerySuccessResponse::Ok(Json(graph_elements))),
            Err(err) => Self::handle_query_error(err),
        }
    }

    /// Update the graph database (add, update, or delete elements)
    #[oai(path = "/update", method = "put")]
    async fn update_graph(
        &self,
        body: Json<UpdateMessage>,
        calltype_param: Query<Option<String>>,
        tid_param: Query<Option<String>>,
    ) -> Result<UpdateSuccessResponse, ApiErrorResponse<UpdateResponse>> {
        let repo = self.repo();

        // not yet supported.
        let call_type = match calltype_param.0 {
            Some(rtype) => match rtype.as_str() {
                "validate" => "validate",
                "execute" | _ => "execute",
            },
            None => "execute",
        };

        let tid = match tid_param.0 {
            Some(t) => t,
            None => Uuid::now_v7().to_string(),
        };

        let timestamp = chrono::Utc::now().timestamp();
        let (update_message, key_id_pairs) = generate_ids(&body.0, &tid, timestamp);

        

        // Process the update operation
        match repo.process_update(update_message, tid, timestamp).await {
            Ok(_) => {
                if call_type == "validate" {
                    Ok(UpdateSuccessResponse::Ok(Json(UpdateResponse::validation(
                        body.0.clone(),
                    ))))
                } else {
                    Ok(UpdateSuccessResponse::Ok(Json(UpdateResponse::success(Some(key_id_pairs)))))
                }
            }
            Err(err) => Self::handle_update_error(err),
        }
    }

    /// Transaction management endpoints (begin, commit, rollback)
    
    #[oai(path = "/transaction", method = "get")]
    async fn get_transaction(&self, transaction_id: Query<String>, timestamp: Query<String>) -> Result<TransactionSuccessResponse, ApiErrorResponse<TransactionResponse>> {
        let repo = self.repo();
        let client = repo.get_client().await.map_err(|err| ApiErrorResponse::InternalServerError(Json(
            TransactionResponse::error(&format!("Internal server error: {}", err)),
        )))?;
         match get_or_create_transaction(&client, &transaction_id.0, &timestamp.0).await {
                Ok(transaction_response) => Ok(TransactionSuccessResponse::Ok(Json(transaction_response))),
                Err(err) => Self::handle_transaction_error(err)

        }
    }

    #[oai(path = "/transaction", method = "post")]
    async fn commit_transaction(&self, transaction_id: Query<String>, timestamp: Query<String>) -> Result<TransactionSuccessResponse, ApiErrorResponse<TransactionResponse>> {
        let repo = self.repo();
        let client = repo.get_client().await.map_err(|err| ApiErrorResponse::InternalServerError(Json(
            TransactionResponse::error(&format!("Internal server error: {}", err)),
        )))?;
         match commit_transaction(client, &transaction_id.0, &timestamp.0).await {
                Ok(transaction_response) => Ok(TransactionSuccessResponse::Ok(Json(transaction_response))),
                Err(err) => Self::handle_transaction_error(err)
        }
    }

    #[oai(path = "/transaction", method = "delete")]
    async fn rollback_transaction(&self, transaction_id: Query<String>, timestamp: Query<String>) -> Result<TransactionSuccessResponse, ApiErrorResponse<TransactionResponse>> {
        let repo = self.repo();
        let client = repo.get_client().await.map_err(|err| ApiErrorResponse::InternalServerError(Json(
            TransactionResponse::error(&format!("Internal server error: {}", err)),
        )))?;
         match rollback_transaction(client, &transaction_id.0, &timestamp.0).await {
                Ok(transaction_response) => Ok(TransactionSuccessResponse::Ok(Json(transaction_response))),
                Err(err) => Self::handle_transaction_error(err)

        }
    }

    /// Ensure the database schema exists
    #[oai(path = "/db", method = "post")]
    async fn ensure_db(&self) -> Result<UpdateSuccessResponse, ApiErrorResponse<UpdateResponse>> {
        let repo = self.repo();

        // Ensure database schema is set up
        match repo.ensure_schema().await {
            Ok(_) => Ok(UpdateSuccessResponse::Ok(Json(UpdateResponse::success(None)))),
            Err(err) => Self::handle_update_error(err),
        }
    }

    /// Simple hello endpoint for testing
    #[oai(path = "/hello", method = "get")]
    async fn hello(&self, name: Query<Option<String>>) -> PlainText<String> {
        match name.0 {
            Some(name) => PlainText(format!("Hello, {}!", name)),
            None => PlainText("Welcome to DocGraph DB Gateway API".to_string()),
        }
    }
}
