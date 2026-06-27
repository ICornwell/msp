use poem::{error::ResponseError, http::StatusCode};
use serde::Serialize;
use thiserror::Error;

#[derive(Error, Debug)]
pub enum DocGraphError {
    #[error("Database error: {0}")]
    Database(#[from] tokio_postgres::Error),

    #[error("Database pool error: {0}")]
    Pool(#[from] deadpool_postgres::PoolError),

    #[error("Serialization error: {0}")]
    Serialization(#[from] serde_json::Error),

    #[error("Configuration error: {0}")]
    Config(#[from] config::ConfigError),

    #[error("IO error: {0}")]
    Io(#[from] std::io::Error),

    #[error("Not found: {0}")]
    NotFound(String),

    #[error("Validation error: {0}")]
    Validation(String),

    #[error("Duplicate Key error: {0}")]
    DuplicateKey(String),

    #[error("Write lock conflict: {0}")]
    LockConflict(String),

    #[error("Internal server error: {0}")]
    Internal(String),
}

impl DocGraphError {
    pub fn status_code(&self) -> StatusCode {
        match self {
            DocGraphError::NotFound(_) => StatusCode::NOT_FOUND,
            DocGraphError::Validation(_) => StatusCode::BAD_REQUEST,
            DocGraphError::DuplicateKey(_) => StatusCode::CONFLICT,
            DocGraphError::LockConflict(_) => StatusCode::CONFLICT,
            DocGraphError::Database(_) | DocGraphError::Pool(_) | DocGraphError::Serialization(_) | 
            DocGraphError::Config(_) | DocGraphError::Io(_) | DocGraphError::Internal(_) => StatusCode::INTERNAL_SERVER_ERROR,
        }
    }
}

#[derive(Serialize)]
struct ErrorResponse {
    success: bool,
    message: String,
    code: u16,
}

impl ResponseError for DocGraphError {
    fn status(&self) -> StatusCode {
        self.status_code()
    }

    fn as_response(&self) -> poem::Response {
        let status = self.status();
        let error_response = ErrorResponse {
            success: false,
            message: self.to_string(),
            code: status.as_u16(),
        };

        poem::Response::builder()
            .status(status)
            .content_type("application/json")
            .body(serde_json::to_string(&error_response).unwrap_or_else(|_| {
                r#"{"success":false,"message":"Error serializing error response","code":500}"#.to_string()
            }))
    }
}

pub type Result<T> = std::result::Result<T, DocGraphError>;

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn status_code_mapping_is_correct() {
        assert_eq!(StatusCode::NOT_FOUND, DocGraphError::NotFound("x".to_string()).status_code());
        assert_eq!(StatusCode::BAD_REQUEST, DocGraphError::Validation("x".to_string()).status_code());
        assert_eq!(StatusCode::CONFLICT, DocGraphError::DuplicateKey("x".to_string()).status_code());
        assert_eq!(StatusCode::CONFLICT, DocGraphError::LockConflict("x".to_string()).status_code());
        assert_eq!(StatusCode::INTERNAL_SERVER_ERROR, DocGraphError::Internal("x".to_string()).status_code());
    }

    #[test]
    fn response_error_builds_expected_status() {
        let err = DocGraphError::Validation("bad input".to_string());
        let resp = err.as_response();
        assert_eq!(StatusCode::BAD_REQUEST, resp.status());
    }
}