use neon::prelude::*;
use crate::core::decimal::FixedDecimal;
use crate::core::dimension::{DimensionedAmount, DimensionSet};

// --- JS String Format Helpers ---
// Parses a string like "GBP: 100.00: 2dp" into a DimensionedAmount natively on the bridge
pub fn parse_ccy_string(s: &str) -> Result<DimensionedAmount, String> {
    let parts: Vec<&str> = s.split(':').collect();
    if parts.len() != 3 {
        return Err(format!("Invalid currency string '{}'. Expected format 'DIM: VALUE: PREdp'", s));
    }
    
    let dim = parts[0].trim().to_string();
    let val_str = parts[1].trim();
    let prec_str = parts[2].trim().trim_end_matches("dp").trim();
    
    let precision = prec_str.parse::<u8>()
        .map_err(|_| format!("Invalid precision in segment '{}'", parts[2]))?;
        
    let fd = FixedDecimal::from_str_with_precision(val_str, precision)
        .map_err(|e| e.to_string())?;
        
    Ok(DimensionedAmount::new(fd, dim))
}

pub fn format_ccy_string(d: &DimensionedAmount) -> String {
    format!("{}: {}: {}dp", d.dimension, d.value.to_string(), d.value.precision())
}

// Extract from Neons JsString
fn extract_ccy(cx: &mut FunctionContext, obj: Handle<JsString>) -> Result<DimensionedAmount, String> {
    parse_ccy_string(&obj.value(cx))
}

fn create_ccy_str<'a>(cx: &mut FunctionContext<'a>, item: &DimensionedAmount) -> JsResult<'a, JsString> {
    Ok(cx.string(format_ccy_string(item)))
}

fn create_ccy_array<'a>(cx: &mut FunctionContext<'a>, set: &DimensionSet) -> JsResult<'a, JsArray> {
    let output_array = cx.empty_array();
    for (idx, item) in set.unwrap_as_vec().iter().enumerate() {
        let s = create_ccy_str(cx, item)?;
        output_array.set(cx, idx as u32, s)?;
    }
    Ok(output_array)
}

// -------------------------------------------------------------
// Namespace: Ccy (Scalar Currency Math string-to-string)
// -------------------------------------------------------------

pub fn js_ccy_strict_add(mut cx: FunctionContext) -> JsResult<JsString> {
    let a_str = cx.argument::<JsString>(0)?;
    let b_str = cx.argument::<JsString>(1)?;
    
    let a = extract_ccy(&mut cx, a_str).or_else(|e| cx.throw_error(e))?;
    let b = extract_ccy(&mut cx, b_str).or_else(|e| cx.throw_error(e))?;
    
    match a.strict_add(&b) {
        Ok(result) => create_ccy_str(&mut cx, &result),
        Err(e) => cx.throw_error(e.to_string())
    }
}

pub fn js_ccy_strict_subtract(mut cx: FunctionContext) -> JsResult<JsString> {
    let a_str = cx.argument::<JsString>(0)?;
    let b_str = cx.argument::<JsString>(1)?;
    
    let a = extract_ccy(&mut cx, a_str).or_else(|e| cx.throw_error(e))?;
    let b = extract_ccy(&mut cx, b_str).or_else(|e| cx.throw_error(e))?;
    
    match a.strict_subtract(&b) {
        Ok(result) => create_ccy_str(&mut cx, &result),
        Err(e) => cx.throw_error(e.to_string())
    }
}

pub fn js_ccy_multiply(mut cx: FunctionContext) -> JsResult<JsString> {
    let a_str = cx.argument::<JsString>(0)?;
    let a = extract_ccy(&mut cx, a_str).or_else(|e| cx.throw_error(e))?;
    
    // Multiplier is dimensionless scalar e.g. "1.50"
    let m_str = cx.argument::<JsString>(1)?.value(&mut cx);
    let multiplier = crate::bridge::fp_str::parse_fp_string(&m_str).map_err(|e| cx.throw_error::<_, String>(e).unwrap_err())?;
        
    match a.multiply(&multiplier) {
        Ok(result) => create_ccy_str(&mut cx, &result),
        Err(e) => cx.throw_error(e.to_string())
    }
}

pub fn js_ccy_divide_into(mut cx: FunctionContext) -> JsResult<JsArray> {
    let a_str = cx.argument::<JsString>(0)?;
    let parts = cx.argument::<JsNumber>(1)?.value(&mut cx) as i64;
    let strategy_str = cx.argument::<JsString>(2)?.value(&mut cx);

    let a = extract_ccy(&mut cx, a_str).or_else(|e| cx.throw_error(e))?;
    
    let result_vec = match strategy_str.as_str() {
        "LoadFirst" => a.divide_into_load_first(parts),
        "LoadLast" => a.divide_into_load_last(parts),
        _ => return cx.throw_error("Use 'LoadFirst' or 'LoadLast'"),
    };

    match result_vec {
        Ok(vec_arr) => {
            let output = cx.empty_array();
            for (idx, item) in vec_arr.iter().enumerate() {
                let s = create_ccy_str(&mut cx, item)?;
                output.set(&mut cx, idx as u32, s)?;
            }
            Ok(output)
        },
        Err(e) => cx.throw_error(e.to_string())
    }
}

pub fn js_ccy_strict_sum_over(mut cx: FunctionContext) -> JsResult<JsString> {
    let items_arr = cx.argument::<JsArray>(0)?;
    let mut vec_items = Vec::new();
    for i in 0..items_arr.len(&mut cx) {
        let s = items_arr.get::<JsString, _, _>(&mut cx, i)?;
        let a = extract_ccy(&mut cx, s).or_else(|e| cx.throw_error(e))?;
        vec_items.push(a);
    }
    
    match DimensionedAmount::strict_sum_over(&vec_items) {
        Ok(result) => create_ccy_str(&mut cx, &result),
        Err(e) => cx.throw_error(e.to_string())
    }
}

pub fn js_ccy_strict_sum_over_products(mut cx: FunctionContext) -> JsResult<JsString> {
    let items_arr = cx.argument::<JsArray>(0)?;
    let mut vec_items = Vec::new();
    
    for i in 0..items_arr.len(&mut cx) {
        let pair_obj = items_arr.get::<JsObject, _, _>(&mut cx, i)?;
        let s = pair_obj.get::<JsString, _, _>(&mut cx, "amount")?; // e.g. "GBP: 100.00: 2dp"
        let m_str = pair_obj.get::<JsString, _, _>(&mut cx, "multiplier")?.value(&mut cx);
        let a = extract_ccy(&mut cx, s).or_else(|e| cx.throw_error(e))?;
        let m = crate::bridge::fp_str::parse_fp_string(&m_str).map_err(|e| cx.throw_error::<_, String>(e).unwrap_err())?;
        
        vec_items.push((a, m));
    }
    
    match DimensionedAmount::strict_sum_over_products(&vec_items) {
        Ok(result) => create_ccy_str(&mut cx, &result),
        Err(e) => cx.throw_error(e.to_string())
    }
}

// -------------------------------------------------------------
// Namespace: CcySet (Grouped Currency Math string-to-string)
// -------------------------------------------------------------

pub fn js_ccyset_strict_add(mut cx: FunctionContext) -> JsResult<JsArray> {
    let items_arr = cx.argument::<JsArray>(0)?;
    let add_str = cx.argument::<JsString>(1)?;
    
    let mut set = DimensionSet::new();
    for i in 0..items_arr.len(&mut cx) {
        let s = items_arr.get::<JsString, _, _>(&mut cx, i)?;
        let amount = extract_ccy(&mut cx, s).or_else(|e| cx.throw_error(e))?;
        set.add(&amount).or_else(|e| cx.throw_error(e.to_string()))?;
    }
    
    let amount = extract_ccy(&mut cx, add_str).or_else(|e| cx.throw_error(e))?;
    
    match set.add(&amount) {
        Ok(_) => create_ccy_array(&mut cx, &set),
        Err(e) => cx.throw_error(e.to_string())
    }
}

pub fn js_ccyset_divide_into(mut cx: FunctionContext) -> JsResult<JsArray> {
    let items_arr = cx.argument::<JsArray>(0)?;
    let parts = cx.argument::<JsNumber>(1)?.value(&mut cx) as i64;
    let strategy_str = cx.argument::<JsString>(2)?.value(&mut cx);

    let mut set = DimensionSet::new();
    for i in 0..items_arr.len(&mut cx) {
        let s = items_arr.get::<JsString, _, _>(&mut cx, i)?;
        let amount = extract_ccy(&mut cx, s).or_else(|e| cx.throw_error(e))?;
        set.add(&amount).or_else(|e| cx.throw_error(e.to_string()))?;
    }
    
    let sets_result = match strategy_str.as_str() {
        "LoadFirst" => set.divide_into_load_first(parts),
        "LoadLast" => set.divide_into_load_last(parts),
        _ => return cx.throw_error("Use 'LoadFirst' or 'LoadLast'"),
    };

    match sets_result {
        Ok(vec_of_sets) => {
            let root_array = cx.empty_array();
            for (i, b) in vec_of_sets.iter().enumerate() {
                let set_arr = create_ccy_array(&mut cx, b)?;
                root_array.set(&mut cx, i as u32, set_arr)?;
            }
            Ok(root_array)
        },
        Err(e) => cx.throw_error(e.to_string())
    }
}

pub fn js_ccyset_strict_sum_over(mut cx: FunctionContext) -> JsResult<JsArray> {
    let items_arr = cx.argument::<JsArray>(0)?;
    
    let mut vec_items = Vec::new();
    for i in 0..items_arr.len(&mut cx) {
        let set_arr = items_arr.get::<JsArray, _, _>(&mut cx, i)?;
        let mut set = DimensionSet::new();
        for j in 0..set_arr.len(&mut cx) {
            let s = set_arr.get::<JsString, _, _>(&mut cx, j)?;
            let a = extract_ccy(&mut cx, s).or_else(|e| cx.throw_error(e))?;
            set.add(&a).or_else(|e| cx.throw_error(e.to_string()))?;
        }
        vec_items.push(set);
    }
    
    match DimensionSet::sum_over(&vec_items) {
        Ok(result) => create_ccy_array(&mut cx, &result),
        Err(e) => cx.throw_error(e.to_string())
    }
}

// --- Added CCY and CCYSET operations ---

pub fn js_ccy_divide_rounded(mut cx: FunctionContext) -> JsResult<JsString> {
    let a_str = cx.argument::<JsString>(0)?;
    let a = extract_ccy(&mut cx, a_str).or_else(|e| cx.throw_error(e))?;
    
    let d_str = cx.argument::<JsString>(1)?.value(&mut cx);
    let strategy_str = cx.argument::<JsString>(2)?.value(&mut cx);
    let divisor = crate::bridge::fp_str::parse_fp_string(&d_str).map_err(|e| cx.throw_error::<_, String>(e).unwrap_err())?;
        
    let strategy = crate::strategies::RoundingStrategy::parse_strategy_name(&strategy_str)
        .unwrap_or(crate::strategies::RoundingStrategy::Down);
        
    match a.divide_rounded(&divisor, strategy) {
        Ok(result) => create_ccy_str(&mut cx, &result),
        Err(e) => cx.throw_error(e.to_string())
    }
}

pub fn js_ccy_percentage_of_rounded(mut cx: FunctionContext) -> JsResult<JsString> {
    let a_str = cx.argument::<JsString>(0)?;
    let a = extract_ccy(&mut cx, a_str).or_else(|e| cx.throw_error(e))?;
    
    let p_str = cx.argument::<JsString>(1)?.value(&mut cx);
    let strategy_str = cx.argument::<JsString>(2)?.value(&mut cx);
    let percentage = crate::bridge::fp_str::parse_fp_string(&p_str).map_err(|e| cx.throw_error::<_, String>(e).unwrap_err())?;
        
    let strategy = crate::strategies::RoundingStrategy::parse_strategy_name(&strategy_str)
        .unwrap_or(crate::strategies::RoundingStrategy::Down);
        
    match a.percentage_of_rounded(&percentage, strategy) {
        Ok(result) => create_ccy_str(&mut cx, &result),
        Err(e) => cx.throw_error(e.to_string())
    }
}

pub fn js_ccyset_strict_subtract(mut cx: FunctionContext) -> JsResult<JsArray> {
    let items_arr = cx.argument::<JsArray>(0)?;
    let sub_str = cx.argument::<JsString>(1)?;
    
    let mut set = DimensionSet::new();
    for i in 0..items_arr.len(&mut cx) {
        let s = items_arr.get::<JsString, _, _>(&mut cx, i)?;
        let amount = extract_ccy(&mut cx, s).or_else(|e| cx.throw_error(e))?;
        set.add(&amount).or_else(|e| cx.throw_error(e.to_string()))?;
    }
    
    let amount = extract_ccy(&mut cx, sub_str).or_else(|e| cx.throw_error(e))?;
    
    match set.subtract(&amount) {
        Ok(_) => create_ccy_array(&mut cx, &set),
        Err(e) => cx.throw_error(e.to_string())
    }
}

pub fn js_ccyset_multiply(mut cx: FunctionContext) -> JsResult<JsArray> {
    let items_arr = cx.argument::<JsArray>(0)?;
    let m_obj = cx.argument::<JsObject>(1)?;
    
    let mut set = DimensionSet::new();
    for i in 0..items_arr.len(&mut cx) {
        let s = items_arr.get::<JsString, _, _>(&mut cx, i)?;
        let amount = extract_ccy(&mut cx, s).or_else(|e| cx.throw_error(e))?;
        set.add(&amount).or_else(|e| cx.throw_error(e.to_string()))?;
    }
    
    let val_str = m_obj.get::<JsString, _, _>(&mut cx, "value")?.value(&mut cx);
    let precision = m_obj.get::<JsNumber, _, _>(&mut cx, "precision")?.value(&mut cx) as u8;
    let multiplier = FixedDecimal::from_str_with_precision(&val_str, precision)
        .or_else(|e| cx.throw_error(e.to_string()))?;
        
    match set.multiply(&multiplier) {
        Ok(result) => create_ccy_array(&mut cx, &result),
        Err(e) => cx.throw_error(e.to_string())
    }
}

pub fn js_ccyset_divide_rounded(mut cx: FunctionContext) -> JsResult<JsArray> {
    let items_arr = cx.argument::<JsArray>(0)?;
    let d_str = cx.argument::<JsString>(1)?.value(&mut cx);
    let strategy_str = cx.argument::<JsString>(2)?.value(&mut cx);
    
    let mut set = DimensionSet::new();
    for i in 0..items_arr.len(&mut cx) {
        let s = items_arr.get::<JsString, _, _>(&mut cx, i)?;
        let amount = extract_ccy(&mut cx, s).or_else(|e| cx.throw_error(e))?;
        set.add(&amount).or_else(|e| cx.throw_error(e.to_string()))?;
    }
    
    let divisor = crate::bridge::fp_str::parse_fp_string(&d_str).map_err(|e| cx.throw_error::<_, String>(e).unwrap_err())?;
        
    let strategy = crate::strategies::RoundingStrategy::parse_strategy_name(&strategy_str)
        .unwrap_or(crate::strategies::RoundingStrategy::Down);
        
    match set.divide_rounded(&divisor, strategy) {
        Ok(result) => create_ccy_array(&mut cx, &result),
        Err(e) => cx.throw_error(e.to_string())
    }
}

pub fn js_ccyset_percentage_of_rounded(mut cx: FunctionContext) -> JsResult<JsArray> {
    let items_arr = cx.argument::<JsArray>(0)?;
    let p_str = cx.argument::<JsString>(1)?.value(&mut cx);
    let strategy_str = cx.argument::<JsString>(2)?.value(&mut cx);
    
    let mut set = DimensionSet::new();
    for i in 0..items_arr.len(&mut cx) {
        let s = items_arr.get::<JsString, _, _>(&mut cx, i)?;
        let amount = extract_ccy(&mut cx, s).or_else(|e| cx.throw_error(e))?;
        set.add(&amount).or_else(|e| cx.throw_error(e.to_string()))?;
    }
    
    let percentage = crate::bridge::fp_str::parse_fp_string(&p_str).map_err(|e| cx.throw_error::<_, String>(e).unwrap_err())?;
        
    let strategy = crate::strategies::RoundingStrategy::parse_strategy_name(&strategy_str)
        .unwrap_or(crate::strategies::RoundingStrategy::Down);
        
    match set.percentage_of_rounded(&percentage, strategy) {
        Ok(result) => create_ccy_array(&mut cx, &result),
        Err(e) => cx.throw_error(e.to_string())
    }
}

pub fn js_ccyset_strict_sum_over_products(mut cx: FunctionContext) -> JsResult<JsArray> {
    let items_arr = cx.argument::<JsArray>(0)?;
    let mut vec_items = Vec::new();
    
    for i in 0..items_arr.len(&mut cx) {
        let pair_obj = items_arr.get::<JsObject, _, _>(&mut cx, i)?;
        let s = pair_obj.get::<JsString, _, _>(&mut cx, "amount")?;
        let m_str = pair_obj.get::<JsString, _, _>(&mut cx, "multiplier")?.value(&mut cx);
        let a = extract_ccy(&mut cx, s).or_else(|e| cx.throw_error(e))?;
        let m = crate::bridge::fp_str::parse_fp_string(&m_str).map_err(|e| cx.throw_error::<_, String>(e).unwrap_err())?;
            
        vec_items.push((a, m));
    }
    
    match DimensionSet::sum_over_products(&vec_items) {
        Ok(result) => create_ccy_array(&mut cx, &result),
        Err(e) => cx.throw_error(e.to_string())
    }
}
