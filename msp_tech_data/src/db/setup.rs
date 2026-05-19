use deadpool_postgres::Pool;
use crate::error::Result;
use super::GraphRepository;

/// Set up the database schema and initial structure
pub async fn ensure_db_setup(pool: &Pool) -> Result<()> {
    let repo = GraphRepository::new(pool.clone());
    repo.ensure_schema().await
}