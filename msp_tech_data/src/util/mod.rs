use crate::{
    api::graph::KeyIdPair,
    model::{Edge, UpdateMessage},
};
use uuid::Uuid;

/// Generate UUIDs for any missing IDs in the update message
pub fn generate_ids(
    message: &UpdateMessage,
    transaction_id: &str,
    timestamp: i64,
) -> (UpdateMessage, Vec<KeyIdPair>) {
    let mut new_message = message.clone();
    let mut key_id_pairs = Vec::new();

    // Process adds
    if let Some(add) = &mut new_message.add {
        // Create a mapping of temporary IDs to real IDs
        let mut tmp_id_map: std::collections::HashMap<String, String> = std::collections::HashMap::new();

        // First pass: Generate IDs for vertices and build the mapping
        if let Some(vertices) = &mut add.vertices {
            for vertex in vertices.iter_mut() {
                // Generate an ID if it's missing
                if vertex.id.trim().is_empty() {
                    vertex.id = Uuid::now_v7().to_string();
                    // the entity id could be a tmp one, input msg must be correctly ordered
                    vertex.entity_id = if vertex.is_entity {
                        vertex.id.clone()
                    } else {
                        // check the map first
                        if tmp_id_map.contains_key(&vertex.entity_id) {
                            tmp_id_map.get(&vertex.entity_id).unwrap().clone()
                        } else {
                            vertex.entity_id.clone()
                        }
                    };
                    vertex.transaction_id = transaction_id.to_string();
                    vertex.timestamp = timestamp;
                }

                // Add to the mapping if it has a temporary ID
                if !vertex.tmp_id.trim().is_empty() {
                    tmp_id_map.insert(vertex.tmp_id.clone(), vertex.id.clone());
                    if vertex.is_entity {
                        key_id_pairs.push(KeyIdPair {
                            key: vertex.business_key.clone(),
                            id: vertex.id.clone(),
                        });
                    }
                }
            }
        }

        // Second pass: Update edge references
        if let Some(edges) = &mut add.edges {
            for edge in edges.iter_mut() {
                // Generate an ID if it's missing
                if edge.id.trim().is_empty() {
                    edge.id = Uuid::now_v7().to_string();
                    edge.entity_id = edge.id.clone();
                    edge.transaction_id = transaction_id.to_string();
                    edge.timestamp = timestamp;
                }

                // Replace temporary IDs with real IDs
                if let Some(from_id) = tmp_id_map.get(&edge.from) {
                    edge.from = from_id.clone();
                    edge.from_entity_id = from_id.clone();
                }

                if let Some(to_id) = tmp_id_map.get(&edge.to) {
                    edge.to = to_id.clone();
                    edge.to_entity_id = to_id.clone();
                }
            }
        }
    }

    // Also collect key-id pairs for updates (if the vertex is an entity)
    // for completeness of the result for new and existing vertices
    // so the client doesn't have to track which ones are which
    if let Some(update) = &mut new_message.update {
        if let Some(vertices) = &mut update.vertices {
            for vertex in vertices.iter_mut() {
                if vertex.is_entity {
                    key_id_pairs.push(KeyIdPair {
                        key: vertex.business_key.clone(),
                        id: vertex.id.clone(),
                    });
                }
            }
        }
    }

     // Also collect key-id pairs for deletes (if the vertex is an entity)
    // for completeness of the result for new and existing vertices
    // so the client doesn't have to track which ones are which
    if let Some(delete) = &mut new_message.delete {
        if let Some(vertices) = &mut delete.vertices {
            for vertex in vertices.iter_mut() {
                if vertex.is_entity {
                    key_id_pairs.push(KeyIdPair {
                        key: vertex.business_key.clone(),
                        id: vertex.id.clone(),
                    });
                }
            }
        }
    }

    (new_message, key_id_pairs)
}

/// Create a supersededBy edge
pub fn create_superseded_by_edge(
    from_id: &str,
    to_id: &str,
    entity_id: &str,
    view_type: &str,
) -> Edge {
    Edge::create_superseded_by(from_id, to_id, entity_id, view_type)
}
