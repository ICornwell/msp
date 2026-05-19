mod repository;
mod query;
pub mod setup;

// Export the repository for easier import
pub use repository::GraphRepository;
pub use query::read_data;
