use serde::{Deserialize, Serialize};
use poem_openapi::Object;
use serde_json::Value;
use uuid::Uuid;
use chrono::Utc;

#[derive(Debug, Deserialize, Serialize, Clone, Object)]
#[serde(rename_all = "camelCase")]
pub struct Vertex {
    #[serde(default)]
    #[oai(default)]
    pub id: String,
    
    #[serde(default, rename = "__tmpId")]
    #[oai(rename = "__tmpId", default)]
    pub tmp_id: String,
    
    #[serde(default, rename = "__originalId")]
    #[oai(rename = "__originalId", default)]
    pub original_id: String,
    
    #[serde(default, rename = "__entityId")]
    #[oai(rename = "__entityId", default)]
    pub entity_id: String,
    
    #[serde(default, rename = "__transactionId")]
    #[oai(rename = "__transactionId", default)]
    pub transaction_id: String,
    
    #[serde(rename = "__label")]
    #[oai(rename = "__label")]
    pub label: String,

    #[serde(rename = "__isEntity")]
    #[oai(rename = "__isEntity")]
    pub is_entity: bool,
    
    #[serde(rename = "__viewType")]
    #[oai(rename = "__viewType")]
    pub view_type: String,
    
    #[serde(default, rename = "__timeStamp")]
    #[oai(rename = "__timeStamp", default)]
    pub timestamp: i64,

    #[serde(default, rename = "__viewManagedEdges")]
    #[oai(rename = "__viewManagedEdges", default)]
    pub view_managed_edges: Vec<String>,

    #[serde(default, rename = "__businessKey")]
    #[oai(rename = "__businessKey", default)]
    pub business_key: String,

    #[serde(default, rename = "__alternateKey")]
    #[oai(rename = "__alternateKey", default)]
    pub alternate_key: String,
    
    pub content: Value,
}

impl Vertex {
    /// Create a new vertex with auto-generated IDs
    pub fn new(label: String, view_type: String, content: Value) -> Self {
        let id = Uuid::now_v7().to_string();
        let now = Utc::now().timestamp_micros();
        
        Self {
            id: id.clone(),
            tmp_id: String::new(),
            original_id: String::new(),
            entity_id: id.clone(),
            transaction_id: "missing".to_string(),
            label,
            is_entity: false,
            view_type,
            timestamp: now,
            business_key: String::new(),
            alternate_key: String::new(),
            view_managed_edges: Vec::new(),
            content,
        }
    }
    
    pub fn clone_with_new_id(&self, new_id: String) -> Vertex {
        let mut cloned = self.clone();
        cloned.id = new_id;
        cloned
    }

    /// Set a temporary ID for the vertex (used during batch operations)
    pub fn with_tmp_id(mut self, tmp_id: String) -> Self {
        self.tmp_id = tmp_id;
        self
    }
    
    /// Create a new version of this vertex for updates
    pub fn create_new_version(&self, content: Value) -> Self {
        let new_id = Uuid::now_v7().to_string();
        let now = Utc::now().timestamp_micros();
        
        Self {
            id: new_id,
            tmp_id: String::new(),
            original_id: self.id.clone(),
            entity_id: self.entity_id.clone(),
            transaction_id: "missing".to_string(),
            label: self.label.clone(),
            is_entity: self.is_entity,
            view_type: self.view_type.clone(),
            timestamp: now,
            business_key: self.business_key.clone(),
            alternate_key: self.alternate_key.clone(),
            view_managed_edges: self.view_managed_edges.clone(),
            content,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    #[test]
    fn vertex_new_sets_core_fields() {
        let v = Vertex::new("Product".to_string(), "default".to_string(), json!({"name":"P"}));
        assert_eq!("Product", v.label);
        assert_eq!("default", v.view_type);
        assert_eq!(v.id, v.entity_id);
        assert!(!v.id.is_empty());
        assert_eq!("missing", v.transaction_id);
        assert!(!v.is_entity);
    }

    #[test]
    fn vertex_clone_and_version_helpers_work() {
        let original = Vertex::new("Product".to_string(), "default".to_string(), json!({"v":1}))
            .with_tmp_id("tmp-1".to_string());
        assert_eq!("tmp-1", original.tmp_id);

        let cloned = original.clone_with_new_id("new-id".to_string());
        assert_eq!("new-id", cloned.id);
        assert_eq!(original.entity_id, cloned.entity_id);

        let next = original.create_new_version(json!({"v":2}));
        assert_eq!(original.id, next.original_id);
        assert_eq!(original.entity_id, next.entity_id);
        assert_eq!(original.label, next.label);
        assert_eq!(json!({"v":2}), next.content);
        assert_ne!(original.id, next.id);
    }
}