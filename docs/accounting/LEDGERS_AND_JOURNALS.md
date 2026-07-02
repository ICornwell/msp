# London Market Ledgers & Journals Documentation

## Overview
This defines the core structural ledgers and journals required to represent London Market Technical Accounting within the graph ecosystem.

## Core Entities & Concepts

### Ledgers
A ledger acts as an aggregated, cumulative view of financial positions across related events, organized by a major subject (like a policy or a participant). 

1. **Policy Ledger (Technical Account Ledger)**
   * **Purpose:** The root ledger for a specific risk/contract (typically keyed by Unique Market Reference - UMR). Tracks overarching premiums, claims, brokerage, and net amounts.
   * **Characteristics:** Long-lived. 

2. **Syndicate / Carrier Ledger (Company Ledger)**
   * **Purpose:** Tracks the financial position with a specific syndicate or carrier across multiple policies. Contains the aggregate signed lines they participate in.

3. **Broker Ledger**
   * **Purpose:** Tracks transactions originating from or owed to a specific placing/producing broker, tracking brokerage fees and net balances.

### Journals
A journal acts as the chronological, immutable entry of a financial event or transaction that modifies the state of the ledgers.

1. **Binding Journal (Written Risk Journal)**
   * **Purpose:** Captures the initial inception of a policy risk. Contains the 100% Gross Written Premium, the participating syndicate's *written* lines, and estimated brokerage fees. Not strictly a settled financial movement, but an anticipated technical projection.

2. **Booking Journal (Signed Risk Journal)**
   * **Purpose:** Captures the firm financial booking (e.g., when the slip is signed). Modifies the Binding expectations with the actual *signed* lines of the syndicates. Usually triggers premium installment schedules.

3. **Settlement Journal (USM/SCM Cash Journal)**
   * **Purpose:** The actual movement of cash or firm confirmation from Lloyd's/Xchanging. Records USM (premium/settlements) or SCM (claims). Settles outstanding chunks from the Booking Journal into realized cash entries.
   * **Sub-types:** Inward Premium, Outward Claim, Brokerage Deduction.

4. **Adjustment Journal (Endorsement/Correction Journal)**
   * **Purpose:** Captures subsequent endorsements, Additional Premiums (AP), Return Premiums (RP), or error corrections. 
   
5. **Allocation Journal**
   * **Purpose:** Manually or automatically linking Settlement Cash to specific Booking Installments, handling over/under payments and resolving unallocated cash.
