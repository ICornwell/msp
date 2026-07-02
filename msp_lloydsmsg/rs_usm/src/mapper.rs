use crate::models::{
    FinancialSummary, InterchangeHeader, MessageHeader, RawSegment, SyndicateShare,
    TransactionReferences, UsmMessage,
};

pub fn map_to_usm(segments: Vec<RawSegment>) -> Result<UsmMessage, String> {
    let mut interchange_header = InterchangeHeader {
        sender: String::new(),
        receiver: String::new(),
        date_time: String::new(),
        control_reference: String::new(),
    };

    let mut message_header = MessageHeader {
        sender: String::new(),
        receiver: String::new(),
        preparation_datetime: String::new(),
        message_reference: String::new(),
    };

    let mut references = TransactionReferences {
        umr: String::new(),
        ucr: None,
        tr: String::new(),
    };

    let mut financials = FinancialSummary {
        settlement_currency: String::new(),
        original_currency: String::new(),
        exchange_rate: None,
        gross_amount: String::new(),
        brokerage_amount: String::new(),
        net_settlement: String::new(),
    };

    // We'll extract and build syndicates from NAD/PCD blocks
    let syndicates: Vec<SyndicateShare> = Vec::new();
    let mut raw_segments = Vec::new();

    for seg in segments {
        match seg.tag.as_str() {
            "UNB" => {
                interchange_header.sender = seg.elements.get(1).and_then(|e| e.get(0)).cloned().unwrap_or_default();
                interchange_header.receiver = seg.elements.get(2).and_then(|e| e.get(0)).cloned().unwrap_or_default();
                interchange_header.date_time = seg.elements.get(3).map(|e| e.join(":")).unwrap_or_default();
                interchange_header.control_reference = seg.elements.get(4).and_then(|e| e.get(0)).cloned().unwrap_or_default();
            }
            "UNH" => {
                message_header.message_reference = seg.elements.get(0).and_then(|e| e.get(0)).cloned().unwrap_or_default();
            }
            "RFF" => {
                let mut consumed = false;
                if let Some(rff) = seg.elements.get(0) {
                    if rff.len() >= 2 {
                        match rff[0].as_str() {
                            "TR" => { references.tr = rff[1].clone(); consumed = true; }
                            "UMR" => { references.umr = rff[1].clone(); consumed = true; }
                            "UCR" => { references.ucr = Some(rff[1].clone()); consumed = true; }
                            _ => {}
                        }
                    }
                }
                // Push RFF back to raw if we didn't map it explicitly
                if !consumed {
                    raw_segments.push(seg);
                }
            }
            "CUX" => {
                // Pluck out currency data - exact index layout varies in USM specs, so this is a placeholder heuristic
                if let Some(cux1) = seg.elements.get(0) {
                    if cux1.len() >= 2 { financials.original_currency = cux1[1].clone(); }
                }
                if let Some(cux2) = seg.elements.get(1) {
                    if cux2.len() >= 2 { financials.settlement_currency = cux2[1].clone(); }
                }
                if let Some(rate) = seg.elements.get(2) {
                    if !rate.is_empty() { financials.exchange_rate = Some(rate[0].clone()); }
                }
                raw_segments.push(seg.clone()); // Some systems like to keep CUX in raw anyway just in case
            }
            "MOA" => {
                let mut consumed = false;
                if let Some(moa) = seg.elements.get(0) {
                    if moa.len() >= 2 {
                        match moa[0].as_str() {
                            "99" => { financials.gross_amount = moa[1].clone(); consumed = true; }   // Mock Qualifier
                            "100" => { financials.brokerage_amount = moa[1].clone(); consumed = true; }
                            "101" => { financials.net_settlement = moa[1].clone(); consumed = true; }
                            _ => {}
                        }
                    }
                }
                if !consumed {
                    raw_segments.push(seg);
                }
            }
            _ => {
                // Any other segments (DTM, NAD, FTX) go straight into the unmapped fallback pile
                raw_segments.push(seg);
            }
        }
    }

    Ok(UsmMessage {
        interchange_header,
        message_header,
        references,
        financials,
        syndicates,
        raw_segments,
    })
}
