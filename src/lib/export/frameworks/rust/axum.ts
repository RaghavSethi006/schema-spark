// Axum Framework Adapter (Rust)
import { FrameworkAdapter, FrameworkFeatures, ORMType } from '../../types/frameworks';
import { DatabaseType, AnyDatabaseAdapter } from '../../types/databases';
import { ExportConfig } from '../../types/config';
import { GeneratedFile, toPascalCase, toSnakeCase } from '../../types/core';
import { ERSchema } from '../../../schema';

const axumFeatures: FrameworkFeatures = {
  orm: 'SQLx / SeaORM',
  migrations: true,
  validation: true,
  authentication: true,
  swagger: true,
  graphql: true,
  testing: true,
  docker: true,
};

export const axumAdapter: FrameworkAdapter = {
  id: 'axum',
  name: 'Axum',
  language: 'rust',
  description: 'Ergonomic and modular web framework built with Tokio, Tower, and Hyper',
  features: axumFeatures,
  supportedDatabases: ['postgresql', 'mysql', 'sqlite'] as DatabaseType[],
  supportedORMs: ['sqlx', 'sea-orm'] as ORMType[],
  
  generateProject(schema: ERSchema, dbAdapter: AnyDatabaseAdapter, config: ExportConfig): GeneratedFile[] {
    const files: GeneratedFile[] = [];
    const projectName = toSnakeCase(config.projectName);
    const base = projectName;
    
    // Cargo.toml
    files.push({
      path: `${base}/Cargo.toml`,
      content: generateCargoToml(projectName),
      type: 'config',
    });
    
    // Main entry
    files.push({
      path: `${base}/src/main.rs`,
      content: generateMainRs(schema, config),
      type: 'config',
    });
    
    // App state
    files.push({
      path: `${base}/src/state.rs`,
      content: generateStateModule(),
      type: 'config',
    });
    
    // Error handling
    files.push({
      path: `${base}/src/error.rs`,
      content: generateErrorModule(),
      type: 'other',
    });
    
    // Models
    schema.entities.forEach(entity => {
      files.push({
        path: `${base}/src/models/${toSnakeCase(entity.name)}.rs`,
        content: generateModel(entity, config),
        type: 'model',
      });
    });
    
    files.push({
      path: `${base}/src/models/mod.rs`,
      content: schema.entities.map(e => `pub mod ${toSnakeCase(e.name)};`).join('\n') +
        '\n\n' + schema.entities.map(e => `pub use ${toSnakeCase(e.name)}::*;`).join('\n'),
      type: 'model',
    });
    
    // Routes
    files.push({
      path: `${base}/src/routes/mod.rs`,
      content: generateRoutesModule(schema, config),
      type: 'controller',
    });
    
    schema.entities.forEach(entity => {
      files.push({
        path: `${base}/src/routes/${toSnakeCase(entity.name)}.rs`,
        content: generateRouteHandler(entity, config),
        type: 'controller',
      });
    });
    
    // README
    if (config.generateReadme) {
      files.push({
        path: `${base}/README.md`,
        content: generateReadme(projectName),
        type: 'readme',
      });
    }
    
    return files;
  },
  
  getModelFileName: (entityName) => `${toSnakeCase(entityName)}.rs`,
  getControllerFileName: (entityName) => `${toSnakeCase(entityName)}.rs`,
  getSchemaFileName: (entityName) => `${toSnakeCase(entityName)}.rs`,
  getServiceFileName: (entityName) => `${toSnakeCase(entityName)}_service.rs`,
  getMigrationFileName: (entityName, timestamp) => `${timestamp}_create_${toSnakeCase(entityName)}.sql`,
};

function generateCargoToml(projectName: string): string {
  return `[package]
name = "${projectName}"
version = "0.1.0"
edition = "2021"

[dependencies]
# Web framework
axum = { version = "0.7", features = ["macros"] }
tokio = { version = "1", features = ["full"] }
tower = "0.4"
tower-http = { version = "0.5", features = ["cors", "trace"] }

# Database
sqlx = { version = "0.7", features = ["runtime-tokio", "postgres", "uuid", "chrono"] }

# Serialization
serde = { version = "1", features = ["derive"] }
serde_json = "1"

# Types
uuid = { version = "1", features = ["v4", "serde"] }
chrono = { version = "0.4", features = ["serde"] }

# Config & logging
dotenvy = "0.15"
tracing = "0.1"
tracing-subscriber = { version = "0.3", features = ["env-filter"] }

# Error handling
thiserror = "2"
anyhow = "1"
`;
}

function generateMainRs(schema: ERSchema, config: ExportConfig): string {
  return `use axum::Router;
use sqlx::postgres::PgPoolOptions;
use std::net::SocketAddr;
use tower_http::cors::CorsLayer;
use tower_http::trace::TraceLayer;
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

mod error;
mod models;
mod routes;
mod state;

use state::AppState;

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    // Initialize logging
    tracing_subscriber::registry()
        .with(tracing_subscriber::EnvFilter::try_from_default_env()
            .unwrap_or_else(|_| "info".into()))
        .with(tracing_subscriber::fmt::layer())
        .init();

    dotenvy::dotenv().ok();
    
    let database_url = std::env::var("DATABASE_URL")
        .expect("DATABASE_URL must be set");

    let pool = PgPoolOptions::new()
        .max_connections(5)
        .connect(&database_url)
        .await?;

    let state = AppState::new(pool);

    let app = Router::new()
        .merge(routes::api_routes())
        .with_state(state)
        .layer(CorsLayer::permissive())
        .layer(TraceLayer::new_for_http());

    let addr = SocketAddr::from(([127, 0, 0, 1], 3000));
    tracing::info!("Listening on {}", addr);

    let listener = tokio::net::TcpListener::bind(addr).await?;
    axum::serve(listener, app).await?;

    Ok(())
}
`;
}

function generateStateModule(): string {
  return `use sqlx::PgPool;

#[derive(Clone)]
pub struct AppState {
    pub pool: PgPool,
}

impl AppState {
    pub fn new(pool: PgPool) -> Self {
        Self { pool }
    }
}
`;
}

function generateErrorModule(): string {
  return `use axum::{
    http::StatusCode,
    response::{IntoResponse, Response},
    Json,
};
use serde_json::json;

#[derive(Debug)]
pub enum AppError {
    Database(sqlx::Error),
    NotFound(String),
    BadRequest(String),
    Internal(String),
}

impl IntoResponse for AppError {
    fn into_response(self) -> Response {
        let (status, message) = match self {
            AppError::Database(e) => (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()),
            AppError::NotFound(msg) => (StatusCode::NOT_FOUND, msg),
            AppError::BadRequest(msg) => (StatusCode::BAD_REQUEST, msg),
            AppError::Internal(msg) => (StatusCode::INTERNAL_SERVER_ERROR, msg),
        };

        (status, Json(json!({ "error": message }))).into_response()
    }
}

impl From<sqlx::Error> for AppError {
    fn from(err: sqlx::Error) -> Self {
        AppError::Database(err)
    }
}
`;
}

function generateModel(entity: any, config: ExportConfig): string {
  const name = toPascalCase(entity.name);
  
  const fields = entity.fields.map((f: any) => {
    const rustType = mapToRustType(f.type, f.isNullable);
    return `    pub ${toSnakeCase(f.name)}: ${rustType},`;
  }).join('\n');

  return `use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct ${name} {
${fields}
}

#[derive(Debug, Deserialize)]
pub struct Create${name} {
${entity.fields.filter((f: any) => !f.isPrimaryKey).map((f: any) => {
  const rustType = mapToRustType(f.type, f.isNullable);
  return `    pub ${toSnakeCase(f.name)}: ${rustType},`;
}).join('\n')}
}

#[derive(Debug, Deserialize)]
pub struct Update${name} {
${entity.fields.filter((f: any) => !f.isPrimaryKey).map((f: any) => {
  return `    pub ${toSnakeCase(f.name)}: Option<${mapToRustType(f.type, false)}>,`;
}).join('\n')}
}
`;
}

function generateRoutesModule(schema: ERSchema, config: ExportConfig): string {
  const imports = schema.entities.map(e => 
    `mod ${toSnakeCase(e.name)};`
  ).join('\n');
  
  const routes = schema.entities.map(e => {
    const name = toSnakeCase(e.name);
    return `        .nest("/${name}s", ${name}::routes())`;
  }).join('\n');

  return `use axum::Router;
use crate::state::AppState;

${imports}

pub fn api_routes() -> Router<AppState> {
    Router::new()
${routes}
}
`;
}

function generateRouteHandler(entity: any, config: ExportConfig): string {
  const name = toPascalCase(entity.name);
  const snakeName = toSnakeCase(entity.name);
  const tableName = config.tablePluralizer ? `${snakeName}s` : snakeName;

  return `use axum::{
    extract::{Path, State},
    routing::{get, post},
    Json, Router,
};
use uuid::Uuid;

use crate::error::AppError;
use crate::models::${snakeName}::{${name}, Create${name}, Update${name}};
use crate::state::AppState;

pub fn routes() -> Router<AppState> {
    Router::new()
        .route("/", get(list).post(create))
        .route("/:id", get(show).put(update).delete(destroy))
}

async fn list(State(state): State<AppState>) -> Result<Json<Vec<${name}>>, AppError> {
    let items = sqlx::query_as::<_, ${name}>("SELECT * FROM ${tableName}")
        .fetch_all(&state.pool)
        .await?;
    Ok(Json(items))
}

async fn show(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
) -> Result<Json<${name}>, AppError> {
    let item = sqlx::query_as::<_, ${name}>("SELECT * FROM ${tableName} WHERE id = $1")
        .bind(id)
        .fetch_optional(&state.pool)
        .await?
        .ok_or(AppError::NotFound("${name} not found".to_string()))?;
    Ok(Json(item))
}

async fn create(
    State(state): State<AppState>,
    Json(input): Json<Create${name}>,
) -> Result<Json<${name}>, AppError> {
    let id = Uuid::new_v4();
    
    sqlx::query("INSERT INTO ${tableName} (id${entity.fields.filter((f: any) => !f.isPrimaryKey).map((f: any) => `, ${toSnakeCase(f.name)}`).join('')}) VALUES ($1${entity.fields.filter((f: any) => !f.isPrimaryKey).map((_: any, i: number) => `, $${i + 2}`).join('')})")
        .bind(id)
${entity.fields.filter((f: any) => !f.isPrimaryKey).map((f: any) => `        .bind(&input.${toSnakeCase(f.name)})`).join('\n')}
        .execute(&state.pool)
        .await?;

    let item = sqlx::query_as::<_, ${name}>("SELECT * FROM ${tableName} WHERE id = $1")
        .bind(id)
        .fetch_one(&state.pool)
        .await?;

    Ok(Json(item))
}

async fn update(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
    Json(_input): Json<Update${name}>,
) -> Result<Json<${name}>, AppError> {
    // Update logic here
    let item = sqlx::query_as::<_, ${name}>("SELECT * FROM ${tableName} WHERE id = $1")
        .bind(id)
        .fetch_optional(&state.pool)
        .await?
        .ok_or(AppError::NotFound("${name} not found".to_string()))?;
    Ok(Json(item))
}

async fn destroy(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
) -> Result<(), AppError> {
    sqlx::query("DELETE FROM ${tableName} WHERE id = $1")
        .bind(id)
        .execute(&state.pool)
        .await?;
    Ok(())
}
`;
}

function generateReadme(projectName: string): string {
  return `# ${projectName}

A Rust API built with Axum.

## Setup

\`\`\`bash
# Set environment
cp .env.example .env

# Run
cargo run
\`\`\`

Server runs at \`http://localhost:3000\`.
`;
}

function mapToRustType(type: string, nullable: boolean): string {
  const mapping: Record<string, string> = {
    string: 'String',
    text: 'String',
    int: 'i32',
    integer: 'i32',
    float: 'f64',
    boolean: 'bool',
    date: 'chrono::NaiveDate',
    datetime: 'DateTime<Utc>',
    uuid: 'Uuid',
    json: 'serde_json::Value',
    decimal: 'rust_decimal::Decimal',
    bigint: 'i64',
  };
  const rustType = mapping[type] || 'String';
  return nullable ? `Option<${rustType}>` : rustType;
}
