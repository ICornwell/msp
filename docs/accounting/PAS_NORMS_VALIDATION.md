# London Market PAS Norms & Critical Complexities (Step 3)

To ensure this foundation is non-trivial, production-capable, and avoids the "retro-fit vs. rewrite" trap, the underlying model must natively support these specific complexities from day one. Failing to model these early usually mandates tearing up the foundation later.

## 1. Multi-Currency Triangulation
A single value is never just "amount". In the London Market, systems must track:
* **Original Currency (OC):** The currency the risk was written in (e.g., JPY).
* **Settlement Currency (SC):** The currency the cash moves in (e.g., GBP).
* **Base/Reporting Currency (BC):** The internal accounting currency of the company (e.g., USD).
* **Exchange Rates (ROE):** The temporal rate used at time of booking vs time of settlement.
* *Design mandate:* Every monetary value must be a composite object containing `[amount, currency]` and linkable to exchange rate context.

## 2. Dynamic Deductions & Taxes
Never hardcode `brokerage_amount` or `tax_amount` as columns in a policy table.
London Market trades have arbitrary stacks of deductions: Brokerage, over-rider commissions, foreign insurance legislation (FIL) taxes, etc.
* *Design mandate:* Ledgers must be built from generic `TransactionLineItems` (debits/credits) categorized by a `ChargeType` dictating what the movement represents.

## 3. The "Many-to-Many" Cash Allocation Reality
A USM settlement (Cash) rarely matches a single Policy Booking exactly 1-to-1.
* A single USM message can pay for 3 different installments across 2 different policies.
* A single installment might be paid partially across 3 different USMs over 6 months.
* *Design mandate:* Allocation cannot be a simple foreign key on the cash event. It requires an explicit `Allocation` join-entity resolving the M:N relationship between `CashReceipt` and `PremiumInstallment`.

## 4. Market Splits & Sub-markets (Bureau vs Non-Bureau)
A 100% placement is often split between Lloyd's Syndicates (who settle via central EDIFACT messaging like USM/SCM) and Company Markets (who settle bilaterally).
* *Design mandate:* Bookings & ledgers must delineate the `SettlementRoute` for different slices of the `SignedLine`.

## 5. Signed vs Written Line Precision
A syndicate might write 10% (Written Line) but only sign 8.3333334% (Signed Line) due to over-subscription. 
* *Design mandate:* Share percentages require high-precision math (our fixed-point rust library strategy supports this perfectly). The gap between written and signed must be structurally recorded, not overwritten.
