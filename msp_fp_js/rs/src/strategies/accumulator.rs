use std::collections::HashMap;

use crate::core::{FixedDecimal, FinancialResult};
use super::context::{CurrencyCode, FinancialContext};

/// Defines how the accumulator should handle inputs across currencies
pub enum AccumulationStrategy<'a> {
    /// Strict Target
    /// Will only accumulate into the specified single target currency bucket.
    /// If an incoming currency differs and no exchange rate exists in the context, an error is thrown.
    StrictTo(CurrencyCode, &'a FinancialContext),

    /// Multi-Bucket Mode 
    /// Adds each currency into its own isolated bucket. Never converts.
    MultiBucket,

    /// Partitioned Map Mode
    /// Translates incoming currencies via a HashMap. 
    /// e.g. "AUD" => "GBP", "EUR" => "EUR".
    /// If a mapping demands conversion, it uses the Context rates.
    PartitionedMapping(HashMap<CurrencyCode, CurrencyCode>, &'a FinancialContext)
}

/// A financial accumulator that adds multiple FixedDecimals across currencies
/// safely, respecting precision alignment and exchange rates contextually.
pub struct FinancialAccumulator<'a> {
    strategy: AccumulationStrategy<'a>,
    /// The accumulating buckets of value per currency
    buckets: HashMap<CurrencyCode, FixedDecimal>,
}

impl<'a> FinancialAccumulator<'a> {
    /// Create a new accumulator using the specified strategy
    pub fn new(strategy: AccumulationStrategy<'a>) -> Self {
        FinancialAccumulator {
            strategy,
            buckets: HashMap::new(),
        }
    }

    /// Add an amount with a currency into the accumulator based on the strategy
    pub fn add(&mut self, amount: &FixedDecimal, currency: &CurrencyCode) -> FinancialResult<()> {
        let (target_currency, value_to_add) = match &self.strategy {
            AccumulationStrategy::StrictTo(target, ctx) => {
                if currency == target {
                    (target.clone(), amount.clone())
                } else {
                    let converted = ctx.convert_currency(amount, currency, target)?;
                    (target.clone(), converted)
                }
            },
            AccumulationStrategy::MultiBucket => {
                (currency.clone(), amount.clone())
            },
            AccumulationStrategy::PartitionedMapping(map, ctx) => {
                let target = map.get(currency).unwrap_or(currency); 
                if currency == target {
                    (target.clone(), amount.clone())
                } else {
                    let converted = ctx.convert_currency(amount, currency, target)?;
                    (target.clone(), converted)
                }
            }
        };

        if let Some(existing) = self.buckets.get_mut(&target_currency) {
            let max_precision = std::cmp::max(existing.precision(), value_to_add.precision());
            
            let existing_aligned = if existing.precision() != max_precision {
                FixedDecimal::from_str_with_precision(&existing.to_string(), max_precision)?
            } else {
                existing.clone()
            };

            let new_aligned = if value_to_add.precision() != max_precision {
                FixedDecimal::from_str_with_precision(&value_to_add.to_string(), max_precision)?
            } else {
                value_to_add.clone()
            };

            *existing = existing_aligned.add(&new_aligned)?;
        } else {
            self.buckets.insert(target_currency, value_to_add);
        }

        Ok(())
    }

    /// Retrieve the resulting buckets
    pub fn get_buckets(self) -> HashMap<CurrencyCode, FixedDecimal> {
        self.buckets
    }
}
