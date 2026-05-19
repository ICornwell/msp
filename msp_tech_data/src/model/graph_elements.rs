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