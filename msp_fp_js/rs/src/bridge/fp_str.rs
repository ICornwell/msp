use neon::prelude::*;
use crate::core::decimal::FixedDecimal;

// --- JS String Format Helpers ---
// Parses a string like "100.00: 2dp" into a FixedDecimal natively on the bridge
pub fn parse_fp_string(s: &str) -> Result<FixedDecimal, String> {
    let parts: Vec<&str> = s.split(':').collect();
    if parts.len() != 2 {
        return Err(format!("Invalid fixed-precision string '{}'. Expected format 'VALUE: PREdp'", s));
    }
    
    let val_str = parts[0].trim();
    let prec_str = parts[1].trim().trim_end_matches("dp").trim();
    
    let precision = prec_str.parse::<u8>()
        .map_err(|_| format!("Invalid precision in segment '{}'", parts[1]))?;
        
    FixedDecimal::from_str_with_precision(val_str, precision)
        .map_err(|e| e.to_string())
}

pub fn format_fp_string(fd: &FixedDecimal) -> String {
    format!("{}: {}dp", fd.to_string(), fd.precision())
}

// Extract from Neons JsString
fn extract_fp(cx: &mut FunctionContext, obj: Handle<JsString>) -> Result<FixedDecimal, String> {
    parse_fp_string(&obj.value(cx))
}

fn create_fp_str<'a>(cx: &mut FunctionContext<'a>, item: &FixedDecimal) -> JsResult<'a, JsString> {
    Ok(cx.string(format_fp_string(item)))
}

// -------------------------------------------------------------
// Namespace: fpStr (Scalar Math string-to-string)
// -------------------------------------------------------------

pub fn js_fpstr_add(mut cx: FunctionContext) -> JsResult<JsString> {
    let a_str = cx.argument::<JsString>(0)?;
    let b_str = cx.argument::<JsString>(1)?;
    
    let a = extract_fp(&mut cx, a_str).map_err(|e| cx.throw_error::<_, String>(e).unwrap_err())?;
    let b = extract_fp(&mut cx, b_str).map_err(|e| cx.throw_error::<_, String>(e).unwrap_err())?;
    
    match a.add(&b) {
        Ok(result) => create_fp_str(&mut cx, &result),
        Err(e) => cx.throw_error(e.to_string())
    }
}

pub fn js_fpstr_subtract(mut cx: FunctionContext) -> JsResult<JsString> {
    let a_str = cx.argument::<JsString>(0)?;
    let b_str = cx.argument::<JsString>(1)?;
    
    let a = extract_fp(&mut cx, a_str).map_err(|e| cx.throw_error::<_, String>(e).unwrap_err())?;
    let b = extract_fp(&mut cx, b_str).map_err(|e| cx.throw_error::<_, String>(e).unwrap_err())?;
    
    match a.subtract(&b) {
        Ok(result) => create_fp_str(&mut cx, &result),
        Err(e) => cx.throw_error(e.to_string())
    }
}

pub fn js_fpstr_multiply(mut cx: FunctionContext) -> JsResult<JsString> {
    let a_str = cx.argument::<JsString>(0)?;
    let b_str = cx.argument::<JsString>(1)?;
    
    let a = extract_fp(&mut cx, a_str).map_err(|e| cx.throw_error::<_, String>(e).unwrap_err())?;
    let b = extract_fp(&mut cx, b_str).map_err(|e| cx.throw_error::<_, String>(e).unwrap_err())?;
    
    match a.multiply(&b) {
        Ok(result) => create_fp_str(&mut cx, &result),
        Err(e) => cx.throw_error(e.to_string())
    }
}

pub fn js_fpstr_divide(mut cx: FunctionContext) -> JsResult<JsString> {
    let a_str = cx.argument::<JsString>(0)?;
    let b_str = cx.argument::<JsString>(1)?;
    
    let a = extract_fp(&mut cx, a_str).map_err(|e| cx.throw_error::<_, String>(e).unwrap_err())?;
    let b = extract_fp(&mut cx, b_str).map_err(|e| cx.throw_error::<_, String>(e).unwrap_err())?;
        
    match a.divide(&b) {
        Ok(result) => create_fp_str(&mut cx, &result),
        Err(e) => cx.throw_error(e.to_string())
    }
}

pub fn js_fpstr_divide_into(mut cx: FunctionContext) -> JsResult<JsArray> {
    let a_str = cx.argument::<JsString>(0)?;
    let parts_num = cx.argument::<JsNumber>(1)?.value(&mut cx) as u32;
    let strategy_str = cx.argument::<JsString>(2)?.value(&mut cx);
    
    let decimal = extract_fp(&mut cx, a_str).map_err(|e| cx.throw_error::<_, String>(e).unwrap_err())?;
        
    use crate::strategies::DivisionStrategySet;
    use crate::strategies::RoundingStrategy;
    use crate::strategies::RemainderStrategy;
    
    let strategy_set = match strategy_str.as_str() {
        "LoadFirst" => DivisionStrategySet {
            rounding: RoundingStrategy::Down,
            remainder: RemainderStrategy::AddToFirst,
        },
        "LoadLast" => DivisionStrategySet {
            rounding: RoundingStrategy::Down,
            remainder: RemainderStrategy::AddToLast,
        },
        _ => return cx.throw_error("Unknown division strategy"),
    };
    
    match decimal.divide_into(parts_num.into(), strategy_set) {
        Ok(results) => {
            let arr = results.0; 
            let array = cx.empty_array();
            
            for (i, d) in arr.iter().enumerate() {
                let obj = create_fp_str(&mut cx, d)?;
                array.set(&mut cx, i as u32, obj)?;
            }
            Ok(array)
        },
        Err(e) => cx.throw_error(e.to_string())
    }
}
