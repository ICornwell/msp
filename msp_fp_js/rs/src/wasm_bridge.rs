//! WebAssembly bridge module for browser execution
//! 
//! This module exposes our financial precision API natively to the browser via
//! wasm-bindgen.

use wasm_bindgen::prelude::*;
use crate::core::FixedDecimal;
use crate::core::dimension::{DimensionedAmount, DimensionSet};
use serde::{Deserialize, Serialize};

// -------------------------------------------------------------
// Type Definitions for WASM Interface Objects
// -------------------------------------------------------------

#[derive(Serialize, Deserialize)]
pub struct WasmDimensionedAmount {
    pub value: String,
    pub precision: u8,
    pub dimension: String,
}

#[derive(Serialize, Deserialize)]
pub struct WasmSumProductPair {
    pub amount: WasmDimensionedAmount,
    pub multiplier: WasmScalar,
}

#[derive(Serialize, Deserialize)]
pub struct WasmScalar {
    pub value: String,
    pub precision: u8,
}

fn from_wasm_dim(w: &WasmDimensionedAmount) -> Result<DimensionedAmount, String> {
    let fd = FixedDecimal::from_str_with_precision(&w.value, w.precision)
        .map_err(|e| e.to_string())?;
    Ok(DimensionedAmount::new(fd, &w.dimension))
}

fn to_wasm_dim(d: &DimensionedAmount) -> WasmDimensionedAmount {
    WasmDimensionedAmount {
        value: d.value.to_string(),
        precision: d.value.precision(),
        dimension: d.dimension.clone(),
    }
}

// -------------------------------------------------------------
// Namespace equivalent: fp_
// -------------------------------------------------------------

#[wasm_bindgen]
pub fn fp_add(a_str: &str, a_precision: u8, b_str: &str, b_precision: u8) -> Result<String, JsValue> {
    let a = FixedDecimal::from_str_with_precision(a_str, a_precision).map_err(|e| JsValue::from_str(&e.to_string()))?;
    let b = FixedDecimal::from_str_with_precision(b_str, b_precision).map_err(|e| JsValue::from_str(&e.to_string()))?;
    let sum = a.add(&b).map_err(|e| JsValue::from_str(&e.to_string()))?;
    Ok(sum.to_string())
}

#[wasm_bindgen]
pub fn fp_subtract(a_str: &str, a_precision: u8, b_str: &str, b_precision: u8) -> Result<String, JsValue> {
    let a = FixedDecimal::from_str_with_precision(a_str, a_precision).map_err(|e| JsValue::from_str(&e.to_string()))?;
    let b = FixedDecimal::from_str_with_precision(b_str, b_precision).map_err(|e| JsValue::from_str(&e.to_string()))?;
    let diff = a.subtract(&b).map_err(|e| JsValue::from_str(&e.to_string()))?;
    Ok(diff.to_string())
}

#[wasm_bindgen]
pub fn fp_multiply(a_str: &str, a_precision: u8, b_str: &str, b_precision: u8) -> Result<String, JsValue> {
    let a = FixedDecimal::from_str_with_precision(a_str, a_precision).map_err(|e| JsValue::from_str(&e.to_string()))?;
    let b = FixedDecimal::from_str_with_precision(b_str, b_precision).map_err(|e| JsValue::from_str(&e.to_string()))?;
    let product = a.multiply(&b).map_err(|e| JsValue::from_str(&e.to_string()))?;
    Ok(product.to_string())
}

#[wasm_bindgen]
pub fn fp_divide(a_str: &str, a_precision: u8, b_str: &str, b_precision: u8) -> Result<String, JsValue> {
    let a = FixedDecimal::from_str_with_precision(a_str, a_precision).map_err(|e| JsValue::from_str(&e.to_string()))?;
    let b = FixedDecimal::from_str_with_precision(b_str, b_precision).map_err(|e| JsValue::from_str(&e.to_string()))?;
    let product = a.divide(&b).map_err(|e| JsValue::from_str(&e.to_string()))?;
    Ok(product.to_string())
}

#[wasm_bindgen]
pub fn fp_create_fixed_decimal(value_str: &str, precision: u8) -> Result<String, JsValue> {
    let decimal = FixedDecimal::from_str_with_precision(value_str, precision).map_err(|e| JsValue::from_str(&e.to_string()))?;
    Ok(decimal.to_string())
}

// -------------------------------------------------------------
// Namespace equivalent: dim_
// -------------------------------------------------------------

#[wasm_bindgen]
pub fn dim_strict_add(a_js: JsValue, b_js: JsValue) -> Result<JsValue, JsValue> {
    let w_a: WasmDimensionedAmount = serde_wasm_bindgen::from_value(a_js)?;
    let w_b: WasmDimensionedAmount = serde_wasm_bindgen::from_value(b_js)?;
    
    let a = from_wasm_dim(&w_a).map_err(|e| JsValue::from_str(&e))?;
    let b = from_wasm_dim(&w_b).map_err(|e| JsValue::from_str(&e))?;
    
    let result = a.strict_add(&b).map_err(|e| JsValue::from_str(&e.to_string()))?;
    
    Ok(serde_wasm_bindgen::to_value(&to_wasm_dim(&result))?)
}

#[wasm_bindgen]
pub fn dim_strict_subtract(a_js: JsValue, b_js: JsValue) -> Result<JsValue, JsValue> {
    let w_a: WasmDimensionedAmount = serde_wasm_bindgen::from_value(a_js)?;
    let w_b: WasmDimensionedAmount = serde_wasm_bindgen::from_value(b_js)?;
    
    let a = from_wasm_dim(&w_a).map_err(|e| JsValue::from_str(&e))?;
    let b = from_wasm_dim(&w_b).map_err(|e| JsValue::from_str(&e))?;
    
    let result = a.strict_subtract(&b).map_err(|e| JsValue::from_str(&e.to_string()))?;
    
    Ok(serde_wasm_bindgen::to_value(&to_wasm_dim(&result))?)
}

#[wasm_bindgen]
pub fn dim_multiply(a_js: JsValue, scalar_js: JsValue) -> Result<JsValue, JsValue> {
    let w_a: WasmDimensionedAmount = serde_wasm_bindgen::from_value(a_js)?;
    let a = from_wasm_dim(&w_a).map_err(|e| JsValue::from_str(&e))?;
    
    let w_s: WasmScalar = serde_wasm_bindgen::from_value(scalar_js)?;
    let multiplier = FixedDecimal::from_str_with_precision(&w_s.value, w_s.precision)
        .map_err(|e| JsValue::from_str(&e.to_string()))?;
        
    let result = a.multiply(&multiplier).map_err(|e| JsValue::from_str(&e.to_string()))?;
    Ok(serde_wasm_bindgen::to_value(&to_wasm_dim(&result))?)
}

#[wasm_bindgen]
pub fn dim_strict_sum_over(items_js: JsValue) -> Result<JsValue, JsValue> {
    let w_items: Vec<WasmDimensionedAmount> = serde_wasm_bindgen::from_value(items_js)?;
    
    let mut dims = Vec::new();
    for w in w_items {
        dims.push(from_wasm_dim(&w).map_err(|e| JsValue::from_str(&e))?);
    }
    
    let result = DimensionedAmount::strict_sum_over(&dims)
        .map_err(|e| JsValue::from_str(&e.to_string()))?;
        
    Ok(serde_wasm_bindgen::to_value(&to_wasm_dim(&result))?)
}

// -------------------------------------------------------------
// Namespace equivalent: dimSet_
// -------------------------------------------------------------

#[wasm_bindgen]
pub fn dimSet_add(set_items_js: JsValue, add_js: JsValue) -> Result<JsValue, JsValue> {
    let w_items: Vec<WasmDimensionedAmount> = serde_wasm_bindgen::from_value(set_items_js)?;
    let mut set = DimensionSet::new();
    
    for w in w_items {
        let dim = from_wasm_dim(&w).map_err(|e| JsValue::from_str(&e))?;
        set.add(&dim).map_err(|e| JsValue::from_str(&e.to_string()))?;
    }
    
    let w_add: WasmDimensionedAmount = serde_wasm_bindgen::from_value(add_js)?;
    let add_dim = from_wasm_dim(&w_add).map_err(|e| JsValue::from_str(&e))?;
    
    set.add(&add_dim).map_err(|e| JsValue::from_str(&e.to_string()))?;
    
    let out_vec: Vec<WasmDimensionedAmount> = set.unwrap_as_vec().iter().map(to_wasm_dim).collect();
    Ok(serde_wasm_bindgen::to_value(&out_vec)?)
}

#[wasm_bindgen]
pub fn dimSet_divideInto(set_items_js: JsValue, parts: i64, strategy_str: &str) -> Result<JsValue, JsValue> {
    let w_items: Vec<WasmDimensionedAmount> = serde_wasm_bindgen::from_value(set_items_js)?;
    let mut set = DimensionSet::new();
    
    for w in w_items {
        let dim = from_wasm_dim(&w).map_err(|e| JsValue::from_str(&e))?;
        set.add(&dim).map_err(|e| JsValue::from_str(&e.to_string()))?;
    }
    
    let bags_result = match strategy_str {
        "LoadFirst" => set.divide_into_load_first(parts),
        "LoadLast" => set.divide_into_load_last(parts),
        _ => return Err(JsValue::from_str("Use 'LoadFirst' or 'LoadLast'")),
    }.map_err(|e| JsValue::from_str(&e.to_string()))?;
    
    let mut out_array_of_arrays = Vec::new();
    for bag in bags_result {
        let bag_arr: Vec<WasmDimensionedAmount> = bag.unwrap_as_vec().iter().map(to_wasm_dim).collect();
        out_array_of_arrays.push(bag_arr);
    }
    
    Ok(serde_wasm_bindgen::to_value(&out_array_of_arrays)?)
}

// -------------------------------------------------------------
// Namespace equivalent: ccy_
// -------------------------------------------------------------

#[wasm_bindgen]
pub fn ccy_strict_add(a_str: &str, b_str: &str) -> Result<String, JsValue> {
    let a = crate::bridge::currency::parse_ccy_string(a_str).map_err(|e| JsValue::from_str(&e))?;
    let b = crate::bridge::currency::parse_ccy_string(b_str).map_err(|e| JsValue::from_str(&e))?;
    
    let result = a.strict_add(&b).map_err(|e| JsValue::from_str(&e.to_string()))?;
    Ok(crate::bridge::currency::format_ccy_string(&result))
}

#[wasm_bindgen]
pub fn ccy_strict_subtract(a_str: &str, b_str: &str) -> Result<String, JsValue> {
    let a = crate::bridge::currency::parse_ccy_string(a_str).map_err(|e| JsValue::from_str(&e))?;
    let b = crate::bridge::currency::parse_ccy_string(b_str).map_err(|e| JsValue::from_str(&e))?;
    
    let result = a.strict_subtract(&b).map_err(|e| JsValue::from_str(&e.to_string()))?;
    Ok(crate::bridge::currency::format_ccy_string(&result))
}

#[wasm_bindgen]
pub fn ccy_multiply(a_str: &str, m_js: JsValue) -> Result<String, JsValue> {
    let a = crate::bridge::currency::parse_ccy_string(a_str).map_err(|e| JsValue::from_str(&e))?;
    let w_m: WasmScalar = serde_wasm_bindgen::from_value(m_js)?;
    let multiplier = FixedDecimal::from_str_with_precision(&w_m.value, w_m.precision)
        .map_err(|e| JsValue::from_str(&e.to_string()))?;
        
    let result = a.multiply(&multiplier).map_err(|e| JsValue::from_str(&e.to_string()))?;
    Ok(crate::bridge::currency::format_ccy_string(&result))
}

#[wasm_bindgen]
pub fn ccy_divide_into(a_str: &str, parts: i64, strategy_str: &str) -> Result<JsValue, JsValue> {
    let a = crate::bridge::currency::parse_ccy_string(a_str).map_err(|e| JsValue::from_str(&e))?;
    
    let result_vec = match strategy_str {
        "LoadFirst" => a.divide_into_load_first(parts),
        "LoadLast" => a.divide_into_load_last(parts),
        _ => return Err(JsValue::from_str("Use 'LoadFirst' or 'LoadLast'")),
    }.map_err(|e| JsValue::from_str(&e.to_string()))?;
    
    let out_vec: Vec<String> = result_vec.iter().map(crate::bridge::currency::format_ccy_string).collect();
    Ok(serde_wasm_bindgen::to_value(&out_vec)?)
}

#[wasm_bindgen]
pub fn ccy_strict_sum_over(items_js: JsValue) -> Result<String, JsValue> {
    let strs: Vec<String> = serde_wasm_bindgen::from_value(items_js)?;
    let mut dims = Vec::new();
    
    for s in strs {
        dims.push(crate::bridge::currency::parse_ccy_string(&s).map_err(|e| JsValue::from_str(&e))?);
    }
    
    let result = DimensionedAmount::strict_sum_over(&dims).map_err(|e| JsValue::from_str(&e.to_string()))?;
    Ok(crate::bridge::currency::format_ccy_string(&result))
}

// -------------------------------------------------------------
// Namespace equivalent: ccySet_
// -------------------------------------------------------------

#[wasm_bindgen]
pub fn ccySet_add(set_js: JsValue, add_str: &str) -> Result<JsValue, JsValue> {
    let strs: Vec<String> = serde_wasm_bindgen::from_value(set_js)?;
    let mut set = DimensionSet::new();
    
    for s in strs {
        let dim = crate::bridge::currency::parse_ccy_string(&s).map_err(|e| JsValue::from_str(&e))?;
        set.add(&dim).map_err(|e| JsValue::from_str(&e.to_string()))?;
    }
    
    let add_dim = crate::bridge::currency::parse_ccy_string(add_str).map_err(|e| JsValue::from_str(&e))?;
    set.add(&add_dim).map_err(|e| JsValue::from_str(&e.to_string()))?;
    
    let out_vec: Vec<String> = set.unwrap_as_vec().iter().map(crate::bridge::currency::format_ccy_string).collect();
    Ok(serde_wasm_bindgen::to_value(&out_vec)?)
}

#[wasm_bindgen]
pub fn ccySet_divide_into(set_js: JsValue, parts: i64, strategy_str: &str) -> Result<JsValue, JsValue> {
    let strs: Vec<String> = serde_wasm_bindgen::from_value(set_js)?;
    let mut set = DimensionSet::new();
    
    for s in strs {
        let dim = crate::bridge::currency::parse_ccy_string(&s).map_err(|e| JsValue::from_str(&e))?;
        set.add(&dim).map_err(|e| JsValue::from_str(&e.to_string()))?;
    }
    
    let bags_result = match strategy_str {
        "LoadFirst" => set.divide_into_load_first(parts),
        "LoadLast" => set.divide_into_load_last(parts),
        _ => return Err(JsValue::from_str("Use 'LoadFirst' or 'LoadLast'")),
    }.map_err(|e| JsValue::from_str(&e.to_string()))?;
    
    let mut out_array_of_arrays = Vec::new();
    for bag in bags_result {
        let bag_arr: Vec<String> = bag.unwrap_as_vec().iter().map(crate::bridge::currency::format_ccy_string).collect();
        out_array_of_arrays.push(bag_arr);
    }
    
    Ok(serde_wasm_bindgen::to_value(&out_array_of_arrays)?)
}

// -------------------------------------------------------------
// Namespace equivalent: fpStr_
// -------------------------------------------------------------

#[wasm_bindgen]
pub fn fpStr_add(a_str: &str, b_str: &str) -> Result<String, JsValue> {
    let a = crate::bridge::fp_str::parse_fp_string(a_str).map_err(|e| JsValue::from_str(&e))?;
    let b = crate::bridge::fp_str::parse_fp_string(b_str).map_err(|e| JsValue::from_str(&e))?;
    
    let sum = a.add(&b).map_err(|e| JsValue::from_str(&e.to_string()))?;
    Ok(crate::bridge::fp_str::format_fp_string(&sum))
}

#[wasm_bindgen]
pub fn fpStr_subtract(a_str: &str, b_str: &str) -> Result<String, JsValue> {
    let a = crate::bridge::fp_str::parse_fp_string(a_str).map_err(|e| JsValue::from_str(&e))?;
    let b = crate::bridge::fp_str::parse_fp_string(b_str).map_err(|e| JsValue::from_str(&e))?;
    
    let diff = a.subtract(&b).map_err(|e| JsValue::from_str(&e.to_string()))?;
    Ok(crate::bridge::fp_str::format_fp_string(&diff))
}

#[wasm_bindgen]
pub fn fpStr_multiply(a_str: &str, b_str: &str) -> Result<String, JsValue> {
    let a = crate::bridge::fp_str::parse_fp_string(a_str).map_err(|e| JsValue::from_str(&e))?;
    let b = crate::bridge::fp_str::parse_fp_string(b_str).map_err(|e| JsValue::from_str(&e))?;
    
    let prod = a.multiply(&b).map_err(|e| JsValue::from_str(&e.to_string()))?;
    Ok(crate::bridge::fp_str::format_fp_string(&prod))
}

#[wasm_bindgen]
pub fn fpStr_divide(a_str: &str, b_str: &str) -> Result<String, JsValue> {
    let a = crate::bridge::fp_str::parse_fp_string(a_str).map_err(|e| JsValue::from_str(&e))?;
    let b = crate::bridge::fp_str::parse_fp_string(b_str).map_err(|e| JsValue::from_str(&e))?;
    
    let quot = a.divide(&b).map_err(|e| JsValue::from_str(&e.to_string()))?;
    Ok(crate::bridge::fp_str::format_fp_string(&quot))
}

#[wasm_bindgen]
pub fn fpStr_divideInto(a_str: &str, parts: i64, strategy_str: &str) -> Result<JsValue, JsValue> {
    let a = crate::bridge::fp_str::parse_fp_string(a_str).map_err(|e| JsValue::from_str(&e))?;
    
    use crate::strategies::DivisionStrategySet;
    use crate::strategies::RoundingStrategy;
    use crate::strategies::RemainderStrategy;
    
    let strategy_set = match strategy_str {
        "AddToFirst" => DivisionStrategySet {
            rounding: RoundingStrategy::Down,
            remainder: RemainderStrategy::AddToFirst,
        },
        "AddToLast" => DivisionStrategySet {
            rounding: RoundingStrategy::Down,
            remainder: RemainderStrategy::AddToLast,
        },
        _ => return Err(JsValue::from_str("Unknown division strategy")),
    };
    
    let (arrays, _) = a.divide_into(parts, strategy_set).map_err(|e| JsValue::from_str(&e.to_string()))?;
    
    let out_vec: Vec<String> = arrays.iter().map(crate::bridge::fp_str::format_fp_string).collect();
    Ok(serde_wasm_bindgen::to_value(&out_vec)?)
}
