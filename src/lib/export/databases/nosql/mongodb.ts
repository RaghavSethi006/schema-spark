// MongoDB Document Database Adapter
import { DocumentDatabaseAdapter, DatabaseFeatures, DatabaseTypeMapping } from '../../types/databases';

const mongoFeatures: DatabaseFeatures = {
  uuid: true,
  json: true,
  arrays: true,
  triggers: false,
  checkConstraints: true, // via validation
  generatedColumns: false,
  transactions: true,
  foreignKeys: false, // manual references
  indexes: true,
  fullTextSearch: true,
};

const mongoTypeMapping: DatabaseTypeMapping = {
  string: 'String',
  text: 'String',
  int: 'Number',
  float: 'Number',
  boolean: 'Boolean',
  date: 'Date',
  datetime: 'Date',
  uuid: 'String', // or ObjectId
  json: 'Mixed',
  decimal: 'Decimal128',
  bigint: 'Long',
  binary: 'Buffer',
};

export const mongodbAdapter: DocumentDatabaseAdapter = {
  id: 'mongodb',
  name: 'MongoDB',
  description: 'Document-oriented NoSQL database',
  category: 'document',
  features: mongoFeatures,
  typeMapping: mongoTypeMapping,
  
  getCollectionDefinition(name, schema) {
    return `db.createCollection("${name}", {
  validator: {
    $jsonSchema: ${JSON.stringify(schema, null, 2)}
  }
});`;
  },
  
  getEmbeddedDocumentSyntax(name, schema) {
    const fields = Object.entries(schema)
      .map(([key, type]) => `    ${key}: { type: ${type} }`)
      .join(',\n');
    
    return `const ${name}Schema = new Schema({
${fields}
}, { _id: false });`;
  },
  
  getReferenceFieldSyntax(field, refCollection) {
    return `  ${field}: { type: Schema.Types.ObjectId, ref: '${refCollection}' }`;
  },
  
  getIndexSyntax(collection, fields, options = {}) {
    const indexSpec = fields.reduce((acc, f) => ({ ...acc, [f]: 1 }), {});
    return `db.${collection}.createIndex(${JSON.stringify(indexSpec)}, ${JSON.stringify(options)});`;
  },
  
  getValidationSchema(collection, schema) {
    return JSON.stringify({
      bsonType: 'object',
      required: Object.keys(schema).filter(k => !schema[k].optional),
      properties: Object.entries(schema).reduce((acc, [key, val]: [string, any]) => ({
        ...acc,
        [key]: { bsonType: val.type || 'string' }
      }), {}),
    }, null, 2);
  },
};
