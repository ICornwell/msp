//! Neon bridge module for JavaScript integration
//! 
//! This module contains all Neon-specific code for exposing the library
//! functionality to JavaScript/Node.js.

use neon::prelude::*;
use crate::{FixedDecimal, FinancialError, FinancialContext};

/// Add two fixed-point decimal numbers
pub fn add_decimal(mut cx: FunctionContext) -> JsResult<JsString> {
    let a_str = cx.argument::<JsString>(0)?.value(&mut cx);
    let a_precision = cx.argument::<JsNumber>(1)?.value(&mut cx) as u8;
    let b_str = cx.argument::<JsString>(2)?.value(&mut cx);
    let b_precision = cx.argument::<JsNumber>(3)?.value(&mut cx) as u8;
    
    let result = (|| -> Result<String, FinancialError> {
        let a = FixedDecimal::from_str_with_precision(&a_str, a_precision)?;
        let b = FixedDecimal::from_str_with_precision(&b_str, b_precision)?;
        let sum = a.add(&b)?;
        Ok(sum.to_string())
    })();
    
    match result {
        Ok(sum_str) => Ok(cx.string(sum_str)),
        Err(e) => cx.throw_error(format!("Calculation error: {}", e))
    }
}

/// Multiply two fixed-point decimal numbers
pub fn multiply_decimal(mut cx: FunctionContext) -> JsResult<JsString> {
    let a_str = cx.argument::<JsString>(0)?.value(&mut cx);
    let a_precision = cx.argument::<JsNumber>(1)?.value(&mut cx) as u8;
    let b_str = cx.argument::<JsString>(2)?.value(&mut cx);
    let b_precision = cx.argument::<JsNumber>(3)?.value(&mut cx) as u8;
    
    let result = (|| -> Result<String, FinancialError> {
        let a = FixedDecimal::from_str_with_precision(&a_str, a_precision)?;
        let b = FixedDecimal::from_str_with_precision(&b_str, b_precision)?;
        let product = a.multiply(&b)?;
        Ok(product.to_string())
    })();
    
    match result {
        Ok(product_str) => Ok(cx.string(product_str)),
        Err(e) => cx.throw_error(format!("Calculation error: {}", e))
    }
}

/// Convert currency using exchange rates
pub fn convert_currency(mut cx: FunctionContext) -> JsResult<JsString> {
    let amount_str = cx.argument::<JsString>(0)?.value(&mut cx);
    let precision = cx.argument::<JsNumber>(1)?.value(&mut cx) as u8;
    let from_currency = cx.argument::<JsString>(2)?.value(&mut cx);
    let to_currency = cx.argument::<JsString>(3)?.value(&mut cx);
    let rate_str = cx.argument::<JsString>(4)?.value(&mut cx);
    let rate_precision = cx.argument::<JsNumber>(5)?.value(&mut cx) as u8;
    
    let result = (|| -> Result<String, FinancialError> {
        let amount = FixedDecimal::from_str_with_precision(&amount_str, precision)?;
        let mut context = FinancialContext::new();
        context.add_currency_rate(&from_currency, &to_currency, &rate_str, rate_precision)?;
        let converted = context.convert_currency(&amount, &from_currency, &to_currency)?;
        Ok(converted.to_string())
    })();
    
    match result {
        Ok(converted_str) => Ok(cx.string(converted_str)),
        Err(e) => cx.throw_error(format!("Currency conversion error: {}", e))
    }
}

/// Create a fixed decimal from string and precision
pub fn create_fixed_decimal(mut cx: FunctionContext) -> JsResult<JsString> {
    let value_str = cx.argument::<JsString>(0)?.value(&mut cx);
    let precision = cx.argument::<JsNumber>(1)?.value(&mut cx) as u8;
    
    let result = (|| -> Result<String, FinancialError> {
        let decimal = FixedDecimal::from_str_with_precision(&value_str, precision)?;
        Ok(decimal.to_string())
    })();
    
    match result {
        Ok(decimal_str) => Ok(cx.string(decimal_str)),
        Err(e) => cx.throw_error(format!("Create decimal error: {}", e))
    }
}

/// Subtract two fixed-point decimal numbers  
pub fn subtract_decimal(mut cx: FunctionContext) -> JsResult<JsString> {
    let a_str = cx.argument::<JsString>(0)?.value(&mut cx);
    let a_precision = cx.argument::<JsNumber>(1)?.value(&mut cx) as u8;
    let b_str = cx.argument::<JsString>(2)?.value(&mut cx);
    let b_precision = cx.argument::<JsNumber>(3)?.value(&mut cx) as u8;
    
    let result = (|| -> Result<String, FinancialError> {
        let a = FixedDecimal::from_str_with_precision(&a_str, a_precision)?;
        let b = FixedDecimal::from_str_with_precision(&b_str, b_precision)?;
        let difference = a.subtract(&b)?;
        Ok(difference.to_string())
    })();
    
    match result {
        Ok(difference_str) => Ok(cx.string(difference_str)),
        Err(e) => cx.throw_error(format!("Calculation error: {}", e))
    }
}

/// Divide two fixed-point decimal numbers
pub fn divide_decimal(mut cx: FunctionContext) -> JsResult<JsString> {
    let a_str = cx.argument::<JsString>(0)?.value(&mut cx);
    let a_precision = cx.argument::<JsNumber>(1)?.value(&mut cx) as u8;
    let b_str = cx.argument::<JsString>(2)?.value(&mut cx);
    let b_precision = cx.argument::<JsNumber>(3)?.value(&mut cx) as u8;
    
    let result = (|| -> Result<String, FinancialError> {
        let a = FixedDecimal::from_str_with_precision(&a_str, a_precision)?;
        let b = FixedDecimal::from_str_with_precision(&b_str, b_precision)?;
        let quotient = a.divide(&b)?;
        Ok(quotient.to_string())
    })();
    
    match result {
        Ok(quotient_str) => Ok(cx.string(quotient_str)),
        Err(e) => cx.throw_error(format!("Calculation error: {}", e))
    }
}

/// Export functions to the Neon module
pub fn register_functions(cx: &mut ModuleContext) -> NeonResult<()> {
    cx.export_function("add", add_decimal)?;
    cx.export_function("multiply", multiply_decimal)?;
    cx.export_function("convertCurrency", convert_currency)?;
    cx.export_function("createFixedDecimal", create_fixed_decimal)?;
    cx.export_function("subtract", subtract_decimal)?;
    cx.export_function("divide", divide_decimal)?;
    cx.export_function("accumulateToTarget", accumulate_to_target)?;
    Ok(())
}

use crate::strategies::{FinancialAccumulator, AccumulationStrategy};

/// Accumulate an array of currency strings into a single target currency
pub fn accumulate_to_target(mut cx: FunctionContext) -> JsResult<JsString> {
    // 0: Array of format [{ amount: string, precision: u8, currency: string }]
    let entries_arg = cx.argument::<JsArray>(0)?;
    
    // 1: Target currency string
    let target_currency = cx.argument::<JsString>(1)?.value(&mut cx);
    
    // 2: Array of exchange rates: [{ from: string, to: string, rate: string, precision: u8 }]
    let rates_arg = cx.argument::<JsArray>(2)?;

    // Build the context with temporary rates
    let mut context = FinancialContext::new();
    
    // Parse rates array safely
    for i in 0..rates_arg.len(&mut cx) {
        if let Ok(rate_obj) = rates_arg.get::<JsObject, _, _>(&mut cx, i) {
            let from = rate_obj.get::<JsString, _, _>(&mut cx, "from")?.value(&mut cx);
            let to = rate_obj.get::<JsString, _, _>(&mut cx, "to")?.value(&mut cx);
            let rate = rate_obj.get::<JsString, _, _>(&mut cx, "rate")?.value(&mut cx);
            let precision = rate_obj.get::<JsNumber, _, _>(&mut cx, "precision")?.value(&mut cx) as u8;
            
            // Ignore failure to add individual rate (context swallows it or we can handle it)
            let _ = context.add_currency_rate(&from, &to, &rate, precision);
        }
    }

    let result = (|| -> Result<String, FinancialError> {
        let strategy = AccumulationStrategy::StrictTo(target_currency.clone(), &context);
        let mut accumulator = FinancialAccumulator::new(strategy);

        for i in 0..entries_arg.len(&mut cx) {
            if let Ok(entry_obj) = entries_arg.get::<JsObject, _, _>(&mut cx, i) {
                let amount_res = entry_obj.get::<JsString, _, _>(&mut cx, "amount");
                let precision_res = entry_obj.get::<JsNumber, _, _>(&mut cx, "precision");
                let ccy_res = entry_obj.get::<JsString, _, _>(&mut cx, "currency");

                if let (Ok(a), Ok(p), Ok(c)) = (amount_res, precision_res, ccy_res) {
                    let amount_str = a.value(&mut cx);
                    let precision = p.value(&mut cx) as u8;
                    let ccy = c.value(&mut cx);
                    let fd = FixedDecimal::from_str_with_precision(&amount_str, precision)?;
                    accumulator.add(&fd, &ccy)?;
                }
            }
        }

        let buckets = accumulator.get_buckets();
        if let Some(final_value) = buckets.get(&target_currency) {
            Ok(final_value.to_string())
        } else {
            Ok("0.0".to_string()) // Or throw error
        }
    })();

    match result {
        Ok(res_str) => Ok(cx.string(res_str)),
        Err(e) => cx.throw_error(format!("Accumulator error: {}", e))
    }
}
