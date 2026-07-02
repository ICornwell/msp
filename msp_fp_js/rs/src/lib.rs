//! Financial precision library for Rust and JavaScript
//! 
//! This library provides fixed-precision decimal arithmetic designed for financial
//! applications, with support for multiple currencies, configurable precision
//! strategies, and Neon/Node.js integration.

// Module declarations
pub mod core;
pub mod strategies;

#[cfg(feature = "neon_build")]
pub mod bridge;

#[cfg(feature = "wasm_build")]
pub mod wasm_bridge;

// Re-export core types for easier access
pub use core::{FixedDecimal, FinancialError, FinancialResult};
pub use strategies::{PrecisionStrategy, RoundingStrategy, FinancialContext, CurrencyRate};

// Neon main function
#[cfg(feature = "neon_build")]
use neon::prelude::*;

#[cfg(feature = "neon_build")]
#[neon::main]
fn main(mut cx: ModuleContext) -> NeonResult<()> {
    bridge::register_functions(&mut cx)?;
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_basic_integration() {
        // Test that the core types work together
        let a = FixedDecimal::from_str_with_precision("10.50", 2).unwrap();
        let b = FixedDecimal::from_str_with_precision("5.25", 2).unwrap();
        let sum = a.add(&b).unwrap();
        assert_eq!(sum.to_string(), "15.75");
    }
    
    #[test]
    fn test_strategies_integration() {
        use strategies::{PrecisionStrategy, RoundingStrategy};
        
        // Test that strategies can be created
        let precision = PrecisionStrategy::UseHighestPrecision;
        let rounding = RoundingStrategy::HalfUp;
        
        // Verify they can be used (basic instantiation test)
        assert!(matches!(precision, PrecisionStrategy::UseHighestPrecision));
        assert!(matches!(rounding, RoundingStrategy::HalfUp));
    }
    
    #[test]
    fn test_financial_context() {
        use strategies::FinancialContext;
        
        let mut context = FinancialContext::new();
        context.add_currency_rate("USD", "EUR", "0.85", 4).unwrap();
        
        let usd_amount = FixedDecimal::from_str_with_precision("100.00", 2).unwrap();
        let eur_amount = context.convert_currency(&usd_amount, "USD", "EUR").unwrap();
        
        assert_eq!(eur_amount.to_string(), "85.00");
    }
}
