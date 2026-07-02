# Ledger Graph Architecture & Double-Entry Design

## 1. Graph Shape & Modeling

We treat accounting not as mutable rows in a database table updating a balance, but as immutable Event Nodes generating Journal sub-graphs points to Account nodes. 

This model gracefully supports highly complex London Market variants without technical noise. "Paid", "Short-fall", and "Earned" are derived graph states, not boolean flags.

```mermaid
flowchart TD
    %% Core Domain Entities (The Reality & Expectations)
    Pol[Policy Node\nUMR: B0456...]
    Inst[Installment Expectation\nNet: £30k, Due: Oct 30]
    
    Pol -->|hasExpectation| Inst
    
    %% The Event/Transaction layer (The Triggers)
    Adv[Broker Advice / LPAN\nAdvised Net: £30k]
    Cash[Cash Receipt\nBank Ref: £30k]
    Earn[Earning Run\nMonth End Amortization]

    %% Graph Linkages (Matching)
    Match[Allocation / Match Node]
    Variance[FX / Short-fall\nWrite-off Node]
    
    Adv -->|fulfillsExpectation| Inst
    Cash -->|allocatesCashTo| Match
    Adv -->|matchedBy| Match
    Match -.->|resolvesDiscrepancy| Variance
    
    %% Accounting Entries (Double Entry Graph Sub-Nodes)
    J_Adv[Journal: Premium Advised]
    J_Cash[Journal: Cash Settled]
    J_Earn[Journal: Premium Earned]
    
    Adv -.->|generates| J_Adv
    Cash -.->|generates| J_Cash
    Earn -.->|generates| J_Earn
    
    %% Ledger Accounts (The Ends of the Journals)
    AccRec[A/C: Broker Receivable]
    AccUPR[A/C: Unearned Prm Reserve]
    AccCash[A/C: Ops Cash Bank]
    AccEarn[A/C: Earned Premium]
    
    J_Adv -->|Debit £30k| AccRec
    J_Adv -->|Credit £30k| AccUPR
    
    J_Cash -->|Debit £30k| AccCash
    J_Cash -->|Credit £30k| AccRec
    
    J_Earn -->|Debit £X| AccUPR
    J_Earn -->|Credit £X| AccEarn
    
    %% Styling
    classDef domain fill:#d4e157,stroke:#333,stroke-width:2px,color:#000;
    classDef event fill:#64b5f6,stroke:#333,stroke-width:1px,color:#000;
    classDef account fill:#ffb74d,stroke:#333,stroke-width:2px,color:#000;
    classDef journal fill:#e0e0e0,stroke:#333,stroke-width:1px,stroke-dasharray: 4 4,color:#000;
    classDef junction fill:#ce93d8,stroke:#333,stroke-width:2px,color:#000;
    
    class Pol,Inst domain;
    class Adv,Cash,Earn event;
    class AccRec,AccUPR,AccCash,AccEarn account;
    class J_Adv,J_Cash,J_Earn journal;
    class Match,Variance junction;
```

## 2. Hypothesis Scenarios
*   **The Perfect Path:** Advice generates Debits and Credits. Cash arrives as a separate event generating more Jnl entries. A `Match` node links Advice and Cash. The `Receivable` account organically drops to zero balance visually on the graph.
*   **Short-fall / FX Variance:** If Cash doesn't equal Advice, the `Match` node acts as the pivot that also anchors a `Variance` event, which zeroes out the missing value without mutating the original Advice or Cash records.

## 3. Test-Driven Setup
The structure below is tested structurally by ensuring the fluent DSL views permit these types of relationships and mathematically tested by creating an array of journal elements and verifying balances.
