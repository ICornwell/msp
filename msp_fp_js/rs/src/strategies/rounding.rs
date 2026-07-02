//! Rounding strategy types and implementations
//! 
//! This module defines different rounding strategies that can be applied
//! to financial calculations, with a focus on banking-standard approaches.

use fpdec::RoundingMode;

/// Rounding strategy enumeration that maps to fpdec::RoundingMode
/// 
/// Each strategy represents a different approach to handling fractional values
/// during rounding operations. The choice of strategy can significantly impact
/// financial calculations, especially when dealing with interest calculations
/// or currency conversions.
/// 
/// # Examples
/// 
/// ```rust
/// use fp_js::strategies::RoundingStrategy;
/// 
/// // Banker's rounding is the default for financial applications
/// let strategy = RoundingStrategy::default();
/// assert_eq!(strategy, RoundingStrategy::HalfToEven);
/// ```
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum RoundingStrategy {
    /// Banker's rounding (round half to even) - Default for financial applications
    /// 
    /// This strategy rounds .5 to the nearest even number, which reduces bias
    /// in large sets of calculations. It's the standard for most financial institutions.
    /// 
    /// Examples: 2.5 → 2, 3.5 → 4, 4.5 → 4
    HalfToEven,
    
    /// Round half up (0.5 rounds away from zero)
    /// 
    /// Traditional rounding taught in schools. Always rounds .5 up.
    /// 
    /// Examples: 2.5 → 3, 3.5 → 4, -2.5 → -2
    HalfUp,
    
    /// Round half down (0.5 rounds toward zero)
    /// 
    /// Always rounds .5 toward zero.
    /// 
    /// Examples: 2.5 → 2, 3.5 → 3, -2.5 → -2
    HalfDown,
    
    /// Always round up (toward positive infinity)
    /// 
    /// Always rounds toward positive infinity, regardless of the fractional part.
    Up,
    
    /// Always round down (toward negative infinity)
    /// 
    /// Always rounds toward negative infinity, regardless of the fractional part.
    Down,
    
    /// Truncate (toward zero)
    /// 
    /// Removes the fractional part without rounding.
    /// 
    /// Examples: 2.9 → 2, -2.9 → -2
    Truncate,
    
    /// Round towards positive infinity (same as Up)
    Ceiling,
    
    /// Round towards negative infinity (same as Down)
    Floor,
    
    /// Round away from zero if last digit would be 0 or 5
    /// 
    /// Specialized rounding mode used in some financial contexts.
    Round05Up,
}

impl Default for RoundingStrategy {
    fn default() -> Self {
        RoundingStrategy::HalfToEven // Banker's rounding as default
    }
}

impl From<RoundingStrategy> for RoundingMode {
    fn from(strategy: RoundingStrategy) -> Self {
        match strategy {
            RoundingStrategy::HalfToEven => RoundingMode::RoundHalfEven,
            RoundingStrategy::HalfUp => RoundingMode::RoundHalfUp,
            RoundingStrategy::HalfDown => RoundingMode::RoundHalfDown,
            RoundingStrategy::Up => RoundingMode::RoundUp,
            RoundingStrategy::Down => RoundingMode::RoundDown,
            RoundingStrategy::Truncate => RoundingMode::RoundDown, // Toward zero
            RoundingStrategy::Ceiling => RoundingMode::RoundCeiling,
            RoundingStrategy::Floor => RoundingMode::RoundFloor,
            RoundingStrategy::Round05Up => RoundingMode::Round05Up,
        }
    }
}

impl RoundingStrategy {
    /// Get rounding strategy from environment variable or default
    /// 
    /// Checks the `FINANCIAL_ROUNDING_MODE` environment variable for a strategy name.
    /// If not set or invalid, returns the default (banker's rounding).
    /// 
    /// # Supported Environment Values
    /// 
    /// - `HALF_TO_EVEN`, `BANKER` → HalfToEven
    /// - `HALF_UP` → HalfUp  
    /// - `HALF_DOWN` → HalfDown
    /// - `UP`, `ROUND_UP` → Up
    /// - `DOWN`, `ROUND_DOWN` → Down
    /// - `TRUNCATE`, `TOWARD_ZERO` → Truncate
    /// - `CEILING`, `ROUND_CEILING` → Ceiling
    /// - `FLOOR`, `ROUND_FLOOR` → Floor
    /// - `ROUND_05_UP`, `05UP` → Round05Up
    pub fn from_environment() -> Self {
        std::env::var("FINANCIAL_ROUNDING_MODE")
            .ok()
            .and_then(|s| Self::parse_strategy_name(&s))
            .unwrap_or_default()
    }
    
    /// Parse a strategy name from a string
    /// 
    /// Case-insensitive parsing of strategy names with common aliases.
    pub fn parse_strategy_name(name: &str) -> Option<Self> {
        match name.to_uppercase().as_str() {
            "HALF_TO_EVEN" | "BANKER" => Some(RoundingStrategy::HalfToEven),
            "HALF_UP" => Some(RoundingStrategy::HalfUp),
            "HALF_DOWN" => Some(RoundingStrategy::HalfDown),
            "UP" | "ROUND_UP" => Some(RoundingStrategy::Up),
            "DOWN" | "ROUND_DOWN" => Some(RoundingStrategy::Down),
            "TRUNCATE" | "TOWARD_ZERO" => Some(RoundingStrategy::Truncate),
            "CEILING" | "ROUND_CEILING" => Some(RoundingStrategy::Ceiling),
            "FLOOR" | "ROUND_FLOOR" => Some(RoundingStrategy::Floor),
            "ROUND_05_UP" | "05UP" => Some(RoundingStrategy::Round05Up),
            _ => None,
        }
    }
    
    /// Get a human-readable description of the rounding strategy
    pub fn description(&self) -> &'static str {
        match self {
            RoundingStrategy::HalfToEven => "Banker's rounding (round half to even)",
            RoundingStrategy::HalfUp => "Round half up (away from zero)",
            RoundingStrategy::HalfDown => "Round half down (toward zero)",
            RoundingStrategy::Up => "Always round up (toward positive infinity)",
            RoundingStrategy::Down => "Always round down (toward negative infinity)",
            RoundingStrategy::Truncate => "Truncate (remove fractional part)",
            RoundingStrategy::Ceiling => "Round toward positive infinity",
            RoundingStrategy::Floor => "Round toward negative infinity",
            RoundingStrategy::Round05Up => "Round up if last digit is 0 or 5",
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_default_strategy() {
        assert_eq!(RoundingStrategy::default(), RoundingStrategy::HalfToEven);
    }

    #[test]
    fn test_strategy_parsing() {
        assert_eq!(
            RoundingStrategy::parse_strategy_name("HALF_TO_EVEN"), 
            Some(RoundingStrategy::HalfToEven)
        );
        assert_eq!(
            RoundingStrategy::parse_strategy_name("banker"), 
            Some(RoundingStrategy::HalfToEven)
        );
        assert_eq!(
            RoundingStrategy::parse_strategy_name("invalid"), 
            None
        );
    }

    #[test]
    fn test_rounding_mode_conversion() {
        let strategy = RoundingStrategy::HalfToEven;
        let mode: RoundingMode = strategy.into();
        assert_eq!(mode, RoundingMode::RoundHalfEven);
    }
}
