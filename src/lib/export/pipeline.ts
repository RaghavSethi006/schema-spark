import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { ERSchema, Entity, Relationship } from '../schema';
import { materializeRelationshipsForExport } from './materialize';
import { 
  ExportConfig, 
  ExportPreset, 
  ValidationResult, 
  CanonicalIR, 
  IRTable, 
  IRColumn, 
  IRRelationship,
  GeneratedFile,
  toSnakeCase,
  DatabaseAdapter,
  FrameworkAdapter,
} from './types';
import { getDatabaseAdapter } from './databases';
import { getFrameworkAdapter } from './frameworks';

// Default export configuration
export const defaultExportConfig: ExportConfig = {
  platform: 'nodejs',
  framework: 'fastapi',
  database: 'postgresql',
  databaseCategory: 'relational',
  projectName: 'my-project',
  generateControllers: true,
  generateServices: true,
  generateTests: false,
  generateMigrations: false,
  generateDocker: false,
  generateReadme: true,
  namingConvention: 'snake_case',
  tablePluralizer: true,
  includeAuthBoilerplate: false,
  includeCorsSetup: true,
  includeSwaggerDocs: true,
};

// Built-in presets
export const builtInPresets: ExportPreset[] = [
  {
    id: 'fastapi-postgres',
    name: 'FastAPI + PostgreSQL',
    description: 'Modern Python API with PostgreSQL database',
    config: { ...defaultExportConfig, framework: 'fastapi', database: 'postgresql' },
    isBuiltIn: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'django-postgres',
    name: 'Django + PostgreSQL',
    description: 'Full-featured Python framework with admin panel',
    config: { ...defaultExportConfig, framework: 'django', database: 'postgresql' },
    isBuiltIn: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'nestjs-postgres',
    name: 'NestJS + PostgreSQL',
    description: 'Enterprise TypeScript API with TypeORM',
    config: { ...defaultExportConfig, framework: 'nestjs', database: 'postgresql' },
    isBuiltIn: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'spring-mysql',
    name: 'Spring Boot + MySQL',
    description: 'Enterprise Java API with JPA',
    config: { ...defaultExportConfig, framework: 'spring-boot', database: 'mysql' },
    isBuiltIn: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'express-sqlite',
    name: 'Express + SQLite',
    description: 'Lightweight Node.js API with Prisma',
    config: { ...defaultExportConfig, framework: 'express', database: 'sqlite' },
    isBuiltIn: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'electron-sqlite',
    name: 'Electron + SQLite',
    description: 'Desktop app with embedded SQLite database',
    config: { ...defaultExportConfig, platform: 'electron', framework: 'express', database: 'sqlite', electronConfig: { contextIsolation: true, generateIPC: true, generatePreload: true } },
    isBuiltIn: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'express-mongodb',
    name: 'Express + MongoDB',
    description: 'Node.js API with document database',
    config: { ...defaultExportConfig, framework: 'express', database: 'mongodb', databaseCategory: 'document', noSQLConfig: { embeddingStrategy: 'hybrid', denormalize: false } },
    isBuiltIn: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'gin-postgres',
    name: 'Gin + PostgreSQL',
    description: 'Fast Go API with GORM',
    config: { ...defaultExportConfig, framework: 'gin', database: 'postgresql' },
    isBuiltIn: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'axum-postgres',
    name: 'Axum + PostgreSQL',
    description: 'Async Rust API with SQLx',
    config: { ...defaultExportConfig, framework: 'axum', database: 'postgresql' },
    isBuiltIn: true,
    createdAt: new Date().toISOString(),
  },
];

// Validation
export const validateSchema = (schema: ERSchema): ValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!schema.entities || schema.entities.length === 0) {
    errors.push('Schema must have at least one entity');
  }

  schema.entities.forEach(entity => {
    if (!entity.name || entity.name.trim() === '') {
      errors.push(`Entity has no name`);
    }
    if (!entity.fields || entity.fields.length === 0) {
      warnings.push(`Entity "${entity.name}" has no fields`);
    }
    const hasPrimaryKey = entity.fields.some(f => f.isPrimaryKey);
    if (!hasPrimaryKey) {
      warnings.push(`Entity "${entity.name}" has no primary key`);
    }
  });

  return { valid: errors.length === 0, errors, warnings };
};

/** Resolve an entity ID to the IR table name (respects pluralizer) */
const entityIdToTableName = (schema: ERSchema, entityId: string, config: ExportConfig): string => {
  const entity = schema.entities.find(e => e.id === entityId);
  if (!entity) return entityId;
  const base = toSnakeCase(entity.name);
  return config.tablePluralizer ? base + 's' : base;
};

/** Resolve a field ID to the IR column name */
const fieldIdToColumnName = (schema: ERSchema, entityId: string, fieldId: string): string => {
  const entity = schema.entities.find(e => e.id === entityId);
  if (!entity) return fieldId;
  const field = entity.fields.find(f => f.id === fieldId);
  return field ? toSnakeCase(field.name) : fieldId;
};

// Transform schema to canonical IR
export const transformToIR = (schema: ERSchema, config: ExportConfig): CanonicalIR => {
  const tables: IRTable[] = schema.entities.map(entity => ({
    name: config.tablePluralizer ? toSnakeCase(entity.name) + 's' : toSnakeCase(entity.name),
    originalName: entity.name,
    columns: entity.fields.map(field => ({
      name: toSnakeCase(field.name),
      originalName: field.name,
      type: field.type,
      nullable: field.isNullable,
      primaryKey: field.isPrimaryKey,
      unique: field.isUnique,
      autoIncrement: field.isPrimaryKey && (field.type === 'integer' || field.type === 'uuid'),
      default: field.defaultValue,
    })),
    primaryKey: entity.fields.filter(f => f.isPrimaryKey).map(f => toSnakeCase(f.name)),
    indexes: [],
    constraints: [],
  }));

  // Legacy relations — resolve IDs to proper IR table/column names
  const legacyRelationships: IRRelationship[] = (schema.relations || []).map(rel => ({
    name: `legacy_${entityIdToTableName(schema, rel.sourceEntityId, config)}_${entityIdToTableName(schema, rel.targetEntityId, config)}`,
    type: rel.type,
    sourceTable: entityIdToTableName(schema, rel.sourceEntityId, config),
    targetTable: entityIdToTableName(schema, rel.targetEntityId, config),
    sourceColumns: [fieldIdToColumnName(schema, rel.sourceEntityId, rel.sourceFieldId)],
    targetColumns: [fieldIdToColumnName(schema, rel.targetEntityId, rel.targetFieldId)],
    rules: [],
  }));

  // Materialize first-class relationship diamonds (mutates `tables` to inject FK columns for 1:1/1:N)
  const materialized = materializeRelationshipsForExport(schema, config, tables);

  // Deduplicate: if a legacy relation matches a materialized one (same source+target tables), skip the legacy
  const materializedKeys = new Set(
    materialized.relationships.map(r => `${r.sourceTable}:${r.targetTable}`)
  );
  const dedupedLegacy = legacyRelationships.filter(
    r => !materializedKeys.has(`${r.sourceTable}:${r.targetTable}`) &&
         !materializedKeys.has(`${r.targetTable}:${r.sourceTable}`)
  );

  return {
    projectName: config.projectName,
    version: schema.version,
    tables: [...tables, ...materialized.tables],
    relationships: [...dedupedLegacy, ...materialized.relationships],
    enums: [],
  };
};

// Generate project files
export const generateProjectFiles = (
  schema: ERSchema,
  config: ExportConfig
): GeneratedFile[] => {
  const ir = transformToIR(schema, config);
  const dbAdapter = getDatabaseAdapter(config.database);
  const frameworkAdapter = getFrameworkAdapter(config.framework);
  
  return frameworkAdapter.generateProject(schema, dbAdapter, config);
};

// Export as ZIP
export const exportProjectAsZip = async (
  schema: ERSchema,
  config: ExportConfig
): Promise<{ success: boolean; message: string; errors?: string[] }> => {
  const validation = validateSchema(schema);
  
  if (!validation.valid) {
    return {
      success: false,
      message: 'Schema validation failed',
      errors: validation.errors,
    };
  }

  try {
    const files = generateProjectFiles(schema, config);
    const zip = new JSZip();

    files.forEach(file => {
      zip.file(file.path, file.content);
    });

    // Add schema.json
    zip.file(`${toSnakeCase(config.projectName)}/schema.json`, JSON.stringify(schema, null, 2));

    const blob = await zip.generateAsync({ type: 'blob' });
    const fileName = `${toSnakeCase(config.projectName)}-${config.framework}-${config.database}.zip`;
    
    saveAs(blob, fileName);

    return {
      success: true,
      message: `Successfully exported ${files.length} files`,
    };
  } catch (error) {
    return {
      success: false,
      message: 'Failed to generate export',
      errors: [error instanceof Error ? error.message : 'Unknown error'],
    };
  }
};
