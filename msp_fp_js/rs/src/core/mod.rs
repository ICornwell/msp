//! Core financial calculation types and operations
//! 
//! This module contains the fundamental building blocks for financial calculations:
//! - Error handling
//! - Decimal number representation  
//! - Basic and advanced arithmetic operations

pub mod errors;
pub mod decimal;

pub use errors::{FinancialError, FinancialResult};
pub use decimal::FixedDecimal;
