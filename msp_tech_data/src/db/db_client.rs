use deadpool_postgres::{Client, Config as PgConfig, Pool, Runtime};
use tokio_postgres::{types::ToSql, Row};

use crate::{
    config::AppConfig,
    error::{DocGraphError, Result},
};

#[derive(Clone)]
pub struct DbClientManager {
    pool: Pool,
}

impl DbClientManager {
    pub fn from_pool(pool: Pool) -> Self {
        Self { pool }
    }

    pub fn from_config(config: &AppConfig) -> std::result::Result<Self, Box<dyn std::error::Error>> {
        let pg_config = PgConfig {
            host: Some(config.database.host.clone()),
            dbname: Some(config.database.name.clone()),
            user: Some(config.database.user.clone()),
            password: Some(config.database.password.clone()),
            application_name: Some("docgraph".to_string()),
            ..Default::default()
        };

        let pool = pg_config.create_pool(Some(Runtime::Tokio1), tokio_postgres::NoTls)?;
        Ok(Self { pool })
    }

    pub async fn get_client(&self) -> Result<DbClient> {
        let client = self.pool.get().await.map_err(DocGraphError::from)?;
        Ok(DbClient { client })
    }
}

pub struct DbClient {
    client: Client,
}

impl DbClient {
    pub async fn execute(
        &self,
        sql: &str,
        params: &[&(dyn ToSql + Sync)],
    ) -> Result<u64> {
        self.client
            .execute(sql, params)
            .await
            .map_err(DocGraphError::Database)
    }

    pub async fn query(
        &self,
        sql: &str,
        params: &[&(dyn ToSql + Sync)],
    ) -> Result<Vec<Row>> {
        self.client
            .query(sql, params)
            .await
            .map_err(DocGraphError::Database)
    }

    pub async fn batch_execute(&self, sql: &str) -> Result<()> {
        self.client
            .batch_execute(sql)
            .await
            .map_err(DocGraphError::Database)
    }

    pub async fn begin_transaction(&mut self) -> Result<DbTransaction<'_>> {
        let tx = self
            .client
            .transaction()
            .await
            .map_err(DocGraphError::Database)?;
        Ok(DbTransaction { tx })
    }
}

pub struct DbTransaction<'a> {
    tx: deadpool_postgres::Transaction<'a>,
}

impl DbTransaction<'_> {
    pub async fn execute(
        &self,
        sql: &str,
        params: &[&(dyn ToSql + Sync)],
    ) -> Result<u64> {
        self.tx
            .execute(sql, params)
            .await
            .map_err(DocGraphError::Database)
    }

    pub async fn query(
        &self,
        sql: &str,
        params: &[&(dyn ToSql + Sync)],
    ) -> Result<Vec<Row>> {
        self.tx
            .query(sql, params)
            .await
            .map_err(DocGraphError::Database)
    }

    pub async fn commit(self) -> Result<()> {
        self.tx.commit().await.map_err(DocGraphError::Database)
    }

    pub async fn rollback(self) -> Result<()> {
        self.tx.rollback().await.map_err(DocGraphError::Database)
    }
}