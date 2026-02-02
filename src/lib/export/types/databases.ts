// Database Adapter Types - SQL and NoSQL
import { FieldType } from '../../schema';

// ============= Database Categories =============

export type DatabaseCategory = 'relational' | 'document' | 'key-value' | 'wide-column' | 'graph';

// ============= Relational Database Types =============

export type RelationalDatabaseType = 
  | 'postgresql'
  | 'mysql'
  | 'sqlite'
  | 'oracle'
  | 'sqlserver'
  | 'mariadb'
  | 'db2';

// ============= NoSQL Database Types =============

export type DocumentDatabaseType = 'mongodb' | 'couchdb';
export type KeyValueDatabaseType = 'redis' | 'dynamodb';
export type WideColumnDatabaseType = 'cassandra' | 'scylladb';
export type GraphDatabaseType = 'neo4j' | 'arangodb';

export type NoSQLDatabaseType = 
  | DocumentDatabaseType 
  | KeyValueDatabaseType 
  | WideColumnDatabaseType 
  | GraphDatabaseType;

export type DatabaseType = RelationalDatabaseType | NoSQLDatabaseType;

// ============= Type Mappings =============

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
  [key: string]: string;
}

// ============= Database Features =============

export interface DatabaseFeatures {
  uuid: boolean;
  json: boolean;
  arrays: boolean;
  triggers: boolean;
  checkConstraints: boolean;
  generatedColumns: boolean;
  transactions: boolean;
  foreignKeys: boolean;
  indexes: boolean;
  fullTextSearch: boolean;
}

// ============= Base Database Adapter =============

export interface BaseDatabaseAdapter {
  id: DatabaseType;
  name: string;
  description: string;
  category: DatabaseCategory;
  features: DatabaseFeatures;
  typeMapping: DatabaseTypeMapping;
}

// ============= SQL Database Adapter =============

export interface DatabaseAdapter extends BaseDatabaseAdapter {
  category: 'relational';
  
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

// ============= NoSQL Adapter Interfaces =============

export interface NoSQLAdapter extends BaseDatabaseAdapter {
  category: 'document' | 'key-value' | 'wide-column' | 'graph';
}

export interface DocumentDatabaseAdapter extends NoSQLAdapter {
  category: 'document';
  
  // Document-specific methods
  getCollectionDefinition: (name: string, schema: Record<string, any>) => string;
  getEmbeddedDocumentSyntax: (name: string, schema: Record<string, any>) => string;
  getReferenceFieldSyntax: (field: string, refCollection: string) => string;
  getIndexSyntax: (collection: string, fields: string[], options?: Record<string, any>) => string;
  getValidationSchema: (collection: string, schema: Record<string, any>) => string;
}

export interface KeyValueDatabaseAdapter extends NoSQLAdapter {
  category: 'key-value';
  
  // Key-value specific methods
  getKeyPattern: (entity: string, idField: string) => string;
  getHashSetSyntax: (key: string, fields: Record<string, string>) => string;
  getListSyntax: (key: string) => string;
  getSetSyntax: (key: string) => string;
  getTTLSyntax: (key: string, seconds: number) => string;
}

export interface GraphDatabaseAdapter extends NoSQLAdapter {
  category: 'graph';
  
  // Graph-specific methods
  getNodeDefinition: (label: string, properties: Record<string, string>) => string;
  getEdgeDefinition: (type: string, properties: Record<string, string>) => string;
  getRelationshipSyntax: (fromNode: string, toNode: string, relType: string, properties?: Record<string, any>) => string;
  getTraversalQuery: (startNode: string, relationship: string, depth?: number) => string;
}

export interface WideColumnDatabaseAdapter extends NoSQLAdapter {
  category: 'wide-column';
  
  // Wide-column specific methods
  getKeyspaceSyntax: (name: string, replication: Record<string, any>) => string;
  getTableSyntax: (name: string, columns: Record<string, string>, partitionKey: string[], clusteringKey?: string[]) => string;
  getUDTSyntax: (name: string, fields: Record<string, string>) => string;
}

// ============= Unified Adapter Type =============

export type AnyDatabaseAdapter = 
  | DatabaseAdapter 
  | DocumentDatabaseAdapter 
  | KeyValueDatabaseAdapter 
  | GraphDatabaseAdapter 
  | WideColumnDatabaseAdapter;
