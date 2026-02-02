// Rocket Framework Adapter (Rust)
import { FrameworkAdapter, FrameworkFeatures, ORMType } from '../../types/frameworks';
import { DatabaseType, AnyDatabaseAdapter } from '../../types/databases';
import { ExportConfig } from '../../types/config';
import { GeneratedFile, toPascalCase, toSnakeCase } from '../../types/core';
import { ERSchema } from '../../../schema';

const rocketFeatures: FrameworkFeatures = {
  orm: 'Diesel / SQLx',
  migrations: true,
  validation: true,
  authentication: true,
  swagger: false,
  graphql: false,
  testing: true,
  docker: true,
};

export const rocketAdapter: FrameworkAdapter = {
  id: 'rocket',
  name: 'Rocket',
  language: 'rust',
  description: 'Web framework for Rust with focus on ease-of-use, expressibility, and speed',
  features: rocketFeatures,
  supportedDatabases: ['postgresql', 'mysql', 'sqlite'] as DatabaseType[],
  supportedORMs: ['diesel', 'sqlx'] as ORMType[],
  
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
    
    // Rocket.toml
    files.push({
      path: `${base}/Rocket.toml`,
      content: generateRocketToml(),
      type: 'config',
    });
    
    // Main
    files.push({
      path: `${base}/src/main.rs`,
      content: generateMainRs(schema, config),
      type: 'config',
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
      content: schema.entities.map(e => `pub mod ${toSnakeCase(e.name)};`).join('\n'),
      type: 'model',
    });
    
    // Routes
    schema.entities.forEach(entity => {
      files.push({
        path: `${base}/src/routes/${toSnakeCase(entity.name)}.rs`,
        content: generateRoutes(entity, config),
        type: 'controller',
      });
    });
    
    files.push({
      path: `${base}/src/routes/mod.rs`,
      content: schema.entities.map(e => `pub mod ${toSnakeCase(e.name)};`).join('\n'),
      type: 'controller',
    });
    
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
rocket = { version = "0.5", features = ["json"] }
rocket_db_pools = { version = "0.2", features = ["sqlx_postgres"] }
serde = { version = "1", features = ["derive"] }
serde_json = "1"
uuid = { version = "1", features = ["v4", "serde"] }
chrono = { version = "0.4", features = ["serde"] }
sqlx = { version = "0.7", features = ["runtime-tokio", "postgres", "uuid", "chrono"] }
`;
}

function generateRocketToml(): string {
  return `[default]
address = "127.0.0.1"
port = 8000

[default.databases.main]
url = "postgres://user:password@localhost/mydb"
`;
}

function generateMainRs(schema: ERSchema, config: ExportConfig): string {
  const mounts = schema.entities.map(e => {
    const name = toSnakeCase(e.name);
    return `        .mount("/${name}s", routes::${name}::routes())`;
  }).join('\n');

  return `#[macro_use] extern crate rocket;

use rocket_db_pools::Database;

mod models;
mod routes;

#[derive(Database)]
#[database("main")]
pub struct DbPool(sqlx::PgPool);

#[launch]
fn rocket() -> _ {
    rocket::build()
        .attach(DbPool::init())
${mounts}
}
`;
}

function generateModel(entity: any, config: ExportConfig): string {
  const name = toPascalCase(entity.name);
  
  return `use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;
use chrono::{DateTime, Utc};

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct ${name} {
${entity.fields.map((f: any) => {
  const rustType = mapToRustType(f.type, f.isNullable);
  return `    pub ${toSnakeCase(f.name)}: ${rustType},`;
}).join('\n')}
}

#[derive(Debug, Deserialize)]
pub struct Create${name} {
${entity.fields.filter((f: any) => !f.isPrimaryKey).map((f: any) => {
  const rustType = mapToRustType(f.type, f.isNullable);
  return `    pub ${toSnakeCase(f.name)}: ${rustType},`;
}).join('\n')}
}
`;
}

function generateRoutes(entity: any, config: ExportConfig): string {
  const name = toPascalCase(entity.name);
  const snakeName = toSnakeCase(entity.name);
  const tableName = config.tablePluralizer ? `${snakeName}s` : snakeName;

  return `use rocket::serde::json::Json;
use rocket_db_pools::Connection;
use uuid::Uuid;

use crate::DbPool;
use crate::models::${snakeName}::{${name}, Create${name}};

pub fn routes() -> Vec<rocket::Route> {
    routes![index, show, create, destroy]
}

#[get("/")]
async fn index(mut db: Connection<DbPool>) -> Json<Vec<${name}>> {
    let items = sqlx::query_as::<_, ${name}>("SELECT * FROM ${tableName}")
        .fetch_all(&mut **db)
        .await
        .unwrap_or_default();
    Json(items)
}

#[get("/<id>")]
async fn show(mut db: Connection<DbPool>, id: &str) -> Option<Json<${name}>> {
    let uuid = Uuid::parse_str(id).ok()?;
    sqlx::query_as::<_, ${name}>("SELECT * FROM ${tableName} WHERE id = $1")
        .bind(uuid)
        .fetch_optional(&mut **db)
        .await
        .ok()
        .flatten()
        .map(Json)
}

#[post("/", data = "<input>")]
async fn create(mut db: Connection<DbPool>, input: Json<Create${name}>) -> Json<${name}> {
    let id = Uuid::new_v4();
    // Insert and return
    todo!()
}

#[delete("/<id>")]
async fn destroy(mut db: Connection<DbPool>, id: &str) -> Option<()> {
    let uuid = Uuid::parse_str(id).ok()?;
    sqlx::query("DELETE FROM ${tableName} WHERE id = $1")
        .bind(uuid)
        .execute(&mut **db)
        .await
        .ok()?;
    Some(())
}
`;
}

function mapToRustType(type: string, nullable: boolean): string {
  const mapping: Record<string, string> = {
    string: 'String',
    text: 'String',
    int: 'i32',
    float: 'f64',
    boolean: 'bool',
    date: 'chrono::NaiveDate',
    datetime: 'DateTime<Utc>',
    uuid: 'Uuid',
    json: 'serde_json::Value',
  };
  const rustType = mapping[type] || 'String';
  return nullable ? `Option<${rustType}>` : rustType;
}
