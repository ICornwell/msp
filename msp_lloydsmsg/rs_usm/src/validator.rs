use fp_js::core::FixedDecimal;
use fp_js::strategies::FinancialContext;
use crate::models::{UsmMessage, SyndicateShare};

#[derive(Debug, PartialEq, Eq)]
pub enum ValidationResult {
    Valid,
    InvalidCheckSum { expected: String, calculated: String },
    ParsingError(String),
}

pub fn validate_syndicate_checksum(usm: &UsmMessage, expected_total: &str) -> ValidationResult {
    let mut context = FinancialContext::new();

    // Default 2 decimal places for financial calculations
    let mut current_sum = match FixedDecimal::from_str_with_precision("0", 2) {
        Ok(v) => v,
        Err(_) => return ValidationResult::ParsingError("Failed to init sum".to_string()),
    };
    
    // Add each syndicate line explicitly utilizing our fpdec context logic
    for synd in &usm.syndicates {
        let value = match FixedDecimal::from_str_with_precision(&synd.settlement_amount, 2) {
            Ok(v) => v,
            Err(_) => return ValidationResult::ParsingError(format!("Failed to parse: {}", synd.settlement_amount)),
        };
        // Context addition properly handles rounding modes configured globally
        current_sum = match current_sum.add(&value) {
             Ok(v) => v,
             Err(_) => return ValidationResult::ParsingError("Addition error".to_string()),
        };
    }

    let expected = match FixedDecimal::from_str_with_precision(expected_total, 2) {
        Ok(v) => v,
        Err(_) => return ValidationResult::ParsingError("Failed to parse expected total".to_string()),
    };

    if current_sum == expected {
        ValidationResult::Valid
    } else {
        ValidationResult::InvalidCheckSum { 
            expected: expected.to_string(), 
            calculated: current_sum.to_string() 
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::models::{FinancialSummary, InterchangeHeader, MessageHeader, TransactionReferences};

    #[test]
    fn test_valid_checksum() {
        let usm = UsmMessage {
            interchange_header: InterchangeHeader { sender: "".into(), receiver: "".into(), date_time: "".into(), control_reference: "".into() },
            message_header: MessageHeader { sender: "".into(), receiver: "".into(), preparation_datetime: "".into(), message_reference: "".into() },
            references: TransactionReferences { umr: "".into(), ucr: None, tr: "".into() },
            financials: FinancialSummary {
                settlement_currency: "USD".into(),
                original_currency: "USD".into(),
                exchange_rate: None,
                gross_amount: "100.00".into(),
                brokerage_amount: "10.00".into(),
                net_settlement: "90.00".into(),
            },
            syndicates: vec![
                SyndicateShare { syndicate_number: "2001".into(), line_percentage: "50.00".into(), settlement_amount: "45.00".into() },
                SyndicateShare { syndicate_number: "2002".into(), line_percentage: "33.00".into(), settlement_amount: "29.70".into() },
                SyndicateShare { syndicate_number: "2003".into(), line_percentage: "17.00".into(), settlement_amount: "15.30".into() },
            ],
            raw_segments: vec![],
        };

        // 45.00 + 29.70 + 15.30 = 90.00
        assert_eq!(validate_syndicate_checksum(&usm, "90.00"), ValidationResult::Valid);
    }

    #[test]
    fn test_invalid_checksum_floating_point_trap() {
        let usm = UsmMessage {
            interchange_header: InterchangeHeader { sender: "".into(), receiver: "".into(), date_time: "".into(), control_reference: "".into() },
            message_header: MessageHeader { sender: "".into(), receiver: "".into(), preparation_datetime: "".into(), message_reference: "".into() },
            references: TransactionReferences { umr: "".into(), ucr: None, tr: "".into() },
            financials: FinancialSummary {
                settlement_currency: "USD".into(),
                original_currency: "USD".into(),
                exchange_rate: None,
                gross_amount: "0.00".into(),
                brokerage_amount: "0.00".into(),
                net_settlement: "0.00".into(),
            },
            syndicates: vec![
                // 0.1 + 0.2 normally equals 0.30000000000000004 in floating point, causing failures
                SyndicateShare { syndicate_number: "1".into(), line_percentage: "50".into(), settlement_amount: "0.10".into() },
                SyndicateShare { syndicate_number: "2".into(), line_percentage: "50".into(), settlement_amount: "0.20".into() },
            ],
            raw_segments: vec![],
        };

        let result = validate_syndicate_checksum(&usm, "0.30");
        assert_eq!(result, ValidationResult::Valid, "If standard f64 was used, this would normally fail");
    }
}
