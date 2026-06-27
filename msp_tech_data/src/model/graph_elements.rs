use serde::{Deserialize, Serialize};
use poem_openapi::Object;
use super::{Vertex, Edge};

#[derive(Debug, Deserialize, Serialize, Clone, Default, Object)]
pub struct GraphElements {
    #[serde(default)]
    pub vertices: Option<Vec<Vertex>>,
    
    #[serde(default)]
    pub edges: Option<Vec<Edge>>,
}

impl GraphElements {
    /// Create a new empty GraphElements instance
    pub fn new() -> Self {
        Self::default()
    }
    
    /// Create GraphElements with vertices
    pub fn with_vertices(mut self, vertices: Vec<Vertex>) -> Self {
        self.vertices = Some(vertices);
        self
    }
    
    /// Create GraphElements with edges
    pub fn with_edges(mut self, edges: Vec<Edge>) -> Self {
        self.edges = Some(edges);
        self
    }
    
    /// Add a vertex to the GraphElements
    pub fn add_vertex(&mut self, vertex: Vertex) {
        if let Some(vertices) = &mut self.vertices {
            vertices.push(vertex);
        } else {
            self.vertices = Some(vec![vertex]);
        }
    }
    
    /// Add an edge to the GraphElements
    pub fn add_edge(&mut self, edge: Edge) {
        if let Some(edges) = &mut self.edges {
            edges.push(edge);
        } else {
            self.edges = Some(vec![edge]);
        }
    }
    
    /// Check if there are any vertices
    pub fn has_vertices(&self) -> bool {
        self.vertices.as_ref().map_or(false, |v| !v.is_empty())
    }
    
    /// Check if there are any edges
    pub fn has_edges(&self) -> bool {
        self.edges.as_ref().map_or(false, |e| !e.is_empty())
    }
    
    /// Check if there are no vertices and no edges
    pub fn is_empty(&self) -> bool {
        !self.has_vertices() && !self.has_edges()
    }
    
    /// Get the number of vertices
    pub fn vertex_count(&self) -> usize {
        self.vertices.as_ref().map_or(0, |v| v.len())
    }
    
    /// Get the number of edges
    pub fn edge_count(&self) -> usize {
        self.edges.as_ref().map_or(0, |e| e.len())
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    #[test]
    fn graph_elements_builder_and_adders_work() {
        let v = Vertex::new("Product".to_string(), "default".to_string(), json!({"name":"P"}));
        let e = Edge::new(
            "relatedTo".to_string(),
            "default".to_string(),
            v.id.clone(),
            "to-1".to_string(),
            json!({}),
        );

        let mut g = GraphElements::new().with_vertices(vec![v.clone()]).with_edges(vec![e.clone()]);
        assert!(g.has_vertices());
        assert!(g.has_edges());
        assert!(!g.is_empty());
        assert_eq!(1, g.vertex_count());
        assert_eq!(1, g.edge_count());

        g.add_vertex(v);
        g.add_edge(e);
        assert_eq!(2, g.vertex_count());
        assert_eq!(2, g.edge_count());
    }

    #[test]
    fn graph_elements_empty_checks_are_consistent() {
        let mut g = GraphElements::new();
        assert!(g.is_empty());
        assert!(!g.has_vertices());
        assert!(!g.has_edges());
        assert_eq!(0, g.vertex_count());
        assert_eq!(0, g.edge_count());

        g.add_vertex(Vertex::new("Product".to_string(), "default".to_string(), json!({})));
        assert!(g.has_vertices());
        assert!(!g.is_empty());
    }
}