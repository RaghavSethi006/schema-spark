import { DatabaseAdapter, DatabaseTypeMapping } from '../types';

const typeMapping: DatabaseTypeMapping = {
  string: 'NVARCHAR(255)',
  text: 'NVARCHAR(MAX)',
  int: 'INT',
  float: 'FLOAT',
  boolean: 'BIT',
  date: 'DATE',
  datetime: 'DATETIME2',
  uuid: 'UNIQUEIDENTIFIER',
  json: 'NVARCHAR(MAX)', // SQL Server 2016+ has JSON functions
  decimal: 'DECIMAL(10,2)',
  bigint: 'BIGINT',
  binary: 'VARBINARY(MAX)',
};

export const sqlserverAdapter: DatabaseAdapter = {
  id: 'sqlserver',
  name: 'Microsoft SQL Server',
  description: 'Enterprise database from Microsoft',
  typeMapping,
  features: {
    uuid: true,
    json: true, // Functions only, no native type
    arrays: false,
    triggers: true,
    checkConstraints: true,
    generatedColumns: true,
  },

  getAutoIncrementSyntax: (columnName: string) => `${columnName} INT IDENTITY(1,1)`,
  
  getUuidDefault: () => 'NEWID()',
  
  getPrimaryKeySyntax: (columns: string[]) => 
    `PRIMARY KEY (${columns.join(', ')})`,
  
  getForeignKeySyntax: (column, refTable, refColumn, onDelete = 'CASCADE', onUpdate = 'CASCADE') =>
    `FOREIGN KEY (${column}) REFERENCES ${refTable}(${refColumn}) ON DELETE ${onDelete} ON UPDATE ${onUpdate}`,
  
  getCreateTableSyntax: (tableName, columns, constraints) => {
    const allDefs = [...columns, ...constraints].filter(Boolean);
    return `IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='${tableName}' AND xtype='U')
CREATE TABLE ${tableName} (
  ${allDefs.join(',\n  ')}
);`;
  },
  
  getIndexSyntax: (indexName, tableName, columns, unique = false) =>
    `CREATE ${unique ? 'UNIQUE ' : ''}INDEX ${indexName} ON ${tableName} (${columns.join(', ')});`,
  
  getCheckConstraintSyntax: (name, condition) =>
    `CONSTRAINT ${name} CHECK (${condition})`,
  
  getTriggerSyntax: (name, table, timing, event, body) => `
CREATE OR ALTER TRIGGER ${name}
ON ${table}
${timing === 'BEFORE' ? 'INSTEAD OF' : 'AFTER'} ${event}
AS
BEGIN
  SET NOCOUNT ON;
  ${body}
END;`,
  
  escapeIdentifier: (name) => `[${name}]`,
  
  escapeString: (value) => `N'${value.replace(/'/g, "''")}'`,
};
