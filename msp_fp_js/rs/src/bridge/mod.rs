use neon::prelude::*;

pub mod core_ops;
pub mod dimension;
pub mod currency;

pub fn register_functions(cx: &mut ModuleContext) -> NeonResult<()> {
    // -------------------------------------------------------------
    // Namespace: fp
    // -------------------------------------------------------------
    let fp = cx.empty_object();
    
    let add_fn = JsFunction::new(cx, core_ops::js_add)?;
    fp.set(cx, "add", add_fn)?;
    
    let sub_fn = JsFunction::new(cx, core_ops::js_subtract)?;
    fp.set(cx, "subtract", sub_fn)?;
    
    let mul_fn = JsFunction::new(cx, core_ops::js_multiply)?;
    fp.set(cx, "multiply", mul_fn)?;
    
    let div_fn = JsFunction::new(cx, core_ops::js_divide)?;
    fp.set(cx, "divide", div_fn)?;
    
    let div_into_fn = JsFunction::new(cx, core_ops::js_divide_into)?;
    fp.set(cx, "divideInto", div_into_fn)?;
    
    cx.export_value("fp", fp)?;

    // -------------------------------------------------------------
    // Namespace: dim
    // -------------------------------------------------------------
    let dim = cx.empty_object();
    
    let dim_add = JsFunction::new(cx, dimension::js_dim_strict_add)?;
    dim.set(cx, "strictAdd", dim_add)?;
    
    let dim_sub = JsFunction::new(cx, dimension::js_dim_strict_subtract)?;
    dim.set(cx, "strictSubtract", dim_sub)?;
    
    let dim_mult = JsFunction::new(cx, dimension::js_dim_multiply)?;
    dim.set(cx, "multiply", dim_mult)?;
    
    let dim_div_round = JsFunction::new(cx, dimension::js_dim_divide_rounded)?;
    dim.set(cx, "divideRounded", dim_div_round)?;
    
    let dim_pct_round = JsFunction::new(cx, dimension::js_dim_percentage_of_rounded)?;
    dim.set(cx, "percentageOfRounded", dim_pct_round)?;

    let dim_div_into = JsFunction::new(cx, dimension::js_dim_divide_into)?;
    dim.set(cx, "divideInto", dim_div_into)?;
    
    let dim_sum = JsFunction::new(cx, dimension::js_dim_strict_sum_over)?;
    dim.set(cx, "strictSumOver", dim_sum)?;

    let dim_sum_prod = JsFunction::new(cx, dimension::js_dim_strict_sum_over_products)?;
    dim.set(cx, "strictSumOverProducts", dim_sum_prod)?;
    
    cx.export_value("dim", dim)?;

    // -------------------------------------------------------------
    // Namespace: dimSet
    // -------------------------------------------------------------
    let dim_set = cx.empty_object();
    
    let set_sum_dim_fn = JsFunction::new(cx, dimension::js_sum_dimensions)?;
    dim_set.set(cx, "sumDimensions", set_sum_dim_fn)?;
    
    let set_add_fn = JsFunction::new(cx, dimension::js_set_strict_add)?;
    dim_set.set(cx, "add", set_add_fn)?;
    
    let set_sub_fn = JsFunction::new(cx, dimension::js_set_strict_subtract)?;
    dim_set.set(cx, "subtract", set_sub_fn)?;

    let set_mul_fn = JsFunction::new(cx, dimension::js_set_multiply)?;
    dim_set.set(cx, "multiply", set_mul_fn)?;
    
    let set_div_round = JsFunction::new(cx, dimension::js_set_divide_rounded)?;
    dim_set.set(cx, "divideRounded", set_div_round)?;
    
    let set_pct_round = JsFunction::new(cx, dimension::js_set_percentage_of_rounded)?;
    dim_set.set(cx, "percentageOfRounded", set_pct_round)?;

    let set_div_into_fn = JsFunction::new(cx, dimension::js_set_divide_into)?;
    dim_set.set(cx, "divideInto", set_div_into_fn)?;
    
    let set_sum_over_fn = JsFunction::new(cx, dimension::js_set_strict_sum_over)?;
    dim_set.set(cx, "strictSumOver", set_sum_over_fn)?;

    let set_sum_prod_fn = JsFunction::new(cx, dimension::js_set_strict_sum_over_products)?;
    dim_set.set(cx, "strictSumOverProducts", set_sum_prod_fn)?;
    
    cx.export_value("dimSet", dim_set)?;

    // -------------------------------------------------------------
    // Namespace: ccy
    // -------------------------------------------------------------
    let ccy = cx.empty_object();
    
    let ccy_add = JsFunction::new(cx, currency::js_ccy_strict_add)?;
    ccy.set(cx, "strictAdd", ccy_add)?;
    
    let ccy_sub = JsFunction::new(cx, currency::js_ccy_strict_subtract)?;
    ccy.set(cx, "strictSubtract", ccy_sub)?;
    
    let ccy_mult = JsFunction::new(cx, currency::js_ccy_multiply)?;
    ccy.set(cx, "multiply", ccy_mult)?;

    let ccy_div_round = JsFunction::new(cx, currency::js_ccy_divide_rounded)?;
    ccy.set(cx, "divideRounded", ccy_div_round)?;
    
    let ccy_pct_round = JsFunction::new(cx, currency::js_ccy_percentage_of_rounded)?;
    ccy.set(cx, "percentageOfRounded", ccy_pct_round)?;

    let ccy_div_into = JsFunction::new(cx, currency::js_ccy_divide_into)?;
    ccy.set(cx, "divideInto", ccy_div_into)?;
    
    let ccy_sum = JsFunction::new(cx, currency::js_ccy_strict_sum_over)?;
    ccy.set(cx, "strictSumOver", ccy_sum)?;

    let ccy_sum_prod = JsFunction::new(cx, currency::js_ccy_strict_sum_over_products)?;
    ccy.set(cx, "strictSumOverProducts", ccy_sum_prod)?;
    
    cx.export_value("ccy", ccy)?;

    // -------------------------------------------------------------
    // Namespace: ccySet
    // -------------------------------------------------------------
    let ccy_set = cx.empty_object();
            
    let cset_add_fn = JsFunction::new(cx, currency::js_ccyset_strict_add)?;
    ccy_set.set(cx, "add", cset_add_fn)?;

    let cset_sub_fn = JsFunction::new(cx, currency::js_ccyset_strict_subtract)?;
    ccy_set.set(cx, "subtract", cset_sub_fn)?;

    let cset_mul_fn = JsFunction::new(cx, currency::js_ccyset_multiply)?;
    ccy_set.set(cx, "multiply", cset_mul_fn)?;

    let cset_div_round = JsFunction::new(cx, currency::js_ccyset_divide_rounded)?;
    ccy_set.set(cx, "divideRounded", cset_div_round)?;
    
    let cset_pct_round = JsFunction::new(cx, currency::js_ccyset_percentage_of_rounded)?;
    ccy_set.set(cx, "percentageOfRounded", cset_pct_round)?;

    let cset_div_into_fn = JsFunction::new(cx, currency::js_ccyset_divide_into)?;
    ccy_set.set(cx, "divideInto", cset_div_into_fn)?;
    
    let cset_sum_over_fn = JsFunction::new(cx, currency::js_ccyset_strict_sum_over)?;
    ccy_set.set(cx, "strictSumOver", cset_sum_over_fn)?;

    let cset_sum_prod_fn = JsFunction::new(cx, currency::js_ccyset_strict_sum_over_products)?;
    ccy_set.set(cx, "strictSumOverProducts", cset_sum_prod_fn)?;

    cx.export_value("ccySet", ccy_set)?;
    
    Ok(())
}
