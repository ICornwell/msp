use poem_openapi::{ApiResponse, Object, payload::Json};
use serde::Serialize;

#[derive(ApiResponse)]
pub enum TransactionSuccessResponse {
    /// Success response
    #[oai(status = 200)]
    Ok(Json<TransactionResponse>),
}

#[derive(Debug, Serialize, Object)]

pub struct TransactionResponse {
    pub success: bool,
    pub transaction_id: String,
    pub timestamp: String,
    pub is_committed: bool,
    pub is_rolled_back: bool,
    pub message: Option<String>,
}

impl TransactionResponse {
    /// Create a successful response with data
    pub fn success(
        transaction_id: String,
        timestamp: String,
        is_committed: bool,
        is_rolled_back: bool,
    ) -> Self {
        Self {
            success: true,
            transaction_id,
            timestamp,
            is_committed,
            is_rolled_back,
            message: None,
        }
    }

    /// Create an error response with a message
    pub fn error(message: &str) -> Self {
        Self {
            success: false,
            transaction_id: "".to_string(),
            timestamp: "".to_string(),
            is_committed: false,
            is_rolled_back: false,
            message: Some(message.to_string()),
        }
    }
}
