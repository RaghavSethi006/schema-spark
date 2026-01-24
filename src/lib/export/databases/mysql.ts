import { DatabaseAdapter, DatabaseTypeMapping } from '../types';

const typeMapping: DatabaseTypeMapping = {
  string: 'VARCHAR(255)',
  text: 'TEXT',
  int: 'INT',
  float: 'FLOAT',
  boolean: 'TINYINT(1)',
  date: 'DATE',
  datetime: 'DATETIME',
  uuid: 'CHAR(36)',
  json: 'JSON',
  decimal: 'DECIMAL(10,2)',
  bigint: 'BIGINT',
  binary: 'BLOB',
};

export const mysqlAdapter: DatabaseAdapter = {
  id: 'mysql',
  name: 'MySQL',
  description: 'Popular open-source relational database',
  typeMapping,
  features: {
    uuid: false, // No native UUID, use CHAR(36)
    json: true,
    arrays: false,
    triggers: true,
    checkConstraints: true, // MySQL 8.0.16+
    generatedColumns: true,
  },

  getAutoIncrementSyntax: (columnName: string) => `${columnName} INT AUTO_INCREMENT`,
  
  getUuidDefault: () => 'UUID()',
  
  getPrimaryKeySyntax: (columns: string[]) => 
    `PRIMARY KEY (${columns.join(', ')})`,
  
  getForeignKeySyntax: (column, refTable, refColumn, onDelete = 'CASCADE', onUpdate = 'CASCADE') =>
    `FOREIGN KEY (${column}) REFERENCES ${refTable}(${refColumn}) ON DELETE ${onDelete} ON UPDATE ${onUpdate}`,
  
  getCreateTableSyntax: (tableName, columns, constraints) => {
    const allDefs = [...columns, ...constraints].filter(Boolean);
    return `CREATE TABLE IF NOT EXISTS ${tableName} (\n  ${allDefs.join(',\n  ')}\n) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`;
  },
  
  getIndexSyntax: (indexName, tableName, columns, unique = false) =>
    `CREATE ${unique ? 'UNIQUE ' : ''}INDEX ${indexName} ON ${tableName} (${columns.join(', ')});`,
  
  getCheckConstraintSyntax: (name, condition) =>
    `CONSTRAINT ${name} CHECK (${condition})`,
  
  getTriggerSyntax: (name, table, timing, event, body) => `
DELIMITER //
CREATE TRIGGER ${name}
  ${timing} ${event} ON ${table}
  FOR EACH ROW
BEGIN
  ${body}
END//
DELIMITER ;`,
  
  escapeIdentifier: (name) => `\`${name}\``,
  
  escapeString: (value) => `'${value.replace(/'/g, "\\'")}'`,
};
