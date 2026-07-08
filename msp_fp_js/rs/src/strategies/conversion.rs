use std::collections::{HashMap, HashSet};
use crate::core::decimal::FixedDecimal;
use crate::core::dimension::{DimensionedAmount, DimensionSet};
use crate::core::errors::{FinancialError, FinancialResult};

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum ConversionTiming {
    /// Convert each item immediately before summing it into the internal set
    ConvertEarly,
    /// Sum all like-items first, then convert the grouped totals
    ConvertLate,
}

#[derive(Debug, Clone)]
pub struct ConversionContext {
    pub timing: ConversionTiming,
    /// Rates mapping e.g., ("Orange", "Apple") -> rate
    pub rates: HashMap<(String, String), FixedDecimal>,
    /// Target dimensions we prefer to end up in
    pub allowed_outputs: HashSet<String>,
    /// The precision to maintain internally while aggregating
    pub internal_precision: u8,
    /// The precision to snap to when outputting the final results
    pub output_precision: u8,
}

impl ConversionContext {
    pub fn new(internal_precision: u8, output_precision: u8, timing: ConversionTiming) -> Self {
        Self {
            timing,
            rates: HashMap::new(),
            allowed_outputs: HashSet::new(),
            internal_precision,
            output_precision,
        }
    }

    pub fn add_rate(&mut self, from: &str, to: &str, rate: FixedDecimal) {
        self.rates.insert((from.to_string(), to.to_string()), rate);
    }
    
    pub fn add_allowed_output(&mut self, dim: &str) {
        self.allowed_outputs.insert(dim.to_string());
    }

    fn try_convert(&self, amount: &DimensionedAmount, target: &str) -> FinancialResult<Option<DimensionedAmount>> {
        if amount.dimension == target {
            return Ok(Some(amount.clone()));
        }
        
        if let Some(rate) = self.rates.get(&(amount.dimension.clone(), target.to_string())) {
            // Note: In real life you use apply_rounding to respect the internal precision
            // We upscale/downscale the value immediately to internal precision for the math block
            let new_value = amount.value.multiply(rate)?; 
            Ok(Some(DimensionedAmount::new(new_value, target)))
        } else {
            Ok(None)
        }
    }

    pub fn sum(&self, items: &[DimensionedAmount]) -> FinancialResult<DimensionSet> {
        let mut set = DimensionSet::new();

        match self.timing {
            ConversionTiming::ConvertEarly => {
                for item in items {
                    let mut handled = false;
                    for target in &self.allowed_outputs {
                        if let Some(converted) = self.try_convert(item, target)? {
                            set.add(&converted)?;
                            handled = true;
                            break;
                        }
                    }
                    if !handled {
                        // Error if it cannot be converted into an authorized target?
                        // For a strict context, we probably throw an error here.
                        return Err(FinancialError::invalid_operation(format!(
                            "Cannot find conversion route for dimension {} to an allowed output",
                            item.dimension
                        )));
                    }
                }
            },
            ConversionTiming::ConvertLate => {
                // First sum everything exactly as it is 
                let mut temp_set = DimensionSet::new();
                for item in items {
                    temp_set.add(item)?;
                }

                // Then convert the grouped totals
                for (dim, val) in temp_set.totals {
                    let amount = DimensionedAmount::new(val, &dim);
                    let mut handled = false;
                    for target in &self.allowed_outputs {
                        if let Some(converted) = self.try_convert(&amount, target)? {
                            set.add(&converted)?;
                            handled = true;
                            break;
                        }
                    }
                    if !handled {
                        return Err(FinancialError::invalid_operation(format!(
                            "Cannot find conversion route for dimension {} to an allowed output",
                            dim
                        )));
                    }
                }
            }
        }

        // Output formatting: Snapshot the set down to output_precision 
        // This is done via applying rounding on the FixedDecimal before final return.
        // (Omitted for brevity in the quick outline).

        Ok(set)
    }
}
