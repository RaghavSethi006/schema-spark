// Core Export Types - Canonical IR and Base Interfaces
import { FieldType } from '../../schema';

// ============= Canonical Intermediate Representation =============

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

// ============= Generated File =============

export interface GeneratedFile {
  path: string;
  content: string;
  type: 'model' | 'schema' | 'controller' | 'service' | 'migration' | 'config' | 'test' | 'readme' | 'other';
}

// ============= Validation =============

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

// ============= Utility Functions =============

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

export const toKebabCase = (str: string): string => {
  return str
    .replace(/([A-Z])/g, '-$1')
    .toLowerCase()
    .replace(/^-/, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
};
