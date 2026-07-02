//! Financial context and currency conversion strategies
//! 
//! This module provides context-aware financial calculations, including
//! currency conversion rates and multi-currency arithmetic operations.

use std::collections::HashMap;

use crate::core::{FixedDecimal, FinancialError, FinancialResult};
use super::{PrecisionStrategy, RoundingStrategy};

/// Currency code representation (ISO 4217 format)
/// 
/// Uses a 3-character string to represent currencies like "USD", "EUR", "GBP".
/// Future versions may use a more sophisticated enum-based approach.
pub type CurrencyCode = String;

/// Exchange rate between two currencies
/// 
/// Represents the rate at which one currency can be exchanged for another,
/// along with metadata about when the rate was established.
/// 
/// # Examples
/// 
/// ```rust
/// use fp_js::strategies::CurrencyRate;
/// 
/// // 1 EUR = 1.10 USD
/// let rate = CurrencyRate::new("EUR", "USD", "1.10", 4)?;
/// assert_eq!(rate.from_currency(), "EUR");
/// assert_eq!(rate.to_currency(), "USD");
/// ```
#[derive(Debug, Clone)]
pub struct CurrencyRate {
    /// Source currency (what we're converting from)
    from_currency: CurrencyCode,
    /// Target currency (what we're converting to)
    to_currency: CurrencyCode,
    /// Exchange rate value (how many units of to_currency per unit of from_currency)
    rate: FixedDecimal,
    /// Optional timestamp when this rate was established
    timestamp: Option<i64>,
}

impl CurrencyRate {
    /// Create a new currency exchange rate
    /// 
    /// # Arguments
    /// 
    /// * `from` - Source currency code (e.g., "USD")
    /// * `to` - Target currency code (e.g., "EUR") 
    /// * `rate_str` - Exchange rate as string (e.g., "0.85")
    /// * `precision` - Decimal precision for the rate
    /// 
    /// # Examples
    /// 
    /// ```rust
    /// let usd_to_eur = CurrencyRate::new("USD", "EUR", "0.85", 4)?;
    /// ```
    pub fn new(
        from: &str, 
        to: &str, 
        rate_str: &str, 
        precision: u8
    ) -> FinancialResult<Self> {
        let rate = FixedDecimal::from_str_with_precision(rate_str, precision)?;
        
        if rate.is_zero() || rate.is_negative() {
            return Err(FinancialError::invalid_operation(
                "Currency exchange rate must be positive"
            ));
        }
        
        Ok(CurrencyRate {
            from_currency: from.to_uppercase(),
            to_currency: to.to_uppercase(),
            rate,
            timestamp: None,
        })
    }
    
    /// Create a currency rate with a timestamp
    pub fn with_timestamp(
        from: &str, 
        to: &str, 
        rate_str: &str, 
        precision: u8,
        timestamp: i64
    ) -> FinancialResult<Self> {
        let mut rate = Self::new(from, to, rate_str, precision)?;
        rate.timestamp = Some(timestamp);
        Ok(rate)
    }
    
    /// Get the source currency code
    pub fn from_currency(&self) -> &str {
        &self.from_currency
    }
    
    /// Get the target currency code
    pub fn to_currency(&self) -> &str {
        &self.to_currency
    }
    
    /// Get the exchange rate value
    pub fn rate(&self) -> &FixedDecimal {
        &self.rate
    }
    
    /// Get the timestamp when this rate was established
    pub fn timestamp(&self) -> Option<i64> {
        self.timestamp
    }
    
    /// Convert an amount using this exchange rate
    /// 
    /// # Examples
    /// 
    /// ```rust
    /// let rate = CurrencyRate::new("USD", "EUR", "0.85", 4)?;
    /// let usd_amount = FixedDecimal::from_str_with_precision("100.00", 2)?;
    /// let eur_amount = rate.convert(&usd_amount)?;
    /// ```
    pub fn convert(&self, amount: &FixedDecimal) -> FinancialResult<FixedDecimal> {
        amount.multiply(&self.rate)
    }
    
    /// Create the inverse rate (swap from/to currencies)
    /// 
    /// If this rate converts A -> B, the inverse converts B -> A.
    pub fn inverse(&self) -> FinancialResult<Self> {
        let one = FixedDecimal::from_str_with_precision("1.0", self.rate.precision())?;
        let inverse_rate = one.divide(&self.rate)?;
        
        Ok(CurrencyRate {
            from_currency: self.to_currency.clone(),
            to_currency: self.from_currency.clone(),
            rate: inverse_rate,
            timestamp: self.timestamp,
        })
    }
}

/// Financial calculation context with currency support and strategy configuration
/// 
/// Provides a centralized context for financial calculations that includes:
/// - Currency exchange rates
/// - Default precision and rounding strategies
/// - Multi-currency arithmetic operations
/// 
/// # Examples
/// 
/// ```rust
/// use fp_js::strategies::{FinancialContext, PrecisionStrategy, RoundingStrategy};
/// 
/// let mut context = FinancialContext::new();
/// context.set_default_precision_strategy(PrecisionStrategy::DecimalPlaces(2));
/// context.set_default_rounding_strategy(RoundingStrategy::HalfUp);
/// 
/// // Add exchange rates
/// context.add_currency_rate("USD", "EUR", "0.85", 4)?;
/// ```
#[derive(Debug, Clone)]
pub struct FinancialContext {
    /// Exchange rates between currencies
    exchange_rates: HashMap<(CurrencyCode, CurrencyCode), CurrencyRate>,
    /// Default precision strategy for operations
    default_precision_strategy: PrecisionStrategy,
    /// Default rounding strategy for operations
    default_rounding_strategy: RoundingStrategy,
    /// Base currency for the context (all rates eventually convert through this)
    base_currency: Option<CurrencyCode>,
}

impl Default for FinancialContext {
    fn default() -> Self {
        Self::new()
    }
}

impl FinancialContext {
    /// Create a new financial context with default settings
    /// 
    /// Default settings:
    /// - Precision: Preserve maximum precision
    /// - Rounding: Banker's rounding (half to even)
    /// - No base currency set
    pub fn new() -> Self {
        FinancialContext {
            exchange_rates: HashMap::new(),
            default_precision_strategy: PrecisionStrategy::UseHighestPrecision,
            default_rounding_strategy: RoundingStrategy::HalfToEven,
            base_currency: None,
        }
    }
    
    /// Set the default precision strategy for calculations
    pub fn set_default_precision_strategy(&mut self, strategy: PrecisionStrategy) {
        self.default_precision_strategy = strategy;
    }
    
    /// Get the current default precision strategy
    pub fn default_precision_strategy(&self) -> &PrecisionStrategy {
        &self.default_precision_strategy
    }
    
    /// Set the default rounding strategy for calculations
    pub fn set_default_rounding_strategy(&mut self, strategy: RoundingStrategy) {
        self.default_rounding_strategy = strategy;
    }
    
    /// Get the current default rounding strategy
    pub fn default_rounding_strategy(&self) -> &RoundingStrategy {
        &self.default_rounding_strategy
    }
    
    /// Set the base currency for this context
    /// 
    /// The base currency acts as an intermediary for currency conversions
    /// when direct rates aren't available.
    pub fn set_base_currency(&mut self, currency: &str) {
        self.base_currency = Some(currency.to_uppercase());
    }
    
    /// Get the base currency, if set
    pub fn base_currency(&self) -> Option<&str> {
        self.base_currency.as_deref()
    }
    
    /// Add a currency exchange rate to the context
    /// 
    /// # Arguments
    /// 
    /// * `from` - Source currency code
    /// * `to` - Target currency code
    /// * `rate_str` - Exchange rate as string
    /// * `precision` - Precision for the rate value
    /// 
    /// # Examples
    /// 
    /// ```rust
    /// let mut context = FinancialContext::new();
    /// context.add_currency_rate("USD", "EUR", "0.85", 4)?;
    /// context.add_currency_rate("GBP", "USD", "1.25", 4)?;
    /// ```
    pub fn add_currency_rate(
        &mut self, 
        from: &str, 
        to: &str, 
        rate_str: &str, 
        precision: u8
    ) -> FinancialResult<()> {
        let rate = CurrencyRate::new(from, to, rate_str, precision)?;
        let key = (from.to_uppercase(), to.to_uppercase());
        self.exchange_rates.insert(key, rate);
        Ok(())
    }
    
    /// Add a currency rate with timestamp
    pub fn add_currency_rate_with_timestamp(
        &mut self,
        from: &str,
        to: &str, 
        rate_str: &str,
        precision: u8,
        timestamp: i64
    ) -> FinancialResult<()> {
        let rate = CurrencyRate::with_timestamp(from, to, rate_str, precision, timestamp)?;
        let key = (from.to_uppercase(), to.to_uppercase());
        self.exchange_rates.insert(key, rate);
        Ok(())
    }
    
    /// Get a currency exchange rate
    /// 
    /// Returns the direct rate if available, or attempts to calculate
    /// an indirect rate through the base currency.
    pub fn get_exchange_rate(&self, from: &str, to: &str) -> FinancialResult<CurrencyRate> {
        let from_upper = from.to_uppercase();
        let to_upper = to.to_uppercase();
        
        // Same currency - rate is 1.0
        if from_upper == to_upper {
            return CurrencyRate::new(&from_upper, &to_upper, "1.0", 4);
        }
        
        // Check for direct rate
        let key = (from_upper.clone(), to_upper.clone());
        if let Some(rate) = self.exchange_rates.get(&key) {
            return Ok(rate.clone());
        }
        
        // Check for inverse rate
        let inverse_key = (to_upper.clone(), from_upper.clone());
        if let Some(inverse_rate) = self.exchange_rates.get(&inverse_key) {
            return inverse_rate.inverse();
        }
        
        // Try indirect conversion through base currency
        if let Some(base) = &self.base_currency {
            let base_upper = base.to_uppercase();
            if base_upper != from_upper && base_upper != to_upper {
                // Try from -> base -> to
                if let (Ok(from_to_base), Ok(base_to_to)) = (
                    self.get_direct_rate(&from_upper, &base_upper),
                    self.get_direct_rate(&base_upper, &to_upper)
                ) {
                    let combined_rate = from_to_base.rate().multiply(base_to_to.rate())?;
                    return CurrencyRate::new(&from_upper, &to_upper, &combined_rate.to_string(), combined_rate.precision());
                }
            }
        }
        
        Err(FinancialError::invalid_operation(
            format!("No exchange rate available from {} to {}", from, to)
        ))
    }
    
    /// Convert an amount from one currency to another
    /// 
    /// # Examples
    /// 
    /// ```rust
    /// let mut context = FinancialContext::new();
    /// context.add_currency_rate("USD", "EUR", "0.85", 4)?;
    /// 
    /// let usd_amount = FixedDecimal::from_str_with_precision("100.00", 2)?;
    /// let eur_amount = context.convert_currency(&usd_amount, "USD", "EUR")?;
    /// ```
    pub fn convert_currency(
        &self, 
        amount: &FixedDecimal, 
        from: &str, 
        to: &str
    ) -> FinancialResult<FixedDecimal> {
        let rate = self.get_exchange_rate(from, to)?;
        rate.convert(amount)
    }
    
    /// List all available currency pairs
    pub fn available_currency_pairs(&self) -> Vec<(String, String)> {
        self.exchange_rates.keys().cloned().collect()
    }
    
    /// Get the number of exchange rates stored
    pub fn exchange_rate_count(&self) -> usize {
        self.exchange_rates.len()
    }
    
    // Private helper methods
    
    /// Get a direct exchange rate (no inverse or indirect calculation)
    fn get_direct_rate(&self, from: &str, to: &str) -> FinancialResult<CurrencyRate> {
        let key = (from.to_string(), to.to_string());
        self.exchange_rates.get(&key)
            .cloned()
            .ok_or_else(|| FinancialError::invalid_operation(
                format!("No direct rate from {} to {}", from, to)
            ))
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_currency_rate_creation() {
        let rate = CurrencyRate::new("USD", "EUR", "0.85", 4).unwrap();
        assert_eq!(rate.from_currency(), "USD");
        assert_eq!(rate.to_currency(), "EUR");
        assert_eq!(rate.rate().to_string(), "0.8500");
    }

    #[test]
    fn test_currency_rate_conversion() {
        let rate = CurrencyRate::new("USD", "EUR", "0.85", 4).unwrap();
        let usd_amount = FixedDecimal::from_str_with_precision("100.00", 2).unwrap();
        let eur_amount = rate.convert(&usd_amount).unwrap();
        
        // Note: precision taken from first operand (USD amount)
        assert_eq!(eur_amount.to_string(), "85.00");
    }

    #[test]
    fn test_currency_rate_inverse() {
        let rate = CurrencyRate::new("USD", "EUR", "0.85", 4).unwrap();
        let inverse = rate.inverse().unwrap();
        
        assert_eq!(inverse.from_currency(), "EUR");
        assert_eq!(inverse.to_currency(), "USD");
        
        // 1/0.85 ≈ 1.1765
        let inverse_rate_str = inverse.rate().to_string();
        assert!(inverse_rate_str.starts_with("1.17"));
    }

    #[test]
    fn test_financial_context_basic() {
        let mut context = FinancialContext::new();
        assert_eq!(context.exchange_rate_count(), 0);
        
        context.add_currency_rate("USD", "EUR", "0.85", 4).unwrap();
        assert_eq!(context.exchange_rate_count(), 1);
    }

    #[test]
    fn test_financial_context_currency_conversion() {
        let mut context = FinancialContext::new();
        context.add_currency_rate("USD", "EUR", "0.85", 4).unwrap();
        
        let usd_amount = FixedDecimal::from_str_with_precision("100.00", 2).unwrap();
        let eur_amount = context.convert_currency(&usd_amount, "USD", "EUR").unwrap();
        
        assert_eq!(eur_amount.to_string(), "85.00");
    }

    #[test]
    fn test_financial_context_same_currency() {
        let context = FinancialContext::new();
        let amount = FixedDecimal::from_str_with_precision("100.00", 2).unwrap();
        let converted = context.convert_currency(&amount, "USD", "USD").unwrap();
        
        assert_eq!(converted.to_string(), "100.00");
    }

    #[test]
    fn test_financial_context_inverse_rate() {
        let mut context = FinancialContext::new();
        context.add_currency_rate("USD", "EUR", "0.85", 4).unwrap();
        
        // Should be able to convert EUR -> USD using inverse
        let eur_amount = FixedDecimal::from_str_with_precision("85.00", 2).unwrap();
        let usd_amount = context.convert_currency(&eur_amount, "EUR", "USD").unwrap();
        
        // 85 / 0.85 = 100
        assert_eq!(usd_amount.to_string(), "100.00");
    }

    #[test]
    fn test_financial_context_base_currency() {
        let mut context = FinancialContext::new();
        context.set_base_currency("USD");
        
        // Add rates through USD
        context.add_currency_rate("EUR", "USD", "1.18", 4).unwrap();
        context.add_currency_rate("USD", "GBP", "0.80", 4).unwrap();
        
        // Should be able to convert EUR -> GBP via USD
        let eur_amount = FixedDecimal::from_str_with_precision("100.00", 2).unwrap();
        let gbp_amount = context.convert_currency(&eur_amount, "EUR", "GBP").unwrap();
        
        // 100 EUR * 1.18 USD/EUR * 0.80 GBP/USD = 94.40 GBP
        assert_eq!(gbp_amount.to_string(), "94.40");
    }

    #[test]
    fn test_invalid_currency_rate() {
        assert!(CurrencyRate::new("USD", "EUR", "0", 4).is_err());
        assert!(CurrencyRate::new("USD", "EUR", "-0.5", 4).is_err());
    }

    #[test]
    fn test_missing_exchange_rate() {
        let context = FinancialContext::new();
        let amount = FixedDecimal::from_str_with_precision("100.00", 2).unwrap();
        
        let result = context.convert_currency(&amount, "USD", "JPY");
        assert!(result.is_err());
    }
}
