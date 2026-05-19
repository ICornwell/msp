use config::{Config, ConfigError, Environment, File};
use serde::Deserialize;
use std::path::Path;

#[derive(Debug, Deserialize, Clone)]
pub struct DatabaseConfig {
    pub host: String,
    pub name: String,
    pub user: String,
    pub password: String,
    pub pool_size: u32,
}

#[derive(Debug, Deserialize, Clone)]
pub struct ServerConfig {
    pub host: String,
    pub port: u16,
}

#[derive(Debug, Deserialize, Clone)]
pub struct AppConfig {
    pub database: DatabaseConfig,
    pub server: ServerConfig,
}

impl AppConfig {
    pub fn load() -> Result<Self, ConfigError> {
        let config_dir = std::env::var("CONFIG_DIR").unwrap_or_else(|_| "config".to_string());

        let config = Config::builder()
            // Start with default settings
            .add_source(File::from(Path::new(&config_dir).join("default.toml")).required(false))
            // Add environment-specific settings
            .add_source(
                File::from(Path::new(&config_dir).join(format!(
                    "{}.toml",
                    std::env::var("ENVIRONMENT").unwrap_or_else(|_| "development".to_string())
                )))
                .required(false),
            )
            // Add settings from environment variables (with a prefix of DOCGRAPH)
            // E.g., `DOCGRAPH_DATABASE_HOST=localhost` would set `database.host`
            .add_source(Environment::with_prefix("DOCGRAPH").separator("_"))
            .build()?;

        // Deserialize the configuration into our strongly typed config struct
        config.try_deserialize()
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::env;

    #[test]
    fn test_config_from_env() {
        unsafe {
            env::set_var("DOCGRAPH_DATABASE_HOST", "testhost");
            env::set_var("DOCGRAPH_DATABASE_NAME", "testdb");
            env::set_var("DOCGRAPH_DATABASE_USER", "testuser");
            env::set_var("DOCGRAPH_DATABASE_PASSWORD", "testpass");
            env::set_var("DOCGRAPH_SERVER_PORT", "8080");
        }

        // Make sure it doesn't error when loading from environment variables
        let config = AppConfig::load().expect("Failed to load configuration");
        assert_eq!(config.database.host, "testhost");
        assert_eq!(config.database.name, "testdb");

        // Clean up
        unsafe {
            env::remove_var("DOCGRAPH_DATABASE_HOST");
            env::remove_var("DOCGRAPH_DATABASE_NAME");
            env::remove_var("DOCGRAPH_DATABASE_USER");
            env::remove_var("DOCGRAPH_DATABASE_PASSWORD");
            env::remove_var("DOCGRAPH_SERVER_PORT");
        }
    }
}
