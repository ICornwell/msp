# Outward Ledger & Syndicate Allocation (The "Fan-Out")

## 1. The Business Challenge
In a subscription market (like Lloyd's), an MGA rarely retains 100% of the risk. An incoming Premium Advice (e.g., an LPAN for £100,000 Net) must be mathematically sliced. The MGA takes its over-riding commission (e.g., £20,000) and the remaining £80,000 is distributed across the carriers (Syndicates) based on their `MarketShare` percentages defined on the `Policy`.

## 2. Graph Shape & Modeling
Rather than hardcoding calculation steps into massive services, the graph structurally records the Fan-Out as an explicit immutable event (`OutwardAllocation`). This event is triggered by the incoming `BrokerAdvice` and binds the incoming UPR (Unearned Premium Reserve) to the outward payables and income.

```mermaid
flowchart TD
    %% Core Expectations & Policy Config
    Pol[Policy Node\nUMR: B1234...]
    Share1[Market Share\nSyndicate 2001: 40%]
    Share2[Market Share\nSyndicate 2002: 60%]
    
    Pol -->|hasRiskCarrier| Share1
    Pol -->|hasRiskCarrier| Share2

    %% Transaction Layer
    Adv[Broker Advice / LPAN\nGross: £100k, Broker Net: £80k]
    Alloc[Outward Allocation Event\nMGA Comm: 20%]
    
    Adv -->|triggersSplit| Alloc
    Alloc -.->|readsSharesFrom| Pol

    %% Inward Accounting Entries (What the Broker owes us)
    J_AdvDR[Journal: DR Receivable £80k]
    J_AdvCR[Journal: CR UPR £80k]
    
    Adv -.->|generates| J_AdvDR
    Adv -.->|generates| J_AdvCR

    %% Outward Accounting Entries (What we owe the Carriers)
    J_AllocDR[Journal: DR UPR £80k\nRelieves incoming liability]
    J_AllocInc[Journal: CR MGA Commission £16k\n20% of £80k]
    J_PayS1[Journal: CR Payable Synd 2001 £25.6k\n40% of £64k]
    J_PayS2[Journal: CR Payable Synd 2002 £38.4k\n60% of £64k]

    Alloc -.->|generates| J_AllocDR
    Alloc -.->|generates| J_AllocInc
    Alloc -.->|generates| J_PayS1
    Alloc -.->|generates| J_PayS2

    %% Accounts
    AccRec[A/C: Broker Receivable]
    AccUPR[A/C: Unearned Premium Reserve]
    AccInc[A/C: MGA Commission Income]
    AccPayS1[A/C: Syndicate 2001 Payable]
    AccPayS2[A/C: Syndicate 2002 Payable]

    J_AdvDR -->|Debits| AccRec
    J_AdvCR -->|Credits| AccUPR
    
    J_AllocDR -->|Debits| AccUPR
    J_AllocInc -->|Credits| AccInc
    J_PayS1 -->|Credits| AccPayS1
    J_PayS2 -->|Credits| AccPayS2

    %% Styling
    classDef domain fill:#d4e157,stroke:#333,stroke-width:2px,color:#000;
    classDef event fill:#64b5f6,stroke:#333,stroke-width:1px,color:#000;
    classDef account fill:#ffb74d,stroke:#333,stroke-width:2px,color:#000;
    classDef journal fill:#e0e0e0,stroke:#333,stroke-width:1px,stroke-dasharray: 4 4,color:#000;
    
    class Pol,Share1,Share2 domain;
    class Adv,Alloc event;
    class AccRec,AccUPR,AccInc,AccPayS1,AccPayS2 account;
    class J_AdvDR,J_AdvCR,J_AllocDR,J_AllocInc,J_PayS1,J_PayS2 journal;
```

## 3. Structural Observations
*   **Balance is maintained block-by-block:** The `BrokerAdvice` transaction balances to 0 (£80k DR - £80k CR). The `OutwardAllocation` transaction also balances to 0 (£80k DR - £16k CR - £25.6k CR - £38.4k CR).
*   **The UPR acts as a bridge:** The `BrokerAdvice` establishes the full £80k liability in the UPR. The `OutwardAllocation` immediately drains that UPR out and distributes it. Therefore, if the MGA retains 0% of the risk, their net UPR effectively becomes zero, while the payable accounts increment correctly.
*   **Payouts are seamless:** When it comes time to pay the Syndicates, we simply look for unpaid Credits in `AccPayS1` and link a new `CashDisbursement` event against them.