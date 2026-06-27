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
        let now = Utc::now().timestamp_micros();
        
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
        let now = Utc::now().timestamp_micros();
        
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

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    #[test]
    fn edge_new_sets_expected_identity_fields() {
        let edge = Edge::new(
            "contains".to_string(),
            "default".to_string(),
            "from-1".to_string(),
            "to-1".to_string(),
            json!({"weight":1}),
        );

        assert_eq!("contains", edge.label);
        assert_eq!("from-1", edge.from);
        assert_eq!("to-1", edge.to);
        assert_eq!("from-1", edge.from_entity_id);
        assert_eq!("to-1", edge.to_entity_id);
        assert!(!edge.id.is_empty());
        assert!(!edge.entity_id.is_empty());
        assert!(!edge.transaction_id.is_empty());
    }

    #[test]
    fn edge_superseded_by_builder_sets_invariants() {
        let edge = Edge::create_superseded_by("v-old", "v-new", "entity-1", "default");
        assert_eq!("supersededBy", edge.label);
        assert_eq!("v-old", edge.from);
        assert_eq!("v-new", edge.to);
        assert_eq!("entity-1", edge.entity_id);
        assert_eq!("entity-1", edge.from_entity_id);
        assert_eq!("entity-1", edge.to_entity_id);
        assert_eq!(serde_json::Value::Null, edge.content);
    }
}