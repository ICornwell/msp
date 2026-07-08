//! Remainder strategy types
//! 

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum RemainderStrategy {
    AddToFirst,
    AddToLast,
    KeepSeparate,
}

impl Default for RemainderStrategy {
    fn default() -> Self {
        RemainderStrategy::AddToLast
    }
}

impl RemainderStrategy {
    pub fn parse_strategy_name(name: &str) -> Option<Self> {
        match name.to_uppercase().as_str() {
            "ADD_TO_FIRST" | "FIRST" => Some(RemainderStrategy::AddToFirst),
            "ADD_TO_LAST" | "LAST" => Some(RemainderStrategy::AddToLast),
            "KEEP_SEPARATE" | "SEPARATE" => Some(RemainderStrategy::KeepSeparate),
            _ => None,
        }
    }
}

/// A configuration set of strategies for performing complex division calculations
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct DivisionStrategySet {
    pub rounding: super::RoundingStrategy,
    pub remainder: RemainderStrategy,
    // Add more here if needed, like precision strategy
}

impl Default for DivisionStrategySet {
    fn default() -> Self {
        Self {
            rounding: super::RoundingStrategy::default(),
            remainder: RemainderStrategy::default(),
        }
    }
}
