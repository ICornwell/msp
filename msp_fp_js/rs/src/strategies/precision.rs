//! Precision strategy types for flexible precision handling
//! 
//! This module provides comprehensive precision strategies for financial calculations,
//! allowing fine-grained control over how precision is handled in mixed-precision
//! arithmetic operations.

use crate::core::{FinancialError, FinancialResult};

/// Precision strategy enumeration for flexible precision handling
/// 
/// Defines how to resolve precision conflicts when performing arithmetic
/// operations on FixedDecimals with different precision levels.
/// 
/// # Strategy Categories
/// 
/// - **Validation**: Error on precision mismatches
/// - **Operand-based**: Choose precision based on operand characteristics  
/// - **Specific**: Use a fixed precision value
/// - **Context-driven**: Use values from financial context
/// - **Domain-specific**: Use standard precision for financial domains
/// 
/// # Examples
/// 
/// ```rust
/// use fp_js::strategies::PrecisionStrategy;
/// 
/// // Use the highest precision from either operand
/// let strategy = PrecisionStrategy::UseHighestPrecision;
/// 
/// // Use banking standard (4 decimal places)
/// let banking = PrecisionStrategy::UseBankingStandardPrecision;
/// ```
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum PrecisionStrategy {
    // === Validation Strategies ===
    
    /// Error if operands have different precision
    /// 
    /// Conservative approach that requires all operands to have matching precision.
    /// This is the default strategy to prevent unexpected precision behavior.
    ErrorIfPrecisionDiffers,
    
    // === Basic Operand-Based Strategies ===
    
    /// Use the precision of the first operand
    UseFirstOperandPrecision,
    
    /// Use the precision of the second operand
    UseSecondOperandPrecision,
    
    /// Use the lowest precision among operands
    /// 
    /// Conservative approach that avoids false precision in results.
    UseLowestPrecision,
    
    /// Use the highest precision among operands
    /// 
    /// Preserves maximum available precision in calculations.
    UseHighestPrecision,
    
    /// Use a specific precision value regardless of operands
    /// 
    /// Forces all results to have exactly the specified precision.
    UseSpecificPrecision(u8),
    
    // === Interim vs Final Precision Control ===
    
    /// Use lowest precision for intermediate calculations
    UseLowestPrecisionForInterimResults,
    
    /// Use highest precision for intermediate calculations
    UseHighestPrecisionForInterimResults,
    
    /// Use specific precision for intermediate calculations
    UseSpecificPrecisionForInterimResults(u8),
    
    /// Use lowest precision for final result only
    UseLowestPrecisionForFinalResult,
    
    /// Use highest precision for final result only
    UseHighestPrecisionForFinalResult,
    
    /// Use specific precision for final result only
    UseSpecificPrecisionForFinalResult(u8),
    
    // === Context-Driven Strategies ===
    
    /// Use the default precision from financial context
    /// 
    /// Requires a FinancialContext to be provided to the operation.
    UseContextDefaultPrecision,
    
    /// Use precision associated with the base currency
    /// 
    /// Requires a FinancialContext with currency information.
    UseBaseCurrencyPrecision,
    
    // === Financial Domain Strategies ===
    
    /// Use standard accounting precision (2 decimal places)
    /// 
    /// Standard for most accounting applications and currency displays.
    UseAccountingPrecision,
    
    /// Use banking standard precision (4 decimal places)
    /// 
    /// Higher precision required for banking calculations and interest rates.
    UseBankingStandardPrecision,
    
    // === Complex Precision Strategies ===
    
    /// Use different strategies for interim and final calculations
    /// 
    /// Allows high precision during calculations but controlled precision
    /// for the final result.
    InterimAndFinal {
        interim: Box<PrecisionStrategy>,
        final_result: Box<PrecisionStrategy>,
    },
    
    // === Currency-Aware Strategies (Future) ===
    
    /// Use precision native to a specific currency
    /// 
    /// Future feature for multi-currency support.
    UseCurrencyNativePrecision(String),  // currency code
}

impl Default for PrecisionStrategy {
    fn default() -> Self {
        PrecisionStrategy::ErrorIfPrecisionDiffers // Conservative default
    }
}

impl PrecisionStrategy {
    /// Resolve the interim precision for calculation from two operands
    /// 
    /// Determines what precision to use during the actual arithmetic operation.
    /// This may be different from the final result precision.
    /// 
    /// # Arguments
    /// 
    /// * `first_precision` - Precision of the first operand
    /// * `second_precision` - Precision of the second operand
    /// * `context` - Optional financial context for context-driven strategies
    /// 
    /// # Returns
    /// 
    /// The precision to use for interim calculations, or an error if the
    /// strategy cannot be applied with the given inputs.
    pub fn resolve_interim_precision(
        &self, 
        first_precision: u8, 
        second_precision: u8, 
        context: Option<&crate::strategies::FinancialContext>
    ) -> FinancialResult<u8> {
        match self {
            PrecisionStrategy::ErrorIfPrecisionDiffers => {
                if first_precision != second_precision {
                    Err(FinancialError::precision_mismatch(
                        first_precision, 
                        second_precision, 
                        "operation with ErrorIfPrecisionDiffers strategy"
                    ))
                } else {
                    Ok(first_precision)
                }
            },
            
            PrecisionStrategy::UseFirstOperandPrecision => Ok(first_precision),
            PrecisionStrategy::UseSecondOperandPrecision => Ok(second_precision),
            PrecisionStrategy::UseLowestPrecision => Ok(first_precision.min(second_precision)),
            PrecisionStrategy::UseHighestPrecision => Ok(first_precision.max(second_precision)),
            PrecisionStrategy::UseSpecificPrecision(precision) => Ok(*precision),
            
            PrecisionStrategy::UseLowestPrecisionForInterimResults => {
                Ok(first_precision.min(second_precision))
            },
            PrecisionStrategy::UseHighestPrecisionForInterimResults => {
                Ok(first_precision.max(second_precision))
            },
            PrecisionStrategy::UseSpecificPrecisionForInterimResults(precision) => Ok(*precision),
            
            PrecisionStrategy::UseContextDefaultPrecision => {
                // For now, return error - this needs more design work
                Err(FinancialError::missing_context("UseContextDefaultPrecision strategy requires implementation"))
            },
            
            PrecisionStrategy::UseBaseCurrencyPrecision => {
                // For now, return error - this needs more design work  
                Err(FinancialError::missing_context("UseBaseCurrencyPrecision strategy requires implementation"))
            },
            
            PrecisionStrategy::UseAccountingPrecision => Ok(2), // Standard accounting precision
            PrecisionStrategy::UseBankingStandardPrecision => Ok(4), // Banking standard precision
            
            PrecisionStrategy::InterimAndFinal { interim, .. } => {
                interim.resolve_interim_precision(first_precision, second_precision, context)
            },
            
            // For final-result-only strategies, use highest precision for interim
            PrecisionStrategy::UseLowestPrecisionForFinalResult |
            PrecisionStrategy::UseHighestPrecisionForFinalResult |
            PrecisionStrategy::UseSpecificPrecisionForFinalResult(_) => {
                Ok(first_precision.max(second_precision))
            },
            
            // Future currency strategies - fallback to highest for now
            PrecisionStrategy::UseCurrencyNativePrecision(_) => {
                Ok(first_precision.max(second_precision))
            },
        }
    }

    /// Resolve the final precision for the result
    /// 
    /// Determines what precision the final result should have after all
    /// calculations are complete.
    pub fn resolve_final_precision(
        &self, 
        first_precision: u8, 
        second_precision: u8, 
        context: Option<&crate::strategies::FinancialContext>
    ) -> FinancialResult<u8> {
        match self {
            // Strategies that only affect final precision
            PrecisionStrategy::UseLowestPrecisionForFinalResult => {
                Ok(first_precision.min(second_precision))
            },
            PrecisionStrategy::UseHighestPrecisionForFinalResult => {
                Ok(first_precision.max(second_precision))
            },
            PrecisionStrategy::UseSpecificPrecisionForFinalResult(precision) => Ok(*precision),
            
            PrecisionStrategy::InterimAndFinal { final_result, .. } => {
                final_result.resolve_final_precision(first_precision, second_precision, context)
            },
            
            // For most other strategies, final precision is the same as interim precision
            _ => self.resolve_interim_precision(first_precision, second_precision, context),
        }
    }
    
    /// Create a precision strategy that uses specific precision
    /// 
    /// Convenience constructor for the most common use case.
    pub fn specific(precision: u8) -> Self {
        PrecisionStrategy::UseSpecificPrecision(precision)
    }
    
    /// Create a complex strategy with different interim and final precisions
    /// 
    /// Useful for high-precision calculations with controlled output precision.
    pub fn interim_and_final(interim: PrecisionStrategy, final_result: PrecisionStrategy) -> Self {
        PrecisionStrategy::InterimAndFinal {
            interim: Box::new(interim),
            final_result: Box::new(final_result),
        }
    }
    
    /// Get a human-readable description of the precision strategy
    pub fn description(&self) -> &'static str {
        match self {
            PrecisionStrategy::ErrorIfPrecisionDiffers => "Error if precision differs",
            PrecisionStrategy::UseFirstOperandPrecision => "Use first operand precision",
            PrecisionStrategy::UseSecondOperandPrecision => "Use second operand precision",
            PrecisionStrategy::UseLowestPrecision => "Use lowest precision",
            PrecisionStrategy::UseHighestPrecision => "Use highest precision",
            PrecisionStrategy::UseSpecificPrecision(_) => "Use specific precision",
            PrecisionStrategy::UseLowestPrecisionForInterimResults => "Lowest precision for interim calculations",
            PrecisionStrategy::UseHighestPrecisionForInterimResults => "Highest precision for interim calculations",
            PrecisionStrategy::UseSpecificPrecisionForInterimResults(_) => "Specific precision for interim calculations",
            PrecisionStrategy::UseLowestPrecisionForFinalResult => "Lowest precision for final result",
            PrecisionStrategy::UseHighestPrecisionForFinalResult => "Highest precision for final result",
            PrecisionStrategy::UseSpecificPrecisionForFinalResult(_) => "Specific precision for final result",
            PrecisionStrategy::UseContextDefaultPrecision => "Use context default precision",
            PrecisionStrategy::UseBaseCurrencyPrecision => "Use base currency precision",
            PrecisionStrategy::UseAccountingPrecision => "Use accounting precision (2 decimals)",
            PrecisionStrategy::UseBankingStandardPrecision => "Use banking precision (4 decimals)",
            PrecisionStrategy::InterimAndFinal { .. } => "Different interim and final precisions",
            PrecisionStrategy::UseCurrencyNativePrecision(_) => "Use currency-specific precision",
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_precision_resolution() {
        let strategy = PrecisionStrategy::UseHighestPrecision;
        let precision = strategy.resolve_interim_precision(2, 4, None).unwrap();
        assert_eq!(precision, 4);
        
        let strategy = PrecisionStrategy::UseLowestPrecision;
        let precision = strategy.resolve_interim_precision(2, 4, None).unwrap();
        assert_eq!(precision, 2);
        
        let strategy = PrecisionStrategy::UseSpecificPrecision(6);
        let precision = strategy.resolve_interim_precision(2, 4, None).unwrap();
        assert_eq!(precision, 6);
    }

    #[test]
    fn test_error_on_mismatch() {
        let strategy = PrecisionStrategy::ErrorIfPrecisionDiffers;
        
        // Should succeed with matching precision
        assert!(strategy.resolve_interim_precision(2, 2, None).is_ok());
        
        // Should fail with different precision
        assert!(strategy.resolve_interim_precision(2, 4, None).is_err());
    }

    #[test]
    fn test_financial_domain_precision() {
        let accounting = PrecisionStrategy::UseAccountingPrecision;
        assert_eq!(accounting.resolve_interim_precision(0, 0, None).unwrap(), 2);
        
        let banking = PrecisionStrategy::UseBankingStandardPrecision;
        assert_eq!(banking.resolve_interim_precision(0, 0, None).unwrap(), 4);
    }

    #[test]
    fn test_convenience_constructors() {
        let specific = PrecisionStrategy::specific(3);
        match specific {
            PrecisionStrategy::UseSpecificPrecision(3) => {},
            _ => panic!("Expected UseSpecificPrecision(3)"),
        }
    }
}
