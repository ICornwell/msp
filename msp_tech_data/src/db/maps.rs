use crate::model::{Edge, Vertex};

pub fn vertex_from_row(row: &tokio_postgres::Row) -> Vertex {
    let business_key = row
        .get::<usize, Option<String>>(9)
        .unwrap_or_default()
        .trim_end()
        .to_string();
    let alternate_key = row
        .get::<usize, Option<String>>(10)
        .unwrap_or_default()
        .trim_end()
        .to_string();

    Vertex {
        id: row.get::<usize, String>(1).trim_end().to_string(),
        tmp_id: "".to_string(),      // used for inbound updates only
        original_id: row.get::<usize, String>(2).trim_end().to_string(),
        entity_id: row.get::<usize, String>(3).trim_end().to_string(),
        transaction_id: row.get::<usize, String>(4).trim_end().to_string(),
        label: row.get::<usize, String>(5).trim_end().to_string(),
        is_entity: row.get::<usize, bool>(6),
        view_type: row.get::<usize, String>(7).trim_end().to_string(),
        timestamp: row.get(8),
        business_key,
        alternate_key,
        content: row.get(11),
        view_managed_edges: Vec::new(),
    }
} 

pub fn edge_from_row(row: &tokio_postgres::Row) -> Edge {
    Edge {
        id: row.get::<usize, String>(1).trim_end().to_string(),
        entity_id: row.get::<usize, String>(3).trim_end().to_string(),
        transaction_id: row.get::<usize, String>(4).trim_end().to_string(),
        label: row.get::<usize, String>(5).trim_end().to_string(),
        view_type: row.get::<usize, String>(7).trim_end().to_string(),
        from: row.get::<usize, String>(12).trim_end().to_string(),
        to: row.get::<usize, String>(13).trim_end().to_string(),
        from_entity_id: row.get::<usize, String>(12).trim_end().to_string(),
        to_entity_id: row.get::<usize, String>(13).trim_end().to_string(),
        timestamp: row.get(8),
        content: row.get(11),
    }
}