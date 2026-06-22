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
        self.from_object == id
    }

    /// Check if this is a QueryRelation with the specified ID as the to object
    pub fn is_relation_to_id(&self, id: &str) -> bool {
        self.to_object == id
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
