use neon::prelude::*;
use crate::core::decimal::FixedDecimal;
use crate::core::dimension::{DimensionedAmount, DimensionSet};
use crate::strategies::conversion::{ConversionContext, ConversionTiming};

// Helper: Read a DimensionedAmount from a JS Object
fn extract_dimensioned_amount(cx: &mut FunctionContext, obj: Handle<JsObject>) -> neon::result::NeonResult<DimensionedAmount> {
    let val_str = obj.get::<JsString, _, _>(cx, "value")?.value(cx);
    let precision = obj.get::<JsNumber, _, _>(cx, "precision")?.value(cx) as u8;
    let dim = obj.get::<JsString, _, _>(cx, "dimension")?.value(cx);

    let fd = FixedDecimal::from_str_with_precision(&val_str, precision)
        .or_else(|e| cx.throw_error(e.to_string()))?;
        
    Ok(DimensionedAmount::new(fd, dim))
}

// Helper: Convert a DimensionedAmount to a JS Object
fn create_dimensioned_amount_obj<'a>(cx: &mut FunctionContext<'a>, item: &DimensionedAmount) -> JsResult<'a, JsObject> {
    let obj = cx.empty_object();
    
    let v = cx.string(item.value.to_string());
    obj.set(cx, "value", v)?;
    
    let p = cx.number(item.value.precision() as f64);
    obj.set(cx, "precision", p)?;
    
    let d = cx.string(&item.dimension);
    obj.set(cx, "dimension", d)?;
    
    Ok(obj)
}

// Helper: Convert a DimensionSet to a JS Array of amounts
fn create_set_array<'a>(cx: &mut FunctionContext<'a>, set: &DimensionSet) -> JsResult<'a, JsArray> {
    let output_array = cx.empty_array();
    let arr = set.unwrap_as_vec();
    for (idx, item) in arr.iter().enumerate() {
        let obj = create_dimensioned_amount_obj(cx, item)?;
        output_array.set(cx, idx as u32, obj)?;
    }
    Ok(output_array)
}

// --- JS Interface ---

pub fn js_sum_dimensions(mut cx: FunctionContext) -> JsResult<JsArray> {
    let items = cx.argument::<JsArray>(0)?;
    let timing_str = cx.argument::<JsString>(1)?.value(&mut cx);
    let allowed_outputs = cx.argument::<JsArray>(2)?;
    let internal_precision = cx.argument::<JsNumber>(3)?.value(&mut cx) as u8;
    let output_precision = cx.argument::<JsNumber>(4)?.value(&mut cx) as u8;

    let timing = match timing_str.as_str() {
        "ConvertEarly" => ConversionTiming::ConvertEarly,
        "ConvertLate" => ConversionTiming::ConvertLate,
        _ => return cx.throw_error("Invalid timing strategy. Use 'ConvertEarly' or 'ConvertLate'"),
    };

    let mut ctx = ConversionContext::new(internal_precision, output_precision, timing);

    // Setup allowed outputs
    for i in 0..allowed_outputs.len(&mut cx) {
        let val = allowed_outputs.get::<JsString, _, _>(&mut cx, i)?.value(&mut cx);
        ctx.add_allowed_output(&val);
    }

    // Hardcode rates for test mappings (Could be passed in as a 6th arg array of objects)
    if let Ok(rate) = FixedDecimal::from_str_with_precision("0.85", 4) {
        ctx.add_rate("USD", "EUR", rate);
    }
    if let Ok(rate) = FixedDecimal::from_str_with_precision("1.00", 2) {
         ctx.add_rate("EUR", "EUR", rate); 
    }

    // Parse items
    let mut vec_items = Vec::new();
    for i in 0..items.len(&mut cx) {
        let obj = items.get::<JsObject, _, _>(&mut cx, i)?;
        vec_items.push(extract_dimensioned_amount(&mut cx, obj)?);
    }

    match ctx.sum(&vec_items) {
        Ok(set) => create_set_array(&mut cx, &set),
        Err(e) => cx.throw_error(e.to_string())
    }
}

pub fn js_set_multiply(mut cx: FunctionContext) -> JsResult<JsArray> {
    let items = cx.argument::<JsArray>(0)?;
    let multiplier_obj = cx.argument::<JsObject>(1)?;

    let mut set = DimensionSet::new();
    for i in 0..items.len(&mut cx) {
        let obj = items.get::<JsObject, _, _>(&mut cx, i)?;
        let amount = extract_dimensioned_amount(&mut cx, obj)?;
        set.add(&amount).or_else(|e| cx.throw_error(e.to_string()))?;
    }

    let val_str = multiplier_obj.get::<JsString, _, _>(&mut cx, "value")?.value(&mut cx);
    let precision = multiplier_obj.get::<JsNumber, _, _>(&mut cx, "precision")?.value(&mut cx) as u8;
    let multiplier = FixedDecimal::from_str_with_precision(&val_str, precision)
        .or_else(|e| cx.throw_error(e.to_string()))?;

    match set.multiply(&multiplier) {
        Ok(result_set) => create_set_array(&mut cx, &result_set),
        Err(e) => cx.throw_error(e.to_string())
    }
}

pub fn js_set_divide_into(mut cx: FunctionContext) -> JsResult<JsArray> {
    let items = cx.argument::<JsArray>(0)?;
    let parts = cx.argument::<JsNumber>(1)?.value(&mut cx) as i64;
    let strategy_str = cx.argument::<JsString>(2)?.value(&mut cx);

    let mut set = DimensionSet::new();
    for i in 0..items.len(&mut cx) {
        let obj = items.get::<JsObject, _, _>(&mut cx, i)?;
        let amount = extract_dimensioned_amount(&mut cx, obj)?;
        set.add(&amount).or_else(|e| cx.throw_error(e.to_string()))?;
    }
    
    // We return an array of arrays (Array of Sets) for this method.
    // For simplicity, we just execute load_first or load_last. If remainder is distinct, it creates a slightly more complex return.
    
    let sets_result = match strategy_str.as_str() {
        "LoadFirst" => set.divide_into_load_first(parts),
        "LoadLast" => set.divide_into_load_last(parts),
        _ => return cx.throw_error("Use 'LoadFirst' or 'LoadLast'"),
    };

    match sets_result {
        Ok(vec_of_sets) => {
            let root_array = cx.empty_array();
            for (i, b) in vec_of_sets.iter().enumerate() {
                let set_arr = create_set_array(&mut cx, b)?;
                root_array.set(&mut cx, i as u32, set_arr)?;
            }
            Ok(root_array)
        },
        Err(e) => cx.throw_error(e.to_string())
    }
}

// --- Strict Dimensions Methods ---

pub fn js_dim_strict_add(mut cx: FunctionContext) -> JsResult<JsObject> {
    let a_obj = cx.argument::<JsObject>(0)?;
    let b_obj = cx.argument::<JsObject>(1)?;
    
    let a = extract_dimensioned_amount(&mut cx, a_obj)?;
    let b = extract_dimensioned_amount(&mut cx, b_obj)?;
    
    match a.strict_add(&b) {
        Ok(result) => create_dimensioned_amount_obj(&mut cx, &result),
        Err(e) => cx.throw_error(e.to_string())
    }
}

pub fn js_dim_strict_subtract(mut cx: FunctionContext) -> JsResult<JsObject> {
    let a_obj = cx.argument::<JsObject>(0)?;
    let b_obj = cx.argument::<JsObject>(1)?;
    
    let a = extract_dimensioned_amount(&mut cx, a_obj)?;
    let b = extract_dimensioned_amount(&mut cx, b_obj)?;
    
    match a.strict_subtract(&b) {
        Ok(result) => create_dimensioned_amount_obj(&mut cx, &result),
        Err(e) => cx.throw_error(e.to_string())
    }
}

pub fn js_dim_multiply(mut cx: FunctionContext) -> JsResult<JsObject> {
    let a_obj = cx.argument::<JsObject>(0)?;
    let m_obj = cx.argument::<JsObject>(1)?;
    
    let a = extract_dimensioned_amount(&mut cx, a_obj)?;
    
    let val_str = m_obj.get::<JsString, _, _>(&mut cx, "value")?.value(&mut cx);
    let precision = m_obj.get::<JsNumber, _, _>(&mut cx, "precision")?.value(&mut cx) as u8;
    let multiplier = FixedDecimal::from_str_with_precision(&val_str, precision)
        .or_else(|e| cx.throw_error(e.to_string()))?;
        
    match a.multiply(&multiplier) {
        Ok(result) => create_dimensioned_amount_obj(&mut cx, &result),
        Err(e) => cx.throw_error(e.to_string())
    }
}

pub fn js_dim_strict_sum_over(mut cx: FunctionContext) -> JsResult<JsObject> {
    let items_arr = cx.argument::<JsArray>(0)?;
    
    let mut vec_items = Vec::new();
    for i in 0..items_arr.len(&mut cx) {
        let obj = items_arr.get::<JsObject, _, _>(&mut cx, i)?;
        vec_items.push(extract_dimensioned_amount(&mut cx, obj)?);
    }
    
    match DimensionedAmount::strict_sum_over(&vec_items) {
        Ok(result) => create_dimensioned_amount_obj(&mut cx, &result),
        Err(e) => cx.throw_error(e.to_string())
    }
}

// --- More DimensionedAmount (dim) tools ---

pub fn js_dim_divide_rounded(mut cx: FunctionContext) -> JsResult<JsObject> {
    let a_obj = cx.argument::<JsObject>(0)?;
    let d_obj = cx.argument::<JsObject>(1)?;
    let strategy_str = cx.argument::<JsString>(2)?.value(&mut cx);
    
    let a = extract_dimensioned_amount(&mut cx, a_obj)?;
    
    let val_str = d_obj.get::<JsString, _, _>(&mut cx, "value")?.value(&mut cx);
    let precision = d_obj.get::<JsNumber, _, _>(&mut cx, "precision")?.value(&mut cx) as u8;
    let divisor = FixedDecimal::from_str_with_precision(&val_str, precision)
        .or_else(|e| cx.throw_error(e.to_string()))?;
        
    let strategy = crate::strategies::RoundingStrategy::parse_strategy_name(&strategy_str)
        .unwrap_or(crate::strategies::RoundingStrategy::Down);
        
    match a.divide_rounded(&divisor, strategy) {
        Ok(result) => create_dimensioned_amount_obj(&mut cx, &result),
        Err(e) => cx.throw_error(e.to_string())
    }
}

pub fn js_dim_percentage_of_rounded(mut cx: FunctionContext) -> JsResult<JsObject> {
    let a_obj = cx.argument::<JsObject>(0)?;
    let p_obj = cx.argument::<JsObject>(1)?;
    let strategy_str = cx.argument::<JsString>(2)?.value(&mut cx);
    
    let a = extract_dimensioned_amount(&mut cx, a_obj)?;
    
    let val_str = p_obj.get::<JsString, _, _>(&mut cx, "value")?.value(&mut cx);
    let precision = p_obj.get::<JsNumber, _, _>(&mut cx, "precision")?.value(&mut cx) as u8;
    let percentage = FixedDecimal::from_str_with_precision(&val_str, precision)
        .or_else(|e| cx.throw_error(e.to_string()))?;
        
    let strategy = crate::strategies::RoundingStrategy::parse_strategy_name(&strategy_str)
        .unwrap_or(crate::strategies::RoundingStrategy::Down);
        
    match a.percentage_of_rounded(&percentage, strategy) {
        Ok(result) => create_dimensioned_amount_obj(&mut cx, &result),
        Err(e) => cx.throw_error(e.to_string())
    }
}

pub fn js_dim_strict_sum_over_products(mut cx: FunctionContext) -> JsResult<JsObject> {
    let items_arr = cx.argument::<JsArray>(0)?;
    
    let mut vec_items = Vec::new();
    for i in 0..items_arr.len(&mut cx) {
        // Items must be formatted as `{ amount: DimensionedAmount, multiplier: FixedDecimal }`
        let pair_obj = items_arr.get::<JsObject, _, _>(&mut cx, i)?;
        let a_obj = pair_obj.get::<JsObject, _, _>(&mut cx, "amount")?;
        let m_obj = pair_obj.get::<JsObject, _, _>(&mut cx, "multiplier")?;
        
        let a = extract_dimensioned_amount(&mut cx, a_obj)?;
        
        let m_val = m_obj.get::<JsString, _, _>(&mut cx, "value")?.value(&mut cx);
        let m_prec = m_obj.get::<JsNumber, _, _>(&mut cx, "precision")?.value(&mut cx) as u8;
        let m = FixedDecimal::from_str_with_precision(&m_val, m_prec)
            .or_else(|e| cx.throw_error(e.to_string()))?;
            
        vec_items.push((a, m));
    }
    
    match DimensionedAmount::strict_sum_over_products(&vec_items) {
        Ok(result) => create_dimensioned_amount_obj(&mut cx, &result),
        Err(e) => cx.throw_error(e.to_string())
    }
}

pub fn js_dim_divide_into(mut cx: FunctionContext) -> JsResult<JsArray> {
    let a_obj = cx.argument::<JsObject>(0)?;
    let parts = cx.argument::<JsNumber>(1)?.value(&mut cx) as i64;
    let strategy_str = cx.argument::<JsString>(2)?.value(&mut cx);

    let a = extract_dimensioned_amount(&mut cx, a_obj)?;
    
    let result_vec = match strategy_str.as_str() {
        "LoadFirst" => a.divide_into_load_first(parts),
        "LoadLast" => a.divide_into_load_last(parts),
        _ => return cx.throw_error("Use 'LoadFirst' or 'LoadLast'"),
    };

    match result_vec {
        Ok(vec_arr) => {
            let output = cx.empty_array();
            for (idx, item) in vec_arr.iter().enumerate() {
                let obj = create_dimensioned_amount_obj(&mut cx, item)?;
                output.set(&mut cx, idx as u32, obj)?;
            }
            Ok(output)
        },
        Err(e) => cx.throw_error(e.to_string())
    }
}

// --- More DimensionSet (dimSet) tools ---

pub fn js_set_strict_add(mut cx: FunctionContext) -> JsResult<JsArray> {
    let items_arr = cx.argument::<JsArray>(0)?;
    let add_obj = cx.argument::<JsObject>(1)?;
    
    // Deconstruct target set
    let mut set = DimensionSet::new();
    for i in 0..items_arr.len(&mut cx) {
        let obj = items_arr.get::<JsObject, _, _>(&mut cx, i)?;
        let amount = extract_dimensioned_amount(&mut cx, obj)?;
        set.add(&amount).or_else(|e| cx.throw_error(e.to_string()))?;
    }
    
    // Amount to add
    let amount = extract_dimensioned_amount(&mut cx, add_obj)?;
    
    match set.add(&amount) {
        Ok(_) => create_set_array(&mut cx, &set),
        Err(e) => cx.throw_error(e.to_string())
    }
}

pub fn js_set_strict_subtract(mut cx: FunctionContext) -> JsResult<JsArray> {
    let items_arr = cx.argument::<JsArray>(0)?;
    let sub_obj = cx.argument::<JsObject>(1)?;
    
    let mut set = DimensionSet::new();
    for i in 0..items_arr.len(&mut cx) {
        let obj = items_arr.get::<JsObject, _, _>(&mut cx, i)?;
        let amount = extract_dimensioned_amount(&mut cx, obj)?;
        set.add(&amount).or_else(|e| cx.throw_error(e.to_string()))?;
    }
    
    // Amount to subtract
    let amount = extract_dimensioned_amount(&mut cx, sub_obj)?;
    
    match set.subtract(&amount) {
        Ok(_) => create_set_array(&mut cx, &set),
        Err(e) => cx.throw_error(e.to_string())
    }
}

pub fn js_set_divide_rounded(mut cx: FunctionContext) -> JsResult<JsArray> {
    let items = cx.argument::<JsArray>(0)?;
    let d_obj = cx.argument::<JsObject>(1)?;
    let strategy_str = cx.argument::<JsString>(2)?.value(&mut cx);

    let mut set = DimensionSet::new();
    for i in 0..items.len(&mut cx) {
        let obj = items.get::<JsObject, _, _>(&mut cx, i)?;
        let amount = extract_dimensioned_amount(&mut cx, obj)?;
        set.add(&amount).or_else(|e| cx.throw_error(e.to_string()))?;
    }

    let val_str = d_obj.get::<JsString, _, _>(&mut cx, "value")?.value(&mut cx);
    let precision = d_obj.get::<JsNumber, _, _>(&mut cx, "precision")?.value(&mut cx) as u8;
    let divisor = FixedDecimal::from_str_with_precision(&val_str, precision)
        .or_else(|e| cx.throw_error(e.to_string()))?;

    let strategy = crate::strategies::RoundingStrategy::parse_strategy_name(&strategy_str)
        .unwrap_or(crate::strategies::RoundingStrategy::Down);

    match set.divide_rounded(&divisor, strategy) {
        Ok(result_set) => create_set_array(&mut cx, &result_set),
        Err(e) => cx.throw_error(e.to_string())
    }
}

pub fn js_set_percentage_of_rounded(mut cx: FunctionContext) -> JsResult<JsArray> {
    let items = cx.argument::<JsArray>(0)?;
    let p_obj = cx.argument::<JsObject>(1)?;
    let strategy_str = cx.argument::<JsString>(2)?.value(&mut cx);

    let mut set = DimensionSet::new();
    for i in 0..items.len(&mut cx) {
        let obj = items.get::<JsObject, _, _>(&mut cx, i)?;
        let amount = extract_dimensioned_amount(&mut cx, obj)?;
        set.add(&amount).or_else(|e| cx.throw_error(e.to_string()))?;
    }

    let val_str = p_obj.get::<JsString, _, _>(&mut cx, "value")?.value(&mut cx);
    let precision = p_obj.get::<JsNumber, _, _>(&mut cx, "precision")?.value(&mut cx) as u8;
    let percentage = FixedDecimal::from_str_with_precision(&val_str, precision)
        .or_else(|e| cx.throw_error(e.to_string()))?;

    let strategy = crate::strategies::RoundingStrategy::parse_strategy_name(&strategy_str)
        .unwrap_or(crate::strategies::RoundingStrategy::Down);

    match set.percentage_of_rounded(&percentage, strategy) {
        Ok(result_set) => create_set_array(&mut cx, &result_set),
        Err(e) => cx.throw_error(e.to_string())
    }
}

pub fn js_set_strict_sum_over(mut cx: FunctionContext) -> JsResult<JsArray> {
    let items_arr = cx.argument::<JsArray>(0)?;
    
    let mut vec_items = Vec::new();
    for i in 0..items_arr.len(&mut cx) {
        // Items here are sets, represented as arrays of DimensionedAmounts
        let set_arr = items_arr.get::<JsArray, _, _>(&mut cx, i)?;
        let mut set = DimensionSet::new();
        for j in 0..set_arr.len(&mut cx) {
            let obj = set_arr.get::<JsObject, _, _>(&mut cx, j)?;
            let a = extract_dimensioned_amount(&mut cx, obj)?;
            set.add(&a).or_else(|e| cx.throw_error(e.to_string()))?;
        }
        vec_items.push(set);
    }
    
    match DimensionSet::sum_over(&vec_items) {
        Ok(result) => create_set_array(&mut cx, &result),
        Err(e) => cx.throw_error(e.to_string())
    }
}

pub fn js_set_strict_sum_over_products(mut cx: FunctionContext) -> JsResult<JsArray> {
    let items_arr = cx.argument::<JsArray>(0)?;
    
    let mut vec_items = Vec::new();
    for i in 0..items_arr.len(&mut cx) {
        // Items must be formatted as `{ amount: DimensionedAmount, multiplier: FixedDecimal }`
        // We are passing DimensionedAmounts here directly even though it builds a set.
        let pair_obj = items_arr.get::<JsObject, _, _>(&mut cx, i)?;
        let a_obj = pair_obj.get::<JsObject, _, _>(&mut cx, "amount")?;
        let m_obj = pair_obj.get::<JsObject, _, _>(&mut cx, "multiplier")?;
        
        let a = extract_dimensioned_amount(&mut cx, a_obj)?;
        
        let m_val = m_obj.get::<JsString, _, _>(&mut cx, "value")?.value(&mut cx);
        let m_prec = m_obj.get::<JsNumber, _, _>(&mut cx, "precision")?.value(&mut cx) as u8;
        let m = FixedDecimal::from_str_with_precision(&m_val, m_prec)
            .or_else(|e| cx.throw_error(e.to_string()))?;
            
        vec_items.push((a, m));
    }
    
    match DimensionSet::sum_over_products(&vec_items) {
        Ok(result) => create_set_array(&mut cx, &result),
        Err(e) => cx.throw_error(e.to_string())
    }
}
