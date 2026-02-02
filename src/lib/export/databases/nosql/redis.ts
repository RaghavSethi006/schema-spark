// Redis Key-Value Database Adapter
import { KeyValueDatabaseAdapter, DatabaseFeatures, DatabaseTypeMapping } from '../../types/databases';

const redisFeatures: DatabaseFeatures = {
  uuid: false,
  json: true, // RedisJSON
  arrays: true, // Lists
  triggers: false,
  checkConstraints: false,
  generatedColumns: false,
  transactions: true, // MULTI/EXEC
  foreignKeys: false,
  indexes: true, // RediSearch
  fullTextSearch: true, // RediSearch
};

const redisTypeMapping: DatabaseTypeMapping = {
  string: 'string',
  text: 'string',
  int: 'number',
  float: 'number',
  boolean: 'string', // "true"/"false"
  date: 'string', // ISO format
  datetime: 'string',
  uuid: 'string',
  json: 'json', // RedisJSON
  decimal: 'string',
  bigint: 'string',
  binary: 'buffer',
};

export const redisAdapter: KeyValueDatabaseAdapter = {
  id: 'redis',
  name: 'Redis',
  description: 'In-memory key-value store',
  category: 'key-value',
  features: redisFeatures,
  typeMapping: redisTypeMapping,
  
  getKeyPattern(entity, idField) {
    return `${entity.toLowerCase()}:{${idField}}`;
  },
  
  getHashSetSyntax(key, fields) {
    const args = Object.entries(fields)
      .map(([k, v]) => `"${k}" "${v}"`)
      .join(' ');
    return `HSET ${key} ${args}`;
  },
  
  getListSyntax(key) {
    return `LPUSH ${key} <value>`;
  },
  
  getSetSyntax(key) {
    return `SADD ${key} <member>`;
  },
  
  getTTLSyntax(key, seconds) {
    return `EXPIRE ${key} ${seconds}`;
  },
};
