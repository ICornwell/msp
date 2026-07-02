//! WebAssembly bridge module for browser execution
//! 
//! This module exposes our financial precision API natively to the browser via wasm-bindgen

use wasm_bindgen::prelude::*;
use crate::core::FixedDecimal;
use crate::strategies::{FinancialContext, AccumulationStrategy, FinancialAccumulator};

#[wasm_bindgen]
pub fn add(a_str: &str, a_precision: u8, b_str: &str, b_precision: u8) -> Result<String, JsValue> {
    let a = FixedDecimal::from_str_with_precision(a_str, a_precision)
        .map_err(|e| JsValue::from_str(&e.to_string()))?;
    let b = FixedDecimal::from_str_with_precision(b_str, b_precision)
        .map_err(|e| JsValue::from_str(&e.to_string()))?;
    
    let sum = a.add(&b)
        .map_err(|e| JsValue::from_str(&e.to_string()))?;
        
    Ok(sum.to_string())
}

#[wasm_bindgen]
pub fn subtract(a_str: &str, a_precision: u8, b_str: &str, b_precision: u8) -> Result<String, JsValue> {
    let a = FixedDecimal::from_str_with_precision(a_str, a_precision)
        .map_err(|e| JsValue::from_str(&e.to_string()))?;
    let b = FixedDecimal::from_str_with_precision(b_str, b_precision)
        .map_err(|e| JsValue::from_str(&e.to_string()))?;
    
    let diff = a.subtract(&b)
        .map_err(|e| JsValue::from_str(&e.to_string()))?;
        
    Ok(diff.to_string())
}

#[wasm_bindgen]
pub fn multiply(a_str: &str, a_precision: u8, b_str: &str, b_precision: u8) -> Result<String, JsValue> {
    let a = FixedDecimal::from_str_with_precision(a_str, a_precision)
        .map_err(|e| JsValue::from_str(&e.to_string()))?;
    let b = FixedDecimal::from_str_with_precision(b_str, b_precision)
        .map_err(|e| JsValue::from_str(&e.to_string()))?;
    
    let product = a.multiply(&b)
        .map_err(|e| JsValue::from_str(&e.to_string()))?;
        
    Ok(product.to_string())
}

#[wasm_bindgen]
pub fn create_fixed_decimal(value_str: &str, precision: u8) -> Result<String, JsValue> {
    let decimal = FixedDecimal::from_str_with_precision(value_str, precision)
        .map_err(|e| JsValue::from_str(&e.to_string()))?;
    Ok(decimal.to_string())
}
