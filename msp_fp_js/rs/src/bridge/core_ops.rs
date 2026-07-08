use neon::prelude::*;
use crate::core::decimal::FixedDecimal;

fn create_decimal_obj<'a>(cx: &mut FunctionContext<'a>, decimal: &FixedDecimal) -> JsResult<'a, JsObject> {
    let obj = cx.empty_object();
    
    let value = cx.string(decimal.to_string());
    obj.set(cx, "value", value)?;
    
    let precision = cx.number(decimal.precision() as f64);
    obj.set(cx, "precision", precision)?;
    
    Ok(obj)
}

pub fn js_add(mut cx: FunctionContext) -> JsResult<JsObject> {
    let a_obj = cx.argument::<JsObject>(0)?;
    let b_obj = cx.argument::<JsObject>(1)?;
    
    let a_val = a_obj.get::<JsString, _, _>(&mut cx, "value")?.value(&mut cx);
    let a_prec = a_obj.get::<JsNumber, _, _>(&mut cx, "precision")?.value(&mut cx) as u8;
    
    let b_val = b_obj.get::<JsString, _, _>(&mut cx, "value")?.value(&mut cx);
    let b_prec = b_obj.get::<JsNumber, _, _>(&mut cx, "precision")?.value(&mut cx) as u8;
    
    let a = FixedDecimal::from_str_with_precision(&a_val, a_prec)
        .or_else(|e| cx.throw_error(e.to_string()))?;
        
    let b = FixedDecimal::from_str_with_precision(&b_val, b_prec)
        .or_else(|e| cx.throw_error(e.to_string()))?;
    
    match a.add(&b) {
        Ok(result) => create_decimal_obj(&mut cx, &result),
        Err(e) => cx.throw_error(e.to_string())
    }
}

pub fn js_subtract(mut cx: FunctionContext) -> JsResult<JsObject> {
    let a_obj = cx.argument::<JsObject>(0)?;
    let b_obj = cx.argument::<JsObject>(1)?;
    
    let a_val = a_obj.get::<JsString, _, _>(&mut cx, "value")?.value(&mut cx);
    let a_prec = a_obj.get::<JsNumber, _, _>(&mut cx, "precision")?.value(&mut cx) as u8;
    
    let b_val = b_obj.get::<JsString, _, _>(&mut cx, "value")?.value(&mut cx);
    let b_prec = b_obj.get::<JsNumber, _, _>(&mut cx, "precision")?.value(&mut cx) as u8;
    
    let a = FixedDecimal::from_str_with_precision(&a_val, a_prec)
        .or_else(|e| cx.throw_error(e.to_string()))?;
        
    let b = FixedDecimal::from_str_with_precision(&b_val, b_prec)
        .or_else(|e| cx.throw_error(e.to_string()))?;
    
    match a.subtract(&b) {
        Ok(result) => create_decimal_obj(&mut cx, &result),
        Err(e) => cx.throw_error(e.to_string())
    }
}

pub fn js_multiply(mut cx: FunctionContext) -> JsResult<JsObject> {
    let a_obj = cx.argument::<JsObject>(0)?;
    let b_obj = cx.argument::<JsObject>(1)?;
    
    let a_val = a_obj.get::<JsString, _, _>(&mut cx, "value")?.value(&mut cx);
    let a_prec = a_obj.get::<JsNumber, _, _>(&mut cx, "precision")?.value(&mut cx) as u8;
    
    let b_val = b_obj.get::<JsString, _, _>(&mut cx, "value")?.value(&mut cx);
    let b_prec = b_obj.get::<JsNumber, _, _>(&mut cx, "precision")?.value(&mut cx) as u8;
    
    let a = FixedDecimal::from_str_with_precision(&a_val, a_prec)
        .or_else(|e| cx.throw_error(e.to_string()))?;
        
    let b = FixedDecimal::from_str_with_precision(&b_val, b_prec)
        .or_else(|e| cx.throw_error(e.to_string()))?;
    
    match a.multiply(&b) {
        Ok(result) => create_decimal_obj(&mut cx, &result),
        Err(e) => cx.throw_error(e.to_string())
    }
}

pub fn js_divide(mut cx: FunctionContext) -> JsResult<JsObject> {
    let a_obj = cx.argument::<JsObject>(0)?;
    let b_obj = cx.argument::<JsObject>(1)?;
    
    let a_val = a_obj.get::<JsString, _, _>(&mut cx, "value")?.value(&mut cx);
    let a_prec = a_obj.get::<JsNumber, _, _>(&mut cx, "precision")?.value(&mut cx) as u8;
    
    let b_val = b_obj.get::<JsString, _, _>(&mut cx, "value")?.value(&mut cx);
    let b_prec = b_obj.get::<JsNumber, _, _>(&mut cx, "precision")?.value(&mut cx) as u8;
    
    let a = FixedDecimal::from_str_with_precision(&a_val, a_prec)
        .or_else(|e| cx.throw_error(e.to_string()))?;
        
    let b = FixedDecimal::from_str_with_precision(&b_val, b_prec)
        .or_else(|e| cx.throw_error(e.to_string()))?;
        
    // precision argument is not needed for native divide in the current interface
    
    match a.divide(&b) {
        Ok(result) => create_decimal_obj(&mut cx, &result),
        Err(e) => cx.throw_error(e.to_string())
    }
}

pub fn js_divide_into(mut cx: FunctionContext) -> JsResult<JsArray> {
    let dec_obj = cx.argument::<JsObject>(0)?;
    let parts_num = cx.argument::<JsNumber>(1)?.value(&mut cx) as u32;
    let strategy_str = cx.argument::<JsString>(2)?.value(&mut cx);
    
    let val = dec_obj.get::<JsString, _, _>(&mut cx, "value")?.value(&mut cx);
    let prec = dec_obj.get::<JsNumber, _, _>(&mut cx, "precision")?.value(&mut cx) as u8;
    
    let decimal = FixedDecimal::from_str_with_precision(&val, prec)
        .or_else(|e| cx.throw_error(e.to_string()))?;
        
    use crate::strategies::DivisionStrategySet;
    use crate::strategies::RoundingStrategy;
    use crate::strategies::RemainderStrategy;
    
    // Convert simplistic "AddToFirst" / "AddToLast" strings to complete strategy set
    let strategy_set = match strategy_str.as_str() {
        "AddToFirst" => DivisionStrategySet {
            rounding: RoundingStrategy::Down,
            remainder: RemainderStrategy::AddToFirst,
        },
        "AddToLast" => DivisionStrategySet {
            rounding: RoundingStrategy::Down,
            remainder: RemainderStrategy::AddToLast,
        },
        _ => return cx.throw_error("Unknown division strategy"),
    };
    
    match decimal.divide_into(parts_num.into(), strategy_set) {
        Ok(results) => {
            // results is a tuple: (Vec<FixedDecimal>, Option<FixedDecimal>)
            let arr = results.0; 
            let array = cx.empty_array();
            
            for (i, d) in arr.iter().enumerate() {
                let obj = create_decimal_obj(&mut cx, d)?;
                array.set(&mut cx, i as u32, obj)?;
            }
            
            Ok(array)
        },
        Err(e) => cx.throw_error(e.to_string())
    }
}
