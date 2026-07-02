use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UsmMessage {
    pub interchange_header: InterchangeHeader, // UNB
    pub message_header: MessageHeader,         // UNH
    pub references: TransactionReferences,
    pub financials: FinancialSummary,
    #[serde(skip_serializing_if = "Vec::is_empty", default)]
    pub syndicates: Vec<SyndicateShare>,
    // Fallback block for all unmapped raw segments
    #[serde(skip_serializing_if = "Vec::is_empty", default)]
    pub raw_segments: Vec<RawSegment>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct InterchangeHeader {
    pub sender: String,
    pub receiver: String,
    pub date_time: String,
    pub control_reference: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MessageHeader {
    pub sender: String,
    pub receiver: String,
    pub preparation_datetime: String,
    pub message_reference: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TransactionReferences {
    /// Unique Market Reference
    pub umr: String,
    /// Unique Claim Reference (optional, might be absent for premium-only USMs)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub ucr: Option<String>,
    /// Transaction Reference
    pub tr: String, 
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct FinancialSummary {
    pub settlement_currency: String,
    pub original_currency: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub exchange_rate: Option<String>,
    
    // Using simple strings to capture exact decimals from message
    pub gross_amount: String,
    pub brokerage_amount: String,
    pub net_settlement: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SyndicateShare {
    pub syndicate_number: String,
    pub line_percentage: String,
    pub settlement_amount: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RawSegment {
    pub tag: String,
    pub elements: Vec<Vec<String>>,
}
