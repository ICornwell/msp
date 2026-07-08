# Testing Scope: Day in the Life scenario

## Completed Steps
- ✅ Step 1: Bind generates Installment Expectations using the Installment Strategy pattern.
- ✅ Step 2: Signings generates LPAN Advice Nodes matching Expected Capital Split from the market node.
- ✅ Step 3: Cash Matching Allocates Capital from Trust to Expected Installments, calculating Shortfalls correctly.
- ✅ Rust Native Library: Added safe mathematical division distribution to `msp_fp_js` (`fp.divideInto`) returning distributed parts and tracking remainder allocations (`FIRST`, `LAST`, `KEEP_SEPARATE`).

## Next Steps
- [ ] Step 4: Earning Amortization routes Premium down the calendar track into UPR pools correctly.
- [ ] Step 5: Capital Fiduciary Fan-out releases the trusted money out to the Syndicate edges mathematically.
