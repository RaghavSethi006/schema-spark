// Neo4j Graph Database Adapter
import { GraphDatabaseAdapter, DatabaseFeatures, DatabaseTypeMapping } from '../../types/databases';

const neo4jFeatures: DatabaseFeatures = {
  uuid: true,
  json: true, // Maps
  arrays: true,
  triggers: true, // APOC triggers
  checkConstraints: true,
  generatedColumns: false,
  transactions: true,
  foreignKeys: false, // Relationships instead
  indexes: true,
  fullTextSearch: true,
};

const neo4jTypeMapping: DatabaseTypeMapping = {
  string: 'String',
  text: 'String',
  int: 'Integer',
  float: 'Float',
  boolean: 'Boolean',
  date: 'Date',
  datetime: 'DateTime',
  uuid: 'String',
  json: 'Map',
  decimal: 'Float',
  bigint: 'Integer',
  binary: 'ByteArray',
};

export const neo4jAdapter: GraphDatabaseAdapter = {
  id: 'neo4j',
  name: 'Neo4j',
  description: 'Native graph database',
  category: 'graph',
  features: neo4jFeatures,
  typeMapping: neo4jTypeMapping,
  
  getNodeDefinition(label, properties) {
    const props = Object.entries(properties)
      .map(([key, type]) => `  ${key}: ${type}`)
      .join(',\n');
    
    return `// Node: ${label}
CREATE CONSTRAINT ${label.toLowerCase()}_id IF NOT EXISTS
FOR (n:${label}) REQUIRE n.id IS UNIQUE;

// Properties:
${props}`;
  },
  
  getEdgeDefinition(type, properties) {
    const props = Object.entries(properties)
      .map(([key, propType]) => `  ${key}: ${propType}`)
      .join(',\n');
    
    return `// Relationship: ${type}
// Properties:
${props}`;
  },
  
  getRelationshipSyntax(fromNode, toNode, relType, properties = {}) {
    const propsStr = Object.keys(properties).length > 0 
      ? ` ${JSON.stringify(properties)}` 
      : '';
    return `MATCH (a:${fromNode}), (b:${toNode})
WHERE a.id = $fromId AND b.id = $toId
CREATE (a)-[:${relType}${propsStr}]->(b)`;
  },
  
  getTraversalQuery(startNode, relationship, depth = 1) {
    return `MATCH path = (n:${startNode})-[:${relationship}*1..${depth}]->(m)
WHERE n.id = $startId
RETURN path`;
  },
};
