//! Fixed-precision decimal number type for financial calculations
//! 
//! This module provides the `FixedDecimal` type, which wraps the `fpdec` library
//! to provide consistent precision handling and financial-grade rounding.

use fpdec::{Decimal, RoundingMode, Round};
use std::str::FromStr;

use super::errors::{FinancialError, FinancialResult};

/// A decimal number with fixed precision for financial calculations
/// 
/// `FixedDecimal` ensures consistent precision throughout calculations,
/// preventing the accumulation of floating-point errors that can occur
/// in financial applications.
/// 
/// # Examples
/// 
/// ```rust
/// use fp_js::core::FixedDecimal;
/// 
/// let price = fp_js::core::FixedDecimal::from_str_with_precision("19.99", 2)?;
/// let tax_rate = fp_js::core::FixedDecimal::from_str_with_precision("0.08", 2)?;
/// let total = price.multiply(&tax_rate)?;
/// assert_eq!(total.to_string(), "1.60");
/// ```
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct FixedDecimal {
    /// The underlying high-precision decimal value
    decimal: Decimal,
    /// Number of decimal places to maintain (0-18)
    precision: u8,
}

impl FixedDecimal {
    /// Maximum supported precision (18 decimal places)
    pub const MAX_PRECISION: u8 = 18;
    
    /// Create a new FixedDecimal from a string with specified precision
    /// 
    /// The input string is parsed and automatically rounded to the specified
    /// precision using banker's rounding (round half to even).
    /// 
    /// # Arguments
    /// 
    /// * `input` - String representation of the decimal number
    /// * `precision` - Number of decimal places to maintain (0-18)
    /// 
    /// # Examples
    /// 
    /// ```rust
    /// let decimal = fp_js::core::FixedDecimal::from_str_with_precision("123.456", 2)?;
    /// assert_eq!(decimal.to_string(), "123.46");
    /// ```
    pub fn from_str_with_precision(input: &str, precision: u8) -> FinancialResult<Self> {
        Self::validate_precision(precision)?;
        
        let decimal = Decimal::from_str(input.trim())
            .map_err(|_| FinancialError::parse_failed(input, "Invalid decimal format"))?;
        
        let rounded = Self::apply_rounding(decimal, precision, crate::strategies::RoundingStrategy::default());
        
        Ok(FixedDecimal { 
            decimal: rounded, 
            precision 
        })
    }
    
    /// Create a FixedDecimal from an existing fpdec Decimal
    /// 
    /// Useful when you already have a Decimal from other calculations
    /// and want to wrap it with precision tracking.
    pub fn from_decimal(decimal: Decimal, precision: u8) -> FinancialResult<Self> {
        Self::validate_precision(precision)?;
        
        let rounded = Self::apply_rounding(decimal, precision, crate::strategies::RoundingStrategy::default());
        Ok(FixedDecimal { decimal: rounded, precision })
    }
    
    /// Create a FixedDecimal from an integer value
    /// 
    /// Useful for representing whole currency amounts or counts.
    /// 
    /// # Examples
    /// 
    /// ```rust
    /// let dollars = FixedDecimal::from_integer(1500, 2)?; // $15.00
    /// assert_eq!(dollars.to_string(), "1500.00");
    /// ```
    pub fn from_integer(value: i64, precision: u8) -> FinancialResult<Self> {
        Self::validate_precision(precision)?;
        
        let decimal = Decimal::try_from(value)
            .map_err(|_| FinancialError::parse_failed(value.to_string(), "Integer conversion failed".to_string()))?;
            
        Ok(FixedDecimal { decimal, precision })
    }
    
    /// Get the raw string representation of the underlying decimal
    /// 
    /// This may include more precision than the FixedDecimal tracks.
    /// For display purposes, use `to_string()` instead.
    pub fn raw_value(&self) -> String {
        self.decimal.to_string()
    }
    
    /// Get a reference to the underlying fpdec Decimal
    /// 
    /// Useful for interoperability with other fpdec-based code.
    pub fn as_decimal(&self) -> &Decimal {
        &self.decimal
    }
    
    /// Get the precision (number of decimal places) of this number
    pub fn precision(&self) -> u8 {
        self.precision
    }
    
    /// Convert to a properly formatted string with the correct precision
    /// 
    /// This is the recommended way to display FixedDecimal values.
    /// 
    /// # Examples
    /// 
    /// ```rust
    /// let amount = fp_js::core::FixedDecimal::from_str_with_precision("123.4", 2)?;
    /// assert_eq!(amount.to_string(), "123.40");
    /// ```
    pub fn to_string(&self) -> String {
        format!("{:.prec$}", self.decimal, prec = self.precision as usize)
    }
    
    /// Check if this decimal is zero
    pub fn is_zero(&self) -> bool {
        self.decimal.eq_zero()
    }
    
    /// Check if this decimal is positive
    pub fn is_positive(&self) -> bool {
        self.decimal.is_positive()
    }
    
    /// Check if this decimal is negative  
    pub fn is_negative(&self) -> bool {
        self.decimal.is_negative()
    }
    
    // Private helper methods
    
    /// Validate that precision is within allowed range
    fn validate_precision(precision: u8) -> FinancialResult<()> {
        if precision > Self::MAX_PRECISION {
            Err(FinancialError::invalid_precision(precision, Self::MAX_PRECISION))
        } else {
            Ok(())
        }
    }
    
    /// Apply banker's rounding (round half to even) to a decimal
    /// 
    /// This is the default rounding method for financial applications
    /// as it reduces bias in large sets of calculations.
    fn apply_rounding(decimal: Decimal, precision: u8, strategy: crate::strategies::RoundingStrategy) -> Decimal {
        // Save current rounding mode
        let original_mode = RoundingMode::default();
        
        // Temporarily set rounding strategy
        let new_mode: fpdec::RoundingMode = strategy.into();
        RoundingMode::set_default(new_mode);
        let result = decimal.round(precision as i8);
        
        // Restore original mode
        RoundingMode::set_default(original_mode);
        
        result
    }
    
    /// Ensure two decimals have compatible precision for arithmetic
    fn require_matching_precision(&self, other: &Self, operation: &str) -> FinancialResult<()> {
        if self.precision != other.precision {
            Err(FinancialError::precision_mismatch(
                self.precision, 
                other.precision, 
                operation
            ))
        } else {
            Ok(())
        }
    }
}

// Basic arithmetic operations with clear error handling
impl FixedDecimal {
    /// Add two FixedDecimals with matching precision
    /// 
    /// Both operands must have the same precision. For mixed-precision
    /// arithmetic, use the strategy-aware operations instead.
    /// 
    /// # Examples
    /// 
    /// ```rust
    /// let a = fp_js::core::FixedDecimal::from_str_with_precision("10.50", 2)?;
    /// let b = fp_js::core::FixedDecimal::from_str_with_precision("5.25", 2)?;
    /// let sum = a.add(&b)?;
    /// assert_eq!(sum.to_string(), "15.75");
    /// ```
    pub fn add(&self, other: &Self) -> FinancialResult<FixedDecimal> {
        self.require_matching_precision(other, "addition")?;
        
        let result = self.decimal + other.decimal;
        let rounded = Self::apply_rounding(result, self.precision, crate::strategies::RoundingStrategy::default());
        
        Ok(FixedDecimal { 
            decimal: rounded, 
            precision: self.precision 
        })
    }
    
    /// Subtract two FixedDecimals with matching precision
    pub fn subtract(&self, other: &Self) -> FinancialResult<FixedDecimal> {
        self.require_matching_precision(other, "subtraction")?;
        
        let result = self.decimal - other.decimal;
        let rounded = Self::apply_rounding(result, self.precision, crate::strategies::RoundingStrategy::default());
        
        Ok(FixedDecimal { 
            decimal: rounded, 
            precision: self.precision 
        })
    }
    
    /// Multiply two FixedDecimals
    /// 
    /// The result takes the precision of the first operand.
    /// For different precision handling, use strategy-aware operations.
    pub fn multiply(&self, other: &Self) -> FinancialResult<FixedDecimal> {
        let result = self.decimal * other.decimal;
        let rounded = Self::apply_rounding(result, self.precision, crate::strategies::RoundingStrategy::default());
        
        Ok(FixedDecimal { 
            decimal: rounded, 
            precision: self.precision 
        })
    }
    
    /// Divide two FixedDecimals
    /// 
    /// Returns an error if the divisor is zero.
    /// The result takes the precision of the first operand.
    pub fn divide_into(&self, parts: i64, strategy_set: crate::strategies::DivisionStrategySet) -> FinancialResult<(Vec<FixedDecimal>, Option<FixedDecimal>)> {
        if parts <= 0 {
            return Err(FinancialError::invalid_operation("Parts must be greater than zero".to_string()));
        }

        let divisor = fpdec::Decimal::from(parts);
        let base_amount = self.decimal;
        let mut part_dec = base_amount / divisor;
        part_dec = Self::apply_rounding(part_dec, self.precision, strategy_set.rounding);

        let parts_total = part_dec * divisor;
        let remainder_dec = base_amount - parts_total;
        
        let part_fd = FixedDecimal { decimal: part_dec, precision: self.precision };
        let mut results = vec![part_fd.clone(); parts as usize];
        
        if remainder_dec == fpdec::Decimal::ZERO {
            return Ok((results, None));
        }
        
        match strategy_set.remainder {
            crate::strategies::RemainderStrategy::AddToFirst => {
                results[0] = FixedDecimal { decimal: part_dec + remainder_dec, precision: self.precision };
                Ok((results, None))
            },
            crate::strategies::RemainderStrategy::AddToLast => {
                let last_idx = (parts - 1) as usize;
                results[last_idx] = FixedDecimal { decimal: part_dec + remainder_dec, precision: self.precision };
                Ok((results, None))
            },
            crate::strategies::RemainderStrategy::KeepSeparate => {
                Ok(( 
                    results, 
                    Some(FixedDecimal { decimal: remainder_dec, precision: self.precision }) 
                ))
            }
        }
    }

    /// Divide two FixedDecimals using a specific rounding strategy
    pub fn divide_with_strategy(&self, other: &Self, strategy: crate::strategies::RoundingStrategy) -> FinancialResult<FixedDecimal> {
        if other.is_zero() {
            return Err(FinancialError::DivisionByZero);
        }
        
        let result = self.decimal / other.decimal;
        let rounded = Self::apply_rounding(result, self.precision, strategy);
        
        Ok(FixedDecimal { 
            decimal: rounded, 
            precision: self.precision 
        })
    }

    pub fn divide(&self, other: &Self) -> FinancialResult<FixedDecimal> {
        if other.is_zero() {
            return Err(FinancialError::DivisionByZero);
        }
        
        let result = self.decimal / other.decimal;
        let rounded = Self::apply_rounding(result, self.precision, crate::strategies::RoundingStrategy::default());
        
        Ok(FixedDecimal { 
            decimal: rounded, 
            precision: self.precision 
        })
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_fixed_decimal_creation() {
        let decimal = FixedDecimal::from_integer(12345, 2).unwrap();
        assert_eq!(decimal.raw_value(), "12345");
        assert_eq!(decimal.precision(), 2);
    }

    #[test]
    fn test_string_parsing() {
        let decimal = FixedDecimal::from_str_with_precision("123.45", 2).unwrap();
        assert_eq!(decimal.to_string(), "123.45");
        
        let decimal = FixedDecimal::from_str_with_precision("123", 2).unwrap();
        assert_eq!(decimal.to_string(), "123.00");
        
        let decimal = FixedDecimal::from_str_with_precision("-456.78", 2).unwrap();
        assert_eq!(decimal.to_string(), "-456.78");
    }

    #[test]
    fn test_arithmetic_operations() {
        let a = FixedDecimal::from_str_with_precision("100.25", 2).unwrap();
        let b =FixedDecimal::from_str_with_precision("50.75", 2).unwrap();
        
        let sum = a.add(&b).unwrap();
        assert_eq!(sum.to_string(), "151.00");
        
        let diff = a.subtract(&b).unwrap();
        assert_eq!(diff.to_string(), "49.50");
        
        let product = a.multiply(&b).unwrap();
        assert_eq!(product.to_string(), "5087.69");
        
        let quotient = a.divide(&b).unwrap();
        assert_eq!(quotient.to_string(), "1.98");
    }

    #[test]
    fn test_precision_validation() {
        assert!(FixedDecimal::from_integer(100, 19).is_err());
        assert!(FixedDecimal::from_str_with_precision("123.45", 25).is_err());
    }

    #[test]
    fn test_precision_mismatch() {
        let a = FixedDecimal::from_str_with_precision("100.00", 2).unwrap();
        let b = FixedDecimal::from_str_with_precision("50.0", 1).unwrap();
        
        assert!(a.add(&b).is_err());
        assert!(a.subtract(&b).is_err());
        // multiply and divide don't require matching precision in basic operations
    }

    #[test]
    fn test_division_by_zero() {
        let a = FixedDecimal::from_str_with_precision("100.00", 2).unwrap();
        let zero = FixedDecimal::from_str_with_precision("0.00", 2).unwrap();
        
        assert!(a.divide(&zero).is_err());
    }
}
