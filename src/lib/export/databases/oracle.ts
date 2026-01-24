import { DatabaseAdapter, DatabaseTypeMapping } from '../types';

const typeMapping: DatabaseTypeMapping = {
  string: 'VARCHAR2(255)',
  text: 'CLOB',
  int: 'NUMBER(10)',
  float: 'BINARY_FLOAT',
  boolean: 'NUMBER(1)',
  date: 'DATE',
  datetime: 'TIMESTAMP',
  uuid: 'RAW(16)',
  json: 'CLOB', // Oracle 21c+ has native JSON
  decimal: 'NUMBER(10,2)',
  bigint: 'NUMBER(19)',
  binary: 'BLOB',
};

export const oracleAdapter: DatabaseAdapter = {
  id: 'oracle',
  name: 'Oracle Database',
  description: 'Enterprise-grade relational database',
  typeMapping,
  features: {
    uuid: true, // RAW(16) with SYS_GUID()
    json: true, // Oracle 21c+ has native JSON
    arrays: false,
    triggers: true,
    checkConstraints: true,
    generatedColumns: true,
  },

  getAutoIncrementSyntax: (columnName: string) => `${columnName} NUMBER GENERATED ALWAYS AS IDENTITY`,
  
  getUuidDefault: () => 'SYS_GUID()',
  
  getPrimaryKeySyntax: (columns: string[]) => 
    `PRIMARY KEY (${columns.join(', ')})`,
  
  getForeignKeySyntax: (column, refTable, refColumn, onDelete = 'CASCADE', onUpdate = 'NO ACTION') =>
    `FOREIGN KEY (${column}) REFERENCES ${refTable}(${refColumn}) ON DELETE ${onDelete}`, // Oracle doesn't support ON UPDATE
  
  getCreateTableSyntax: (tableName, columns, constraints) => {
    const allDefs = [...columns, ...constraints].filter(Boolean);
    return `CREATE TABLE ${tableName} (\n  ${allDefs.join(',\n  ')}\n);`;
  },
  
  getIndexSyntax: (indexName, tableName, columns, unique = false) =>
    `CREATE ${unique ? 'UNIQUE ' : ''}INDEX ${indexName} ON ${tableName} (${columns.join(', ')});`,
  
  getCheckConstraintSyntax: (name, condition) =>
    `CONSTRAINT ${name} CHECK (${condition})`,
  
  getTriggerSyntax: (name, table, timing, event, body) => `
CREATE OR REPLACE TRIGGER ${name}
  ${timing} ${event} ON ${table}
  FOR EACH ROW
BEGIN
  ${body}
END;
/`,
  
  escapeIdentifier: (name) => `"${name.toUpperCase()}"`,
  
  escapeString: (value) => `'${value.replace(/'/g, "''")}'`,
};
