// NoSQL Database Adapters Index
import { DocumentDatabaseAdapter, KeyValueDatabaseAdapter, GraphDatabaseAdapter, WideColumnDatabaseAdapter, NoSQLAdapter, NoSQLDatabaseType } from '../../types/databases';
import { mongodbAdapter } from './mongodb';
import { redisAdapter } from './redis';
import { neo4jAdapter } from './neo4j';
import { cassandraAdapter } from './cassandra';

// Type-safe registry
const documentAdapters: Record<string, DocumentDatabaseAdapter> = {
  mongodb: mongodbAdapter,
  couchdb: { ...mongodbAdapter, id: 'couchdb', name: 'CouchDB', description: 'Apache CouchDB document store' },
};

const keyValueAdapters: Record<string, KeyValueDatabaseAdapter> = {
  redis: redisAdapter,
  dynamodb: { 
    ...redisAdapter, 
    id: 'dynamodb', 
    name: 'Amazon DynamoDB', 
    description: 'AWS managed key-value and document database',
    getKeyPattern: (entity, idField) => `${entity}#${idField}`,
  },
};

const graphAdapters: Record<string, GraphDatabaseAdapter> = {
  neo4j: neo4jAdapter,
  arangodb: { 
    ...neo4jAdapter, 
    id: 'arangodb', 
    name: 'ArangoDB', 
    description: 'Multi-model database with graph capabilities' 
  },
};

const wideColumnAdapters: Record<string, WideColumnDatabaseAdapter> = {
  cassandra: cassandraAdapter,
  scylladb: { 
    ...cassandraAdapter, 
    id: 'scylladb', 
    name: 'ScyllaDB', 
    description: 'High-performance Cassandra-compatible database' 
  },
};

export const getNoSQLAdapter = (type: NoSQLDatabaseType): NoSQLAdapter => {
  const all = { 
    ...documentAdapters, 
    ...keyValueAdapters, 
    ...graphAdapters, 
    ...wideColumnAdapters 
  };
  const adapter = all[type];
  if (!adapter) {
    throw new Error(`Unknown NoSQL database type: ${type}`);
  }
  return adapter;
};

export const getDocumentAdapter = (type: string): DocumentDatabaseAdapter => {
  const adapter = documentAdapters[type];
  if (!adapter) throw new Error(`Unknown document database: ${type}`);
  return adapter;
};

export const getKeyValueAdapter = (type: string): KeyValueDatabaseAdapter => {
  const adapter = keyValueAdapters[type];
  if (!adapter) throw new Error(`Unknown key-value database: ${type}`);
  return adapter;
};

export const getGraphAdapter = (type: string): GraphDatabaseAdapter => {
  const adapter = graphAdapters[type];
  if (!adapter) throw new Error(`Unknown graph database: ${type}`);
  return adapter;
};

export const getWideColumnAdapter = (type: string): WideColumnDatabaseAdapter => {
  const adapter = wideColumnAdapters[type];
  if (!adapter) throw new Error(`Unknown wide-column database: ${type}`);
  return adapter;
};

export const getAllNoSQLAdapters = () => ({
  document: Object.values(documentAdapters),
  keyValue: Object.values(keyValueAdapters),
  graph: Object.values(graphAdapters),
  wideColumn: Object.values(wideColumnAdapters),
});

export { mongodbAdapter, redisAdapter, neo4jAdapter, cassandraAdapter };
