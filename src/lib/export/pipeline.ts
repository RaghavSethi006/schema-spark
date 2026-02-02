import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { ERSchema, Entity, Relationship } from '../schema';
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
  framework: 'fastapi',
  database: 'postgresql',
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

  const relationships: IRRelationship[] = (schema.relationships || []).map(rel => ({
    name: rel.name,
    type: rel.type,
    sourceTable: rel.connections[0]?.entityId || '',
    targetTable: rel.connections[1]?.entityId || '',
    sourceColumns: rel.connections[0] ? [rel.connections[0].fieldId] : [],
    targetColumns: rel.connections[1] ? [rel.connections[1].fieldId] : [],
    rules: rel.rules.map(r => ({
      name: r.name,
      trigger: r.trigger as any,
      action: r.action.type,
    })),
  }));

  return {
    projectName: config.projectName,
    version: schema.version,
    tables,
    relationships,
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
