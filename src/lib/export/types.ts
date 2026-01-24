// Export System Types - Plugin-Based Architecture
import { ERSchema, Entity, Field, Relationship, RelationshipRule, FieldType } from '../schema';

// ============= Database Adapters =============

export type DatabaseType = 
  | 'postgresql'
  | 'mysql'
  | 'sqlite'
  | 'oracle'
  | 'sqlserver'
  | 'mariadb'
  | 'db2';

export interface DatabaseTypeMapping {
  string: string;
  text: string;
  int: string;
  float: string;
  boolean: string;
  date: string;
  datetime: string;
  uuid: string;
  json: string;
  decimal: string;
  bigint: string;
  binary: string;
}

export interface DatabaseAdapter {
  id: DatabaseType;
  name: string;
  description: string;
  typeMapping: DatabaseTypeMapping;
  features: {
    uuid: boolean;
    json: boolean;
    arrays: boolean;
    triggers: boolean;
    checkConstraints: boolean;
    generatedColumns: boolean;
  };
  
  // SQL generation methods
  getAutoIncrementSyntax: (columnName: string) => string;
  getUuidDefault: () => string;
  getPrimaryKeySyntax: (columns: string[]) => string;
  getForeignKeySyntax: (column: string, refTable: string, refColumn: string, onDelete?: string, onUpdate?: string) => string;
  getCreateTableSyntax: (tableName: string, columns: string[], constraints: string[]) => string;
  getIndexSyntax: (indexName: string, tableName: string, columns: string[], unique?: boolean) => string;
  getCheckConstraintSyntax: (name: string, condition: string) => string;
  getTriggerSyntax?: (name: string, table: string, timing: string, event: string, body: string) => string;
  escapeIdentifier: (name: string) => string;
  escapeString: (value: string) => string;
}

// ============= Framework Adapters =============

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

export interface GeneratedFile {
  path: string;
  content: string;
  type: 'model' | 'schema' | 'controller' | 'service' | 'migration' | 'config' | 'test' | 'readme' | 'other';
}

export interface FrameworkAdapter {
  id: FrameworkType;
  name: string;
  language: LanguageType;
  description: string;
  features: FrameworkFeatures;
  supportedDatabases: DatabaseType[];
  
  // Code generation methods
  generateProject: (schema: ERSchema, dbAdapter: DatabaseAdapter, config: ExportConfig) => GeneratedFile[];
  getModelFileName: (entityName: string) => string;
  getControllerFileName: (entityName: string) => string;
  getSchemaFileName: (entityName: string) => string;
  getServiceFileName: (entityName: string) => string;
  getMigrationFileName: (entityName: string, timestamp: number) => string;
}

// ============= Export Configuration =============

export interface ExportConfig {
  framework: FrameworkType;
  database: DatabaseType;
  projectName: string;
  
  // Code generation options
  generateControllers: boolean;
  generateServices: boolean;
  generateTests: boolean;
  generateMigrations: boolean;
  generateDocker: boolean;
  generateReadme: boolean;
  
  // Naming conventions
  namingConvention: 'snake_case' | 'camelCase' | 'PascalCase';
  tablePluralizer: boolean;
  
  // Auth & boilerplate
  includeAuthBoilerplate: boolean;
  includeCorsSetup: boolean;
  includeSwaggerDocs: boolean;
  
  // Advanced
  customTemplates?: Record<string, string>;
}

export interface ExportPreset {
  id: string;
  name: string;
  description: string;
  config: ExportConfig;
  isBuiltIn: boolean;
  createdAt: string;
}

// ============= Export Pipeline =============

export interface ExportPipeline {
  // Pipeline steps
  validate: (schema: ERSchema) => ValidationResult;
  transform: (schema: ERSchema) => CanonicalIR;
  generate: (ir: CanonicalIR, frameworkAdapter: FrameworkAdapter, dbAdapter: DatabaseAdapter, config: ExportConfig) => GeneratedFile[];
  package: (files: GeneratedFile[], config: ExportConfig) => Promise<Blob>;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

// Canonical Intermediate Representation
export interface CanonicalIR {
  projectName: string;
  version: string;
  tables: IRTable[];
  relationships: IRRelationship[];
  enums: IREnum[];
}

export interface IRTable {
  name: string;
  originalName: string;
  columns: IRColumn[];
  primaryKey: string[];
  indexes: IRIndex[];
  constraints: IRConstraint[];
}

export interface IRColumn {
  name: string;
  originalName: string;
  type: FieldType;
  nullable: boolean;
  primaryKey: boolean;
  unique: boolean;
  autoIncrement: boolean;
  default?: string;
  references?: {
    table: string;
    column: string;
    onDelete?: string;
    onUpdate?: string;
  };
}

export interface IRIndex {
  name: string;
  columns: string[];
  unique: boolean;
}

export interface IRConstraint {
  name: string;
  type: 'check' | 'unique' | 'foreign_key';
  definition: string;
}

export interface IRRelationship {
  name: string;
  type: 'one-to-one' | 'one-to-many' | 'many-to-many';
  sourceTable: string;
  targetTable: string;
  junctionTable?: string;
  sourceColumns: string[];
  targetColumns: string[];
  rules: IRRule[];
}

export interface IRRule {
  name: string;
  trigger: 'before_create' | 'after_create' | 'before_update' | 'after_update' | 'before_delete' | 'after_delete';
  condition?: string;
  action: string;
}

export interface IREnum {
  name: string;
  values: string[];
}

// ============= Utility Types =============

export const toSnakeCase = (str: string): string => {
  return str
    .replace(/([A-Z])/g, '_$1')
    .toLowerCase()
    .replace(/^_/, '')
    .replace(/\s+/g, '_')
    .replace(/_+/g, '_');
};

export const toPascalCase = (str: string): string => {
  return str
    .split(/[\s_-]+/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join('');
};

export const toCamelCase = (str: string): string => {
  const pascal = toPascalCase(str);
  return pascal.charAt(0).toLowerCase() + pascal.slice(1);
};

export const pluralize = (str: string): string => {
  if (str.endsWith('y')) {
    return str.slice(0, -1) + 'ies';
  }
  if (str.endsWith('s') || str.endsWith('x') || str.endsWith('ch') || str.endsWith('sh')) {
    return str + 'es';
  }
  return str + 's';
};
