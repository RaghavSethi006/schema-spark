// Export System Types - Backward Compatible
import { ERSchema } from '../schema';

// ============= Database Types =============

export type DatabaseType = 
  | 'postgresql' | 'mysql' | 'sqlite' | 'oracle' | 'sqlserver' | 'mariadb' | 'db2'
  | 'mongodb' | 'couchdb' | 'redis' | 'dynamodb' | 'cassandra' | 'scylladb' | 'neo4j' | 'arangodb';

export type DatabaseCategory = 'relational' | 'document' | 'key-value' | 'wide-column' | 'graph';

export interface DatabaseTypeMapping {
  string: string; text: string; int: string; float: string; boolean: string;
  date: string; datetime: string; uuid: string; json: string; decimal: string; bigint: string; binary: string;
  [key: string]: string;
}

export interface DatabaseFeatures {
  uuid: boolean; json: boolean; arrays: boolean; triggers: boolean; checkConstraints: boolean; generatedColumns: boolean;
  transactions?: boolean; foreignKeys?: boolean; indexes?: boolean; fullTextSearch?: boolean;
}

export interface DatabaseAdapter {
  id: DatabaseType; name: string; description: string;
  typeMapping: DatabaseTypeMapping; features: DatabaseFeatures;
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

// ============= Framework Types =============

export type FrameworkType = 'fastapi' | 'django' | 'flask' | 'express' | 'nestjs' | 'fastify' | 'nextjs' | 'koa'
  | 'spring-boot' | 'aspnet-core' | 'laravel' | 'rails' | 'actix' | 'axum' | 'rocket' | 'gin' | 'phoenix';

export type LanguageType = 'python' | 'typescript' | 'javascript' | 'java' | 'csharp' | 'php' | 'ruby' | 'rust' | 'go' | 'elixir';

export type PlatformType = 'nodejs' | 'electron' | 'browser' | 'serverless';

export interface FrameworkFeatures {
  orm: string; migrations: boolean; validation: boolean; authentication: boolean;
  swagger: boolean; graphql: boolean; testing: boolean; docker: boolean;
}

export interface GeneratedFile {
  path: string; content: string;
  type: 'model' | 'schema' | 'controller' | 'service' | 'migration' | 'config' | 'test' | 'readme' | 'other';
}

export interface FrameworkAdapter {
  id: FrameworkType; name: string; language: LanguageType; description: string;
  features: FrameworkFeatures; supportedDatabases: DatabaseType[];
  generateProject: (schema: ERSchema, dbAdapter: DatabaseAdapter, config: ExportConfig) => GeneratedFile[];
  getModelFileName: (entityName: string) => string;
  getControllerFileName: (entityName: string) => string;
  getSchemaFileName: (entityName: string) => string;
  getServiceFileName: (entityName: string) => string;
  getMigrationFileName: (entityName: string, timestamp: number) => string;
}

// ============= Export Configuration =============

export interface ExportConfig {
  framework: FrameworkType; database: DatabaseType; projectName: string;
  platform?: PlatformType; databaseCategory?: DatabaseCategory;
  generateControllers: boolean; generateServices: boolean; generateTests: boolean;
  generateMigrations: boolean; generateDocker: boolean; generateReadme: boolean;
  namingConvention: 'snake_case' | 'camelCase' | 'PascalCase';
  tablePluralizer: boolean; includeAuthBoilerplate: boolean; includeCorsSetup: boolean; includeSwaggerDocs: boolean;
  customTemplates?: Record<string, string>;
  electronConfig?: { contextIsolation: boolean; generateIPC: boolean; generatePreload: boolean; };
  noSQLConfig?: { embeddingStrategy: 'embed' | 'reference' | 'hybrid'; denormalize: boolean; };
  orm?: string;
}

export interface ExportPreset {
  id: string; name: string; description: string; config: ExportConfig; isBuiltIn: boolean; createdAt: string;
}

// ============= IR Types =============

export interface CanonicalIR { projectName: string; version: string; tables: IRTable[]; relationships: IRRelationship[]; enums: IREnum[]; }
export interface IRTable { name: string; originalName: string; columns: IRColumn[]; primaryKey: string[]; indexes: IRIndex[]; constraints: IRConstraint[]; }
export interface IRColumn { name: string; originalName: string; type: string; nullable: boolean; primaryKey: boolean; unique: boolean; autoIncrement: boolean; default?: string; references?: { table: string; column: string; onDelete?: string; onUpdate?: string; }; }
export interface IRIndex { name: string; columns: string[]; unique: boolean; }
export interface IRConstraint { name: string; type: 'check' | 'unique' | 'foreign_key'; definition: string; }
export interface IRRelationship { name: string; type: 'one-to-one' | 'one-to-many' | 'many-to-many'; sourceTable: string; targetTable: string; junctionTable?: string; sourceColumns: string[]; targetColumns: string[]; rules: IRRule[]; }
export interface IRRule { name: string; trigger: 'before_create' | 'after_create' | 'before_update' | 'after_update' | 'before_delete' | 'after_delete'; condition?: string; action: string; }
export interface IREnum { name: string; values: string[]; }
export interface ValidationResult { valid: boolean; errors: string[]; warnings: string[]; }

// ============= Utility Functions =============

export const toSnakeCase = (str: string): string => str.replace(/([A-Z])/g, '_$1').toLowerCase().replace(/^_/, '').replace(/\s+/g, '_').replace(/_+/g, '_');
export const toPascalCase = (str: string): string => str.split(/[\s_-]+/).map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join('');
export const toCamelCase = (str: string): string => { const p = toPascalCase(str); return p.charAt(0).toLowerCase() + p.slice(1); };
export const pluralize = (str: string): string => str.endsWith('y') ? str.slice(0, -1) + 'ies' : (str.endsWith('s') || str.endsWith('x') || str.endsWith('ch') || str.endsWith('sh')) ? str + 'es' : str + 's';
export const toKebabCase = (str: string): string => str.replace(/([A-Z])/g, '-$1').toLowerCase().replace(/^-/, '').replace(/\s+/g, '-').replace(/-+/g, '-');
