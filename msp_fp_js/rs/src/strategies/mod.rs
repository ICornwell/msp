//! Financial calculation strategies and context
//! 
//! This module provides strategy types for controlling precision and rounding behavior,
//! as well as financial context for managing currency and default behaviors.

pub mod rounding;
pub mod precision;
pub mod context;
pub mod accumulator;

pub use rounding::RoundingStrategy;
pub use precision::PrecisionStrategy;
pub use context::{CurrencyCode, CurrencyRate, FinancialContext};
pub use accumulator::{AccumulationStrategy, FinancialAccumulator};
