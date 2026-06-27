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

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn transaction_response_success_builder() {
        let resp = TransactionResponse::success(
            "tid-1".to_string(),
            "1700000000".to_string(),
            true,
            false,
        );
        assert!(resp.success);
        assert_eq!("tid-1", resp.transaction_id);
        assert_eq!("1700000000", resp.timestamp);
        assert!(resp.is_committed);
        assert!(!resp.is_rolled_back);
        assert!(resp.message.is_none());
    }

    #[test]
    fn transaction_response_error_builder() {
        let resp = TransactionResponse::error("failed");
        assert!(!resp.success);
        assert_eq!("", resp.transaction_id);
        assert_eq!("", resp.timestamp);
        assert!(!resp.is_committed);
        assert!(!resp.is_rolled_back);
        assert_eq!(Some("failed".to_string()), resp.message);
    }
}
