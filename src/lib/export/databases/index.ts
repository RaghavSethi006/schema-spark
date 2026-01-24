import { DatabaseAdapter, DatabaseType } from '../types';
import { postgresqlAdapter } from './postgresql';
import { mysqlAdapter } from './mysql';
import { sqliteAdapter } from './sqlite';
import { oracleAdapter } from './oracle';
import { sqlserverAdapter } from './sqlserver';

// Database adapter registry
const databaseAdapters: Record<DatabaseType, DatabaseAdapter> = {
  postgresql: postgresqlAdapter,
  mysql: mysqlAdapter,
  sqlite: sqliteAdapter,
  oracle: oracleAdapter,
  sqlserver: sqlserverAdapter,
  mariadb: { 
    ...mysqlAdapter, 
    id: 'mariadb', 
    name: 'MariaDB',
    description: 'MySQL-compatible open-source database' 
  },
  db2: {
    ...oracleAdapter,
    id: 'db2',
    name: 'IBM Db2',
    description: 'Enterprise database from IBM',
    typeMapping: {
      ...oracleAdapter.typeMapping,
      string: 'VARCHAR(255)',
      text: 'CLOB',
      datetime: 'TIMESTAMP',
      uuid: 'CHAR(36)',
    },
    getAutoIncrementSyntax: (columnName: string) => `${columnName} INT GENERATED ALWAYS AS IDENTITY`,
    escapeIdentifier: (name) => `"${name}"`,
  },
};

export const getDatabaseAdapter = (type: DatabaseType): DatabaseAdapter => {
  const adapter = databaseAdapters[type];
  if (!adapter) {
    throw new Error(`Unknown database type: ${type}`);
  }
  return adapter;
};

export const getAllDatabaseAdapters = (): DatabaseAdapter[] => {
  return Object.values(databaseAdapters);
};

export const getSupportedDatabases = (): Array<{ id: DatabaseType; name: string; description: string }> => {
  return Object.values(databaseAdapters).map(({ id, name, description }) => ({
    id,
    name,
    description,
  }));
};

export { postgresqlAdapter, mysqlAdapter, sqliteAdapter, oracleAdapter, sqlserverAdapter };
