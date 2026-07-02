use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PolicyLedger {
    pub umr: String,
    pub insured_name: String,
    pub inception_date: String,
    pub expiry_date: String,
    
    // Lloyd's coding
    pub cob: String,         // Class of Business (e.g., MA - Marine Cargo)
    pub cob2: Option<String>,// Secondary COB mapping
    pub fil_code: String,    // E.g., S (Standard), N (Non-Standard)
    pub tax_jurisdiction: String,

    pub currencies: PolicyCurrencies,
    pub placement: PlacementDetails,
    
    // Financial Expectations (100% level)
    pub expected_premium_income_100: String,
    pub expected_brokerage_pct: String,
    
    pub payment_schedule: Vec<PaymentInstallment>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PolicyCurrencies {
    pub original_currency: String,    // CCY the risk is written in
    pub settlement_currency: String,  // CCY the broker will pay us in
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PlacementDetails {
    pub syndicate_number: String,
    pub written_line_pct: String, // What the underwriter stamped
    pub signed_line_pct: String,  // What Xchanging actually signed down to
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PaymentInstallment {
    pub installment_number: u8,
    pub due_date: String,
    pub expected_net_settlement: String, // Our signed share after brokerage
    pub status: InstallmentStatus,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub enum InstallmentStatus {
    Pending,
    PartiallyAllocated,
    FullyAllocated,
}

// ---------------------------------------------------------
// Seed Data: Realistic Market Scenarios
// ---------------------------------------------------------

pub fn get_mock_ledgers() -> Vec<PolicyLedger> {
    vec![
        // Scenario 1: Marine Cargo, Oversubscribed (Short-signed)
        // Written 20%, but the broker got 120% support on the slip, so we are signed down to 16.6667%
        PolicyLedger {
            umr: "B0123MAR202611A".into(),
            insured_name: "Global Shipping Co Ltd".into(),
            inception_date: "2026-07-01".into(),
            expiry_date: "2027-06-30".into(),
            cob: "MA".into(),     // Marine Cargo
            cob2: Some("MCA".into()),
            fil_code: "S".into(),
            tax_jurisdiction: "UK".into(),
            currencies: PolicyCurrencies {
                original_currency: "USD".into(),
                settlement_currency: "USD".into(),
            },
            placement: PlacementDetails {
                syndicate_number: "2001".into(),
                written_line_pct: "20.0000".into(),
                signed_line_pct: "16.6667".into(),
            },
            // $1,200,000 for 100% of the risk
            expected_premium_income_100: "1200000.00".into(),
            expected_brokerage_pct: "15.0000".into(), // 15% broker commission
            
            // Expected Net for our 16.6667% = $1,200,000 * 16.6667% = $200,000.40 Gross
            // Less 15% Brokerage ($30,000.06) = $170,000.34 Net
            // Split into two installments.
            payment_schedule: vec![
                PaymentInstallment {
                    installment_number: 1,
                    due_date: "2026-08-15".into(),
                    expected_net_settlement: "85000.17".into(),
                    status: InstallmentStatus::Pending,
                },
                PaymentInstallment {
                    installment_number: 2,
                    due_date: "2026-11-15".into(),
                    expected_net_settlement: "85000.17".into(),
                    status: InstallmentStatus::Pending,
                }
            ],
        },

        // Scenario 2: US Property, 100% placed, Complex taxes, multi-currency
        // Premium in USD, settlement converted to GBP by broker.
        PolicyLedger {
            umr: "B0456PROP202622B".into(),
            insured_name: "Texas Real Estate Holdings".into(),
            inception_date: "2026-09-01".into(),
            expiry_date: "2027-08-31".into(),
            cob: "PF".into(),     // Property Fire
            cob2: None,
            fil_code: "N".into(), // Non-Standard (Surplus Lines)
            tax_jurisdiction: "US-TX".into(),
            currencies: PolicyCurrencies {
                original_currency: "USD".into(),
                settlement_currency: "GBP".into(), // We expect GBP settlement
            },
            placement: PlacementDetails {
                syndicate_number: "2001".into(),
                written_line_pct: "10.0000".into(),
                signed_line_pct: "10.0000".into(), // 100% placed exactly
            },
            // $500,000 for 100%
            expected_premium_income_100: "500000.00".into(),
            expected_brokerage_pct: "25.0000".into(), // High US retail+wholesale brokerage
            
            // Expected Gross: $50,000 Gross. 
            // Brokerage: $12,500
            // Net USD: $37,500. 
            // Converted at estimated 0.80 GBP/USD = £30,000
            payment_schedule: vec![
                PaymentInstallment {
                    installment_number: 1,
                    due_date: "2026-10-30".into(),
                    expected_net_settlement: "30000.00".into(), // GBP Expected
                    status: InstallmentStatus::Pending,
                }
            ],
        }
    ]
}
