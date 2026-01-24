import { DatabaseAdapter, DatabaseTypeMapping } from '../types';

const typeMapping: DatabaseTypeMapping = {
  string: 'VARCHAR(255)',
  text: 'TEXT',
  int: 'INTEGER',
  float: 'REAL',
  boolean: 'BOOLEAN',
  date: 'DATE',
  datetime: 'TIMESTAMP',
  uuid: 'UUID',
  json: 'JSONB',
  decimal: 'DECIMAL(10,2)',
  bigint: 'BIGINT',
  binary: 'BYTEA',
};

export const postgresqlAdapter: DatabaseAdapter = {
  id: 'postgresql',
  name: 'PostgreSQL',
  description: 'Advanced open-source relational database with JSON support',
  typeMapping,
  features: {
    uuid: true,
    json: true,
    arrays: true,
    triggers: true,
    checkConstraints: true,
    generatedColumns: true,
  },

  getAutoIncrementSyntax: (columnName: string) => `${columnName} SERIAL`,
  
  getUuidDefault: () => 'gen_random_uuid()',
  
  getPrimaryKeySyntax: (columns: string[]) => 
    `PRIMARY KEY (${columns.join(', ')})`,
  
  getForeignKeySyntax: (column, refTable, refColumn, onDelete = 'CASCADE', onUpdate = 'CASCADE') =>
    `FOREIGN KEY (${column}) REFERENCES ${refTable}(${refColumn}) ON DELETE ${onDelete} ON UPDATE ${onUpdate}`,
  
  getCreateTableSyntax: (tableName, columns, constraints) => {
    const allDefs = [...columns, ...constraints].filter(Boolean);
    return `CREATE TABLE IF NOT EXISTS ${tableName} (\n  ${allDefs.join(',\n  ')}\n);`;
  },
  
  getIndexSyntax: (indexName, tableName, columns, unique = false) =>
    `CREATE ${unique ? 'UNIQUE ' : ''}INDEX ${indexName} ON ${tableName} (${columns.join(', ')});`,
  
  getCheckConstraintSyntax: (name, condition) =>
    `CONSTRAINT ${name} CHECK (${condition})`,
  
  getTriggerSyntax: (name, table, timing, event, body) => `
CREATE OR REPLACE FUNCTION ${name}_func()
RETURNS TRIGGER AS $$
BEGIN
  ${body}
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ${name}
  ${timing} ${event} ON ${table}
  FOR EACH ROW
  EXECUTE FUNCTION ${name}_func();`,
  
  escapeIdentifier: (name) => `"${name}"`,
  
  escapeString: (value) => `'${value.replace(/'/g, "''")}'`,
};
