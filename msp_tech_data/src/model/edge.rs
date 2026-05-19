use serde::{Deserialize, Serialize};
use poem_openapi::Object;
use serde_json::Value;
use uuid::Uuid;
use chrono::Utc;

#[derive(Debug, Deserialize, Serialize, Clone, Object)]
#[serde(rename_all = "camelCase")]
pub struct Edge {
    #[serde(default)]
    #[oai(default)]
    pub id: String,
    
    #[serde(default, rename = "__entityId")]
    #[oai(rename = "__entityId", default)]
    pub entity_id: String,
    
    #[serde(default, rename = "__transactionId")]
    #[oai(rename = "__transactionId", default)]
    pub transaction_id: String,
    
    #[serde(rename = "__label")]
    #[oai(rename = "__label")]
    pub label: String,
    
    #[serde(rename = "__viewType")]
    #[oai(rename = "__viewType")]
    pub view_type: String,
    
    pub from: String,
    pub to: String,
    
    #[serde(rename = "fromEntityId")]
    #[oai(rename = "fromEntityId", default)]
    pub from_entity_id: String,
    #[serde(rename = "toEntityId")]
    #[oai(rename = "toEntityId", default)]
    pub to_entity_id: String,
    
    #[serde(default, rename = "__timeStamp")]
    #[oai(rename = "__timeStamp", default)]
    pub timestamp: i64,
    
    pub content: Value,
}

impl Edge {
    /// Create a new edge with auto-generated IDs
    pub fn new(label: String, view_type: String, from: String, to: String, content: Value) -> Self {
        let id = Uuid::now_v7().to_string();
        let now = Utc::now().timestamp();
        
        Self {
            id: id.clone(),
            entity_id: id.clone(),
            transaction_id: Uuid::now_v7().to_string(),
            label,
            view_type,
            from: from.clone(),
            to: to.clone(),
            from_entity_id: from,
            to_entity_id: to,
            timestamp: now,
            content,
        }
    }
    
    /// Create a supersededBy edge linking an old vertex to its new version
    pub fn create_superseded_by(from_vertex_id: &str, to_vertex_id: &str, entity_id: &str, view_type: &str) -> Self {
        let id = Uuid::now_v7().to_string();
        let now = Utc::now().timestamp();
        
        Self {
            id,
            entity_id: entity_id.to_string(),
            transaction_id: Uuid::now_v7().to_string(),
            label: "supersededBy".to_string(),
            view_type: view_type.to_string(),
            from: from_vertex_id.to_string(),
            to: to_vertex_id.to_string(),
            from_entity_id: entity_id.to_string(),
            to_entity_id: entity_id.to_string(),
            timestamp: now,
            content: serde_json::Value::Null,
        }
    }
}