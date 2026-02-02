// Cassandra Wide-Column Database Adapter
import { WideColumnDatabaseAdapter, DatabaseFeatures, DatabaseTypeMapping } from '../../types/databases';

const cassandraFeatures: DatabaseFeatures = {
  uuid: true,
  json: false,
  arrays: true, // Collections
  triggers: true,
  checkConstraints: false,
  generatedColumns: false,
  transactions: true, // Lightweight
  foreignKeys: false,
  indexes: true, // Secondary indexes
  fullTextSearch: false,
};

const cassandraTypeMapping: DatabaseTypeMapping = {
  string: 'text',
  text: 'text',
  int: 'int',
  float: 'float',
  boolean: 'boolean',
  date: 'date',
  datetime: 'timestamp',
  uuid: 'uuid',
  json: 'text', // Store as JSON string
  decimal: 'decimal',
  bigint: 'bigint',
  binary: 'blob',
};

export const cassandraAdapter: WideColumnDatabaseAdapter = {
  id: 'cassandra',
  name: 'Apache Cassandra',
  description: 'Distributed wide-column store',
  category: 'wide-column',
  features: cassandraFeatures,
  typeMapping: cassandraTypeMapping,
  
  getKeyspaceSyntax(name, replication) {
    const repStr = Object.entries(replication)
      .map(([k, v]) => `'${k}': ${typeof v === 'string' ? `'${v}'` : v}`)
      .join(', ');
    return `CREATE KEYSPACE IF NOT EXISTS ${name}
  WITH replication = {${repStr}};`;
  },
  
  getTableSyntax(name, columns, partitionKey, clusteringKey = []) {
    const colDefs = Object.entries(columns)
      .map(([col, type]) => `  ${col} ${type}`)
      .join(',\n');
    
    let pkDef: string;
    if (clusteringKey.length > 0) {
      pkDef = `((${partitionKey.join(', ')}), ${clusteringKey.join(', ')})`;
    } else if (partitionKey.length > 1) {
      pkDef = `(${partitionKey.join(', ')})`;
    } else {
      pkDef = partitionKey[0];
    }
    
    return `CREATE TABLE IF NOT EXISTS ${name} (
${colDefs},
  PRIMARY KEY ${pkDef}
);`;
  },
  
  getUDTSyntax(name, fields) {
    const fieldDefs = Object.entries(fields)
      .map(([field, type]) => `  ${field} ${type}`)
      .join(',\n');
    
    return `CREATE TYPE IF NOT EXISTS ${name} (
${fieldDefs}
);`;
  },
};
