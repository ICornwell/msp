use fpdec::DecimalError;
use std::fmt;

#[derive(Debug)]
pub enum FinancialError {
    DecimalError(DecimalError),
    InvalidPrecision { requested: u8, maximum: u8 },
    ParseError { input: String, reason: String },
    PrecisionMismatch { first_precision: u8, second_precision: u8, operation: String },
    DivisionByZero,
    MissingContext { required_for: String },
    InvalidOperation(String),
}

impl From<DecimalError> for FinancialError {
    fn from(err: DecimalError) -> Self {
        FinancialError::DecimalError(err)
    }
}

impl fmt::Display for FinancialError {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        match self {
            FinancialError::DecimalError(e) => write!(f, "Decimal error: {}", e),
            FinancialError::InvalidPrecision { requested, maximum } => 
                write!(f, "Invalid precision: {} (max: {})", requested, maximum),
            FinancialError::ParseError { input, reason } => 
                write!(f, "Parse error '{}': {}", input, reason),
            FinancialError::PrecisionMismatch { first_precision, second_precision, operation } => 
                write!(f, "Precision mismatch in {}: {} vs {}", operation, first_precision, second_precision),
            FinancialError::DivisionByZero => write!(f, "Division by zero"),
            FinancialError::MissingContext { required_for } => 
                write!(f, "Missing context for: {}", required_for),
            FinancialError::InvalidOperation(msg) => write!(f, "Invalid operation: {}", msg),
        }
    }
}

impl std::error::Error for FinancialError {}

pub type FinancialResult<T> = Result<T, FinancialError>;

impl FinancialError {
    pub fn invalid_precision(requested: u8, maximum: u8) -> Self {
        FinancialError::InvalidPrecision { requested, maximum }
    }
    
    pub fn parse_failed<S: Into<String>>(input: S, reason: S) -> Self {
        FinancialError::ParseError { input: input.into(), reason: reason.into() }
    }
    
    pub fn precision_mismatch<S: Into<String>>(first: u8, second: u8, operation: S) -> Self {
        FinancialError::PrecisionMismatch {
            first_precision: first,
            second_precision: second,
            operation: operation.into(),
        }
    }
    
    pub fn missing_context<S: Into<String>>(required_for: S) -> Self {
        FinancialError::MissingContext { required_for: required_for.into() }
    }
    
    pub fn invalid_operation<S: Into<String>>(message: S) -> Self {
        FinancialError::InvalidOperation(message.into())
    }
}
