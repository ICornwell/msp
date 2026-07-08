use std::collections::HashMap;
use crate::core::decimal::FixedDecimal;
use crate::core::errors::{FinancialError, FinancialResult};
use crate::strategies::{DivisionStrategySet, RemainderStrategy, RoundingStrategy};

/// A scalar value strictly tied to a dimension. 
/// "Apples", "Oranges", "USD", "EUR"
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct DimensionedAmount {
    pub value: FixedDecimal,
    pub dimension: String,
}

impl DimensionedAmount {
    pub fn new(value: FixedDecimal, dimension: impl Into<String>) -> Self {
        Self {
            value,
            dimension: dimension.into(),
        }
    }

    // --- Strict Arithmetic --- //

    /// Strict addition. Errors if dimensions do not match.
    pub fn strict_add(&self, other: &Self) -> FinancialResult<Self> {
        self.strict_require_dimension(other)?;
        let summed = self.value.add(&other.value)?;
        Ok(DimensionedAmount::new(summed, &self.dimension))
    }

    /// Strict subtraction. Errors if dimensions do not match.
    pub fn strict_subtract(&self, other: &Self) -> FinancialResult<Self> {
        self.strict_require_dimension(other)?;
        let diff = self.value.subtract(&other.value)?;
        Ok(DimensionedAmount::new(diff, &self.dimension))
    }

    /// Multiply a dimensioned amount by a scalar (dimensionless) decimal multiplier.
    pub fn multiply(&self, multiplier: &FixedDecimal) -> FinancialResult<Self> {
        let result = self.value.multiply(multiplier)?;
        Ok(DimensionedAmount::new(result, &self.dimension))
    }

    /// Divide by a scalar decimal, rounding according to the specified strategy.
    pub fn divide_rounded(&self, divisor: &FixedDecimal, strategy: RoundingStrategy) -> FinancialResult<Self> {
        let result = self.value.divide_with_strategy(divisor, strategy)?;
        Ok(DimensionedAmount::new(result, &self.dimension))
    }

    /// Calculate a percentage of this amount (e.g. multiplier of 5 for 5%), rounding appropriately.
    pub fn percentage_of_rounded(&self, percentage: &FixedDecimal, strategy: RoundingStrategy) -> FinancialResult<Self> {
        let hundred = FixedDecimal::from_str_with_precision("100", percentage.precision())?;
        let multiplied = self.value.multiply(percentage)?;
        let result = multiplied.divide_with_strategy(&hundred, strategy)?;
        Ok(DimensionedAmount::new(result, &self.dimension))
    }

    // --- Divide Into Parts --- //

    /// Divide into integer parts, mapping the remainder to the first installment.
    pub fn divide_into_load_first(&self, parts: i64) -> FinancialResult<Vec<Self>> {
        let strategy = DivisionStrategySet {
            rounding: RoundingStrategy::Down,
            remainder: RemainderStrategy::AddToFirst,
        };
        self.divide_into_with_strategy(parts, strategy)
    }

    /// Divide into integer parts, mapping the remainder to the last installment.
    pub fn divide_into_load_last(&self, parts: i64) -> FinancialResult<Vec<Self>> {
        let strategy = DivisionStrategySet {
            rounding: RoundingStrategy::Down,
            remainder: RemainderStrategy::AddToLast,
        };
        self.divide_into_with_strategy(parts, strategy)
    }

    /// Divide into integer parts, keeping the remainder as a separate optional explicit value.
    pub fn divide_into_with_remainder(&self, parts: i64) -> FinancialResult<(Vec<Self>, Option<Self>)> {
        let strategy = DivisionStrategySet {
            rounding: RoundingStrategy::Down,
            remainder: RemainderStrategy::KeepSeparate,
        };
        let (amounts, rem) = self.value.divide_into(parts, strategy)?;
        
        let dim_amounts = amounts.into_iter()
            .map(|a| DimensionedAmount::new(a, &self.dimension))
            .collect();
            
        let dim_rem = rem.map(|r| DimensionedAmount::new(r, &self.dimension));
        
        Ok((dim_amounts, dim_rem))
    }

    fn divide_into_with_strategy(&self, parts: i64, strategy: DivisionStrategySet) -> FinancialResult<Vec<Self>> {
        let (amounts, _) = self.value.divide_into(parts, strategy)?;
        Ok(amounts.into_iter()
            .map(|a| DimensionedAmount::new(a, &self.dimension))
            .collect())
    }

    // --- Array Helpers --- //

    /// Sums a mapped array of identical dimensions strictly.
    pub fn strict_sum_over(items: &[Self]) -> FinancialResult<Self> {
        if items.is_empty() {
            return Err(FinancialError::invalid_operation("Cannot sum_over an empty array strictly without a baseline dimension"));
        }
        let mut total = items[0].clone();
        for item in items.iter().skip(1) {
            total = total.strict_add(item)?;
        }
        Ok(total)
    }

    /// Multiply each item in an array by a paired scalar, then strictly sum the results.
    pub fn strict_sum_over_products(items: &[(Self, FixedDecimal)]) -> FinancialResult<Self> {
        if items.is_empty() {
            return Err(FinancialError::invalid_operation("Cannot sum_over_products an empty array"));
        }
        // Take the first execution as our baseline total
        let mut total = items[0].0.multiply(&items[0].1)?;
        // Accumulate remaining multiples
        for (amount, multiplier) in items.iter().skip(1) {
            let product = amount.multiply(multiplier)?;
            total = total.strict_add(&product)?;
        }
        Ok(total)
    }

    fn strict_require_dimension(&self, other: &Self) -> FinancialResult<()> {
        if self.dimension != other.dimension {
            return Err(FinancialError::invalid_operation(format!(
                "Dimension mismatch: {} != {}", self.dimension, other.dimension
            )));
        }
        Ok(())
    }
}

/// A poly-dimensional set, like a Ledger Account or a Shopping Cart, 
/// holding aggregations of various distinct dimensions.
#[derive(Debug, Clone, Default)]
pub struct DimensionSet {
    pub totals: HashMap<String, FixedDecimal>,
}

impl DimensionSet {
    pub fn new() -> Self {
        Self { totals: HashMap::new() }
    }

    /// Gracefully accumulates mixed items natively without throwing.
    pub fn add(&mut self, item: &DimensionedAmount) -> FinancialResult<()> {
        if let Some(existing) = self.totals.get(&item.dimension) {
            let summed = existing.add(&item.value)?;
            self.totals.insert(item.dimension.clone(), summed);
        } else {
            self.totals.insert(item.dimension.clone(), item.value.clone());
        }
        Ok(())
    }

    /// Gracefully subtracts mixed items
    pub fn subtract(&mut self, item: &DimensionedAmount) -> FinancialResult<()> {
        if let Some(existing) = self.totals.get(&item.dimension) {
            let diff = existing.subtract(&item.value)?;
            self.totals.insert(item.dimension.clone(), diff);
        } else {
            // Subtracting from 0: technically negative amount
            let zero = FixedDecimal::from_str_with_precision("0", item.value.precision())?;
            let diff = zero.subtract(&item.value)?;
            self.totals.insert(item.dimension.clone(), diff);
        }
        Ok(())
    }

    pub fn unwrap_as_vec(&self) -> Vec<DimensionedAmount> {
        self.totals.iter().map(|(dim, val)| {
            DimensionedAmount::new(val.clone(), dim.clone())
        }).collect()
    }

    // --- Set Math Operations --- //

    /// Multiply every dimension total by a scalar multiplier.
    pub fn multiply(&self, multiplier: &FixedDecimal) -> FinancialResult<Self> {
        let mut result = DimensionSet::new();
        for (dim, val) in &self.totals {
            result.totals.insert(dim.clone(), val.multiply(multiplier)?);
        }
        Ok(result)
    }

    /// Divide every dimension total by a scalar, rounding using a given strategy.
    pub fn divide_rounded(&self, divisor: &FixedDecimal, strategy: RoundingStrategy) -> FinancialResult<Self> {
        let mut result = DimensionSet::new();
        for (dim, val) in &self.totals {
            result.totals.insert(dim.clone(), val.divide_with_strategy(divisor, strategy)?);
        }
        Ok(result)
    }

    /// Take a percentage of every dimension total.
    pub fn percentage_of_rounded(&self, percentage: &FixedDecimal, strategy: RoundingStrategy) -> FinancialResult<Self> {
        let mut result = DimensionSet::new();
        let hundred = FixedDecimal::from_str_with_precision("100", percentage.precision())?;
        for (dim, val) in &self.totals {
            let multiplied = val.multiply(percentage)?;
            result.totals.insert(dim.clone(), multiplied.divide_with_strategy(&hundred, strategy)?);
        }
        Ok(result)
    }

    // --- Divide Into Parts (Set Level) --- //

    /// Divide the entire multi-dimensional set into integer parts, loading remainder into the FIRST set of the list.
    pub fn divide_into_load_first(&self, parts: i64) -> FinancialResult<Vec<Self>> {
        let strategy = DivisionStrategySet {
            rounding: RoundingStrategy::Down,
            remainder: RemainderStrategy::AddToFirst,
        };
        self.divide_into_with_strategy(parts, strategy)
    }

    /// Divide into integer parts, loading remainder into the LAST set.
    pub fn divide_into_load_last(&self, parts: i64) -> FinancialResult<Vec<Self>> {
        let strategy = DivisionStrategySet {
            rounding: RoundingStrategy::Down,
            remainder: RemainderStrategy::AddToLast,
        };
        self.divide_into_with_strategy(parts, strategy)
    }

    /// Divide into integer parts, keeping the remainder of all dimensions in a separate explicit Set if any remainders exist.
    pub fn divide_into_with_remainder(&self, parts: i64) -> FinancialResult<(Vec<Self>, Option<Self>)> {
        let strategy = DivisionStrategySet {
            rounding: RoundingStrategy::Down,
            remainder: RemainderStrategy::KeepSeparate,
        };
        let mut sets = vec![DimensionSet::new(); parts as usize];
        let mut rem_set = DimensionSet::new();
        let mut has_rem = false;

        for (dim, val) in &self.totals {
            let (amounts, rem) = val.divide_into(parts, strategy.clone())?;
            for (i, amt) in amounts.into_iter().enumerate() {
                sets[i].totals.insert(dim.clone(), amt);
            }
            if let Some(r) = rem {
                rem_set.totals.insert(dim.clone(), r);
                has_rem = true;
            }
        }

        Ok((sets, if has_rem { Some(rem_set) } else { None }))
    }

    fn divide_into_with_strategy(&self, parts: i64, strategy: DivisionStrategySet) -> FinancialResult<Vec<Self>> {
        let mut sets = vec![DimensionSet::new(); parts as usize];
        for (dim, val) in &self.totals {
            let (amounts, _) = val.divide_into(parts, strategy.clone())?;
            for (i, amt) in amounts.into_iter().enumerate() {
                sets[i].totals.insert(dim.clone(), amt);
            }
        }
        Ok(sets)
    }

    // --- Array Helpers (Set Level) --- //

    /// Sums an array of sets together mapping matching dimensions automatically.
    pub fn sum_over(items: &[Self]) -> FinancialResult<Self> {
        let mut result = DimensionSet::new();
        for item in items {
            for (dim, val) in &item.totals {
                let amount = DimensionedAmount::new(val.clone(), dim.clone());
                result.add(&amount)?;
            }
        }
        Ok(result)
    }

    /// Multiply a list of dimensioned items by their multipliers, returning a grouped Set of dimensions.
    pub fn sum_over_products(items: &[(DimensionedAmount, FixedDecimal)]) -> FinancialResult<Self> {
        let mut result = DimensionSet::new();
        for (amount, multiplier) in items {
            let product = amount.multiply(multiplier)?;
            result.add(&product)?;
        }
        Ok(result)
    }
}

// ========================================================= //
// ================= DOCUMENTATION TESTS  ================== //
// ========================================================= //

#[cfg(test)]
mod tests {
    use super::*;

    /// # DimensionedAmount Strict Operations
    /// This test documents how strict operations fail forcefully on mismatch,
    /// but execute mathematical transformations natively when types align.
    #[test]
    fn test_strict_dimension_operations() -> FinancialResult<()> {
        let usd_100 = DimensionedAmount::new(FixedDecimal::from_str_with_precision("100.00", 2)?, "USD");
        let usd_50 = DimensionedAmount::new(FixedDecimal::from_str_with_precision("50.00", 2)?, "USD");
        let eur_50 = DimensionedAmount::new(FixedDecimal::from_str_with_precision("50.00", 2)?, "EUR");

        // 1. Strict Add
        let sum = usd_100.strict_add(&usd_50)?;
        assert_eq!(sum.value.to_string(), "150.00");

        // Fails correctly if units mismatch (Apples != Oranges)
        assert!(usd_100.strict_add(&eur_50).is_err());

        // 2. Strict Multiply (e.g., doubling a unit cost)
        let scalar_2 = FixedDecimal::from_str_with_precision("2.00", 2)?;
        let double_usd = usd_100.multiply(&scalar_2)?;
        assert_eq!(double_usd.value.to_string(), "200.00");

        Ok(())
    }

    /// # Dimension Set Math Operations
    /// Demonstrates how to take an aggregated dimension set containing multiple 
    /// currencies and apply standard operations across the entire group globally.
    #[test]
    fn test_dimension_set_math_ops() -> FinancialResult<()> {
        let mut premium_set = DimensionSet::new();
        let usd_premium = DimensionedAmount::new(FixedDecimal::from_str_with_precision("1000.00", 2)?, "USD");
        let eur_premium = DimensionedAmount::new(FixedDecimal::from_str_with_precision("400.00", 2)?, "EUR");

        premium_set.add(&usd_premium)?;
        premium_set.add(&eur_premium)?;

        // Example: The user wants 15% of the total premium set (all dimensions)
        let percentage_15 = FixedDecimal::from_str_with_precision("15.00", 2)?;
        let client_cut_set = premium_set.percentage_of_rounded(&percentage_15, RoundingStrategy::HalfUp)?;

        assert_eq!(client_cut_set.totals.get("USD").unwrap().to_string(), "150.00");
        assert_eq!(client_cut_set.totals.get("EUR").unwrap().to_string(), "60.00");

        Ok(())
    }

    /// # Installment Division via Divide Into (Load First / Remainder)
    /// Shows how a multi-currency set (e.g. `multiPremiumSet`) can natively
    /// split into 12 distinct months with all pennies appropriately routed avoiding drifting decimals.
    #[test]
    fn test_dimension_set_divide_into() -> FinancialResult<()> {
        // Setup slightly messy amounts
        let mut set = DimensionSet::new();
        set.add(&DimensionedAmount::new(FixedDecimal::from_str_with_precision("10.00", 2)?, "USD"))?; // 10 / 3 = 3.33r1
        set.add(&DimensionedAmount::new(FixedDecimal::from_str_with_precision("50.00", 2)?, "EUR"))?; // 50 / 3 = 16.66r2

        // Divide into 3 parts, tracking remainders separately
        let (parts, remainder_opt) = set.divide_into_with_remainder(3)?;
        
        assert_eq!(parts.len(), 3);
        for part in &parts {
            assert_eq!(part.totals.get("USD").unwrap().to_string(), "3.33");
            assert_eq!(part.totals.get("EUR").unwrap().to_string(), "16.66");
        }

        let rem = remainder_opt.unwrap();
        assert_eq!(rem.totals.get("USD").unwrap().to_string(), "0.01"); // 1 cent lost
        assert_eq!(rem.totals.get("EUR").unwrap().to_string(), "0.02"); // 2 cents lost

        // Verify alternative: Load into first set!
        let loaded_parts = set.divide_into_load_first(3)?;
        assert_eq!(loaded_parts[0].totals.get("USD").unwrap().to_string(), "3.34");
        assert_eq!(loaded_parts[0].totals.get("EUR").unwrap().to_string(), "16.68");
        assert_eq!(loaded_parts[1].totals.get("USD").unwrap().to_string(), "3.33");
        assert_eq!(loaded_parts[1].totals.get("EUR").unwrap().to_string(), "16.66");

        Ok(())
    }

    /// # Line Proportion Grouping via SumOverProducts
    /// A developer provides lines from disparate dimensions with varying fractional properties,
    /// we want to map these into a unified set of outputs safely.
    #[test]
    fn test_sum_over_products_set() -> FinancialResult<()> {
        let line_1 = DimensionedAmount::new(FixedDecimal::from_str_with_precision("100.00", 2)?, "USD");
        let line_1_pct = FixedDecimal::from_str_with_precision("0.20", 2)?; // 20%
        
        let line_2 = DimensionedAmount::new(FixedDecimal::from_str_with_precision("500.00", 2)?, "GBP");
        let line_2_pct = FixedDecimal::from_str_with_precision("0.10", 2)?; // 10%
        
        let line_3 = DimensionedAmount::new(FixedDecimal::from_str_with_precision("50.00", 2)?, "USD");
        let line_3_pct = FixedDecimal::from_str_with_precision("0.40", 2)?; // 40%

        let items = vec![
            (line_1, line_1_pct),
            (line_2, line_2_pct),
            (line_3, line_3_pct),
        ];

        let agg_set = DimensionSet::sum_over_products(&items)?;
        
        // USD = (100 * .2 = 20) + (50 * .4 = 20) = 40.00
        // GBP = (500 * .1 = 50) = 50.00
        assert_eq!(agg_set.totals.get("USD").unwrap().to_string(), "40.00"); // Standard multiplying expansion
        assert_eq!(agg_set.totals.get("GBP").unwrap().to_string(), "50.00"); 

        Ok(())

        // Note: From this `aggSet` we can now pass it directly into the `ConversionContext::ConvertLate` 
        // to snap to a specific unified precision outputs across target output currencies!
    }
}
