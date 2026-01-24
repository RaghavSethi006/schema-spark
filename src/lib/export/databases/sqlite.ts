import { DatabaseAdapter, DatabaseTypeMapping } from '../types';

const typeMapping: DatabaseTypeMapping = {
  string: 'TEXT',
  text: 'TEXT',
  int: 'INTEGER',
  float: 'REAL',
  boolean: 'INTEGER',
  date: 'TEXT',
  datetime: 'TEXT',
  uuid: 'TEXT',
  json: 'TEXT',
  decimal: 'REAL',
  bigint: 'INTEGER',
  binary: 'BLOB',
};

export const sqliteAdapter: DatabaseAdapter = {
  id: 'sqlite',
  name: 'SQLite',
  description: 'Lightweight file-based database',
  typeMapping,
  features: {
    uuid: false,
    json: false, // Limited JSON support
    arrays: false,
    triggers: true,
    checkConstraints: true,
    generatedColumns: true, // SQLite 3.31+
  },

  getAutoIncrementSyntax: (columnName: string) => `${columnName} INTEGER PRIMARY KEY AUTOINCREMENT`,
  
  getUuidDefault: () => "(lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6))))",
  
  getPrimaryKeySyntax: (columns: string[]) => 
    `PRIMARY KEY (${columns.join(', ')})`,
  
  getForeignKeySyntax: (column, refTable, refColumn, onDelete = 'CASCADE', onUpdate = 'CASCADE') =>
    `FOREIGN KEY (${column}) REFERENCES ${refTable}(${refColumn}) ON DELETE ${onDelete} ON UPDATE ${onUpdate}`,
  
  getCreateTableSyntax: (tableName, columns, constraints) => {
    const allDefs = [...columns, ...constraints].filter(Boolean);
    return `CREATE TABLE IF NOT EXISTS ${tableName} (\n  ${allDefs.join(',\n  ')}\n);`;
  },
  
  getIndexSyntax: (indexName, tableName, columns, unique = false) =>
    `CREATE ${unique ? 'UNIQUE ' : ''}INDEX IF NOT EXISTS ${indexName} ON ${tableName} (${columns.join(', ')});`,
  
  getCheckConstraintSyntax: (name, condition) =>
    `CHECK (${condition})`, // SQLite doesn't name CHECK constraints
  
  getTriggerSyntax: (name, table, timing, event, body) => `
CREATE TRIGGER IF NOT EXISTS ${name}
  ${timing} ${event} ON ${table}
BEGIN
  ${body}
END;`,
  
  escapeIdentifier: (name) => `"${name}"`,
  
  escapeString: (value) => `'${value.replace(/'/g, "''")}'`,
};
