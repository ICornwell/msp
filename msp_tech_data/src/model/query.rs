use poem_openapi::Object;
use serde::{ Deserialize, Serialize };
use super::GraphElements;

#[derive(Debug, Deserialize, Clone, Object)]
pub struct QueryObject {
    #[serde(rename = "type")]
    #[oai(rename = "type")]
    pub label: String,

    #[serde(rename = "originalType")]
    #[oai(rename = "originalType", default)]
    pub original_label: String,
    #[serde(rename = "isQueryRoot")]
    #[oai(rename = "isQueryRoot")]
    pub is_query_root: bool,
    #[serde(rename = "queryObjectId")]
    #[oai(rename = "queryObjectId")]
    pub query_object_id: String,
    pub attributes: Vec<String>,
}

impl QueryObject {
    pub fn is_object_with_id(&self, id: &str) -> bool {
        self.query_object_id == id
    }
}

#[derive(Debug, Deserialize, Clone, Object)]
pub struct QueryRelation {
    #[serde(rename = "from")]
    #[oai(rename = "from")]
    pub from_object: String,

    #[serde(rename = "to")]
    #[oai(rename = "to")]
    pub to_object: String,

    #[serde(rename = "type")]
    #[oai(rename = "type")]
    pub label: String,
    #[oai(default)]
    pub reverse: bool,
}

impl QueryRelation {
    pub fn is_relation_from_id(&self, id: &str) -> bool {
        self.effective_from_object() == id
    }

    /// Check if this is a QueryRelation with the specified ID as the to object
    pub fn is_relation_to_id(&self, id: &str) -> bool {
        self.effective_to_object() == id
    }

    pub fn effective_from_object(&self) -> &str {
        if self.reverse {
            &self.to_object
        } else {
            &self.from_object
        }
    }
    pub fn effective_to_object(&self) -> &str {
        if self.reverse {
            &self.from_object
        } else {
            &self.to_object
        }
    }
}

#[derive(Debug, Deserialize, Clone, Object)]
pub struct QueryMessage {
    pub name: String,
    pub version: String,
    pub user: String,
    #[serde(rename = "queryDate")]
    #[oai(rename = "queryDate")]
    pub query_date: String,
    #[serde(rename = "rootQueryKeyProperty")]
    #[oai(rename = "rootQueryKeyProperty")]
    pub root_query_key_property: String,
    #[serde(rename = "rootQueryKeyValue")]
    #[oai(rename = "rootQueryKeyValue")]
    pub root_query_key_value: String,
    #[serde(rename = "rootQueryKeyTypes")]
    #[oai(rename = "rootQueryKeyTypes")]
    pub root_query_key_types: String,
    #[serde(rename = "useEntityIdAsKey")]
    #[oai(rename = "useEntityIdAsKey")]
    pub use_entity_id_as_key: bool,
    #[serde(rename = "isLatestOnly")]
    #[oai(rename = "isLatestOnly")]
    pub is_latest_only: bool,
    #[serde(rename = "timeStamp")]
    #[oai(rename = "timeStamp")]
    pub timestamp: i64,
    #[serde(rename = "queryType")]
    #[oai(rename = "queryType")]
    pub query_type: String,

    #[serde(default, rename = "getObjects")]
    #[oai(rename = "getObjects", default)]
    pub query_objects: Vec<QueryObject>,
    #[serde(default, rename = "getRelations")]
    #[oai(rename = "getRelations", default)]
    pub query_relations: Vec<QueryRelation>,
}

impl QueryMessage {
    /// Find the root query object
    pub fn find_root_object(&self) -> Option<&QueryObject> {
        self.query_objects.iter().find_map(|part| {
            match part {
                obj if obj.is_query_root => Some(obj),
                _ => None,
            }
        })
    }
}

#[derive(Debug, Serialize, Object)]
pub struct QueryResponse {
    pub success: bool,
    pub data: Option<GraphElements>,
    pub message: Option<String>,
}

impl QueryResponse {
    /// Create a successful response with data
    pub fn success(data: GraphElements) -> Self {
        Self {
            success: true,
            data: Some(data),
            message: None,
        }
    }

    /// Create a successful response without data
    pub fn success_empty() -> Self {
        Self {
            success: true,
            data: None,
            message: None,
        }
    }

    /// Create an error response with a message
    pub fn error(message: String) -> Self {
        Self {
            success: false,
            data: None,
            message: Some(message),
        }
    }

    pub fn has_edges(&self) -> bool {
        match &self.data {
            Some(query_response) => query_response.has_edges(),
            None => false,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    #[test]
    fn query_object_and_relation_id_helpers_work() {
        let obj = QueryObject {
            label: "Product".to_string(),
            original_label: "Product".to_string(),
            is_query_root: true,
            query_object_id: "p".to_string(),
            attributes: vec!["id".to_string()],
        };
        assert!(obj.is_object_with_id("p"));
        assert!(!obj.is_object_with_id("x"));

        let rel = QueryRelation {
            from_object: "p".to_string(),
            to_object: "s".to_string(),
            label: "suppliedBy".to_string(),
            reverse: false,
        };
        assert!(rel.is_relation_from_id("p"));
        assert!(rel.is_relation_to_id("s"));
        assert!(!rel.is_relation_from_id("s"));
        assert!(!rel.is_relation_to_id("p"));
    }

    #[test]
    fn find_root_object_returns_expected_item() {
        let msg = QueryMessage {
            name: "root-check".to_string(),
            version: "1.0".to_string(),
            user: "test".to_string(),
            query_date: "2026-01-01".to_string(),
            root_query_key_property: "id".to_string(),
            root_query_key_value: "root-1".to_string(),
            root_query_key_types: "all".to_string(),
            use_entity_id_as_key: false,
            is_latest_only: true,
            timestamp: 0,
            query_type: "graph".to_string(),
            query_objects: vec![
                QueryObject {
                    label: "Supplier".to_string(),
                    original_label: "Supplier".to_string(),
                    is_query_root: false,
                    query_object_id: "s".to_string(),
                    attributes: vec!["id".to_string()],
                },
                QueryObject {
                    label: "Product".to_string(),
                    original_label: "Product".to_string(),
                    is_query_root: true,
                    query_object_id: "p".to_string(),
                    attributes: vec!["id".to_string(), "name".to_string()],
                },
            ],
            query_relations: vec![],
        };

        let root = msg.find_root_object().expect("expected a query root");
        assert_eq!("p", root.query_object_id);
        assert_eq!("Product", root.label);

        let no_root = QueryMessage {
            query_objects: vec![QueryObject {
                label: "Product".to_string(),
                original_label: "Product".to_string(),
                is_query_root: false,
                query_object_id: "p".to_string(),
                attributes: vec!["id".to_string()],
            }],
            ..msg
        };
        assert!(no_root.find_root_object().is_none());
    }

    #[test]
    fn query_message_deserializes_with_default_arrays() {
        let payload = json!({
            "name": "default-array-query",
            "version": "1.0",
            "user": "test",
            "queryDate": "2026-01-01",
            "rootQueryKeyProperty": "id",
            "rootQueryKeyValue": "k1",
            "rootQueryKeyTypes": "all",
            "useEntityIdAsKey": false,
            "isLatestOnly": true,
            "timeStamp": 0,
            "queryType": "graph"
        });

        let msg: QueryMessage = serde_json::from_value(payload).expect("payload should deserialize");
        assert!(msg.query_objects.is_empty());
        assert!(msg.query_relations.is_empty());
    }

    #[test]
    fn query_response_builders_and_has_edges_work() {
        let elements = GraphElements::new();
        let ok = QueryResponse::success(elements);
        assert!(ok.success);
        assert!(ok.data.is_some());
        assert!(!ok.has_edges());

        let empty = QueryResponse::success_empty();
        assert!(empty.success);
        assert!(empty.data.is_none());
        assert!(!empty.has_edges());

        let err = QueryResponse::error("boom".to_string());
        assert!(!err.success);
        assert!(err.data.is_none());
        assert_eq!(Some("boom".to_string()), err.message);
    }
}
