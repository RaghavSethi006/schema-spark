// Framework Adapter Types
import { ERSchema } from '../../schema';
import { GeneratedFile } from './core';
import { DatabaseAdapter, DatabaseType, NoSQLAdapter, AnyDatabaseAdapter } from './databases';
import { ExportConfig } from './config';

// ============= Language Types =============

export type LanguageType = 
  | 'python'
  | 'typescript'
  | 'javascript'
  | 'java'
  | 'csharp'
  | 'php'
  | 'ruby'
  | 'rust'
  | 'go'
  | 'elixir';

// ============= Framework Types =============

export type FrameworkType =
  // Python
  | 'fastapi'
  | 'django'
  | 'flask'
  // JavaScript/TypeScript
  | 'express'
  | 'nestjs'
  | 'fastify'
  | 'nextjs'
  | 'koa'
  // Java
  | 'spring-boot'
  // C#
  | 'aspnet-core'
  // PHP
  | 'laravel'
  // Ruby
  | 'rails'
  // Rust
  | 'actix'
  | 'axum'
  | 'rocket'
  // Go
  | 'gin'
  // Elixir
  | 'phoenix';

// ============= ORM Types =============

export type ORMType =
  // Python
  | 'sqlalchemy'
  | 'django-orm'
  | 'tortoise'
  // JavaScript/TypeScript
  | 'prisma'
  | 'typeorm'
  | 'sequelize'
  | 'knex'
  | 'drizzle'
  | 'mongoose'
  // Java
  | 'jpa'
  | 'hibernate'
  // C#
  | 'ef-core'
  // PHP
  | 'eloquent'
  // Ruby
  | 'activerecord'
  // Rust
  | 'sqlx'
  | 'diesel'
  | 'sea-orm'
  // Go
  | 'gorm'
  // Elixir
  | 'ecto';

// ============= Framework Features =============

export interface FrameworkFeatures {
  orm: string;
  migrations: boolean;
  validation: boolean;
  authentication: boolean;
  swagger: boolean;
  graphql: boolean;
  testing: boolean;
  docker: boolean;
}

// ============= Framework Adapter =============

export interface FrameworkAdapter {
  id: FrameworkType;
  name: string;
  language: LanguageType;
  description: string;
  features: FrameworkFeatures;
  supportedDatabases: DatabaseType[];
  supportedORMs: ORMType[];
  
  // Code generation methods
  generateProject: (schema: ERSchema, dbAdapter: AnyDatabaseAdapter, config: ExportConfig) => GeneratedFile[];
  getModelFileName: (entityName: string) => string;
  getControllerFileName: (entityName: string) => string;
  getSchemaFileName: (entityName: string) => string;
  getServiceFileName: (entityName: string) => string;
  getMigrationFileName: (entityName: string, timestamp: number) => string;
}
