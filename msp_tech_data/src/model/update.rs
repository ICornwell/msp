use poem_openapi::Object;
use serde::{Deserialize, Serialize};
use super::GraphElements;

#[derive(Debug, Deserialize, Serialize, Clone, Object)]
pub struct UpdateMessage {
    #[serde(default)]
    pub add: Option<GraphElements>,
    
    #[serde(default)]
    pub update: Option<GraphElements>,
    
    #[serde(default)]
    pub delete: Option<GraphElements>,
}

impl UpdateMessage {
    /// Create a new empty UpdateMessage
    pub fn new() -> Self {
        Self {
            add: None,
            update: None,
            delete: None,
        }
    }
    
    /// Create an UpdateMessage with add operations
    pub fn with_add(mut self, elements: GraphElements) -> Self {
        self.add = Some(elements);
        self
    }
    
    /// Create an UpdateMessage with update operations
    pub fn with_update(mut self, elements: GraphElements) -> Self {
        self.update = Some(elements);
        self
    }
    
    /// Create an UpdateMessage with delete operations
    pub fn with_delete(mut self, elements: GraphElements) -> Self {
        self.delete = Some(elements);
        self
    }
    
    /// Check if there are any operations to perform
    pub fn has_operations(&self) -> bool {
        self.add.is_some() || self.update.is_some() || self.delete.is_some()
    }
    
    /// Check if the message is empty (no add, update, or delete operations)
    pub fn is_empty(&self) -> bool {
        !self.has_operations()
    }
}