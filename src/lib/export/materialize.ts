import { ERSchema, Relationship, RelationshipConnection } from '../schema';
import { IRTable, IRColumn, IRRelationship, toSnakeCase } from './types';

/**
 * Materialize first-class relationship diamonds into exportable IR tables and relationships.
 * This is called at export time so the IR includes junction tables, FK constraints, etc.
 */
export const materializeRelationshipsForExport = (
  schema: ERSchema
): { tables: IRTable[]; relationships: IRRelationship[] } => {
  const tables: IRTable[] = [];
  const relationships: IRRelationship[] = [];

  for (const rel of schema.relationships || []) {
    if (rel.connections.length < 2) continue;

    const isManyToMany = rel.type === 'many-to-many';
    const isTernary = rel.connections.length >= 3;

    if (isManyToMany || isTernary) {
      // Generate junction/associative table
      const { table, rels } = buildJunctionTable(rel, schema);
      tables.push(table);
      relationships.push(...rels);
    } else {
      // 1:1 or 1:N — generate FK relationship in IR
      const irRel = buildFKRelationship(rel, schema);
      if (irRel) relationships.push(irRel);
    }
  }

  return { tables, relationships };
};

function resolveEntityName(schema: ERSchema, entityId: string): string {
  const entity = schema.entities.find(e => e.id === entityId);
  return entity ? toSnakeCase(entity.name) : entityId;
}

function resolveFieldName(schema: ERSchema, entityId: string, fieldId: string): string {
  const entity = schema.entities.find(e => e.id === entityId);
  if (!entity) return fieldId;
  const field = entity.fields.find(f => f.id === fieldId);
  return field ? toSnakeCase(field.name) : fieldId;
}

function findPKFieldName(schema: ERSchema, entityId: string): string {
  const entity = schema.entities.find(e => e.id === entityId);
  if (!entity) return 'id';
  const pk = entity.fields.find(f => f.isPrimaryKey);
  return pk ? toSnakeCase(pk.name) : 'id';
}

function buildJunctionTable(rel: Relationship, schema: ERSchema): { table: IRTable; rels: IRRelationship[] } {
  const tableName = toSnakeCase(rel.name);
  const columns: IRColumn[] = [];
  const rels: IRRelationship[] = [];

  // PK for junction table
  columns.push({
    name: 'id',
    originalName: 'id',
    type: 'integer',
    nullable: false,
    primaryKey: true,
    unique: true,
    autoIncrement: true,
  });

  // FK columns for each connected entity
  for (const conn of rel.connections) {
    const entityName = resolveEntityName(schema, conn.entityId);
    const entityPK = findPKFieldName(schema, conn.entityId);
    const fkColName = `${entityName}_${entityPK}`;

    columns.push({
      name: fkColName,
      originalName: fkColName,
      type: 'integer',
      nullable: false,
      primaryKey: false,
      unique: false,
      autoIncrement: false,
      references: {
        table: entityName,
        column: entityPK,
        onDelete: rel.onDelete,
        onUpdate: rel.onUpdate,
      },
    });

    rels.push({
      name: `${tableName}_to_${entityName}`,
      type: 'one-to-many',
      sourceTable: entityName,
      targetTable: tableName,
      sourceColumns: [entityPK],
      targetColumns: [fkColName],
      rules: [],
    });
  }

  // Relationship attributes become columns on the junction table
  for (const attr of rel.attributes) {
    columns.push({
      name: toSnakeCase(attr.name),
      originalName: attr.name,
      type: attr.type,
      nullable: attr.isNullable,
      primaryKey: false,
      unique: false,
      autoIncrement: false,
      default: attr.defaultValue,
    });
  }

  return {
    table: {
      name: tableName,
      originalName: rel.name,
      columns,
      primaryKey: ['id'],
      indexes: [],
      constraints: [],
    },
    rels,
  };
}

function buildFKRelationship(rel: Relationship, schema: ERSchema): IRRelationship | null {
  const conn1 = rel.connections[0];
  const conn2 = rel.connections[1];
  if (!conn1 || !conn2) return null;

  // For 1:N, source is the "1" side, target is the "N" side
  let sourceConn: RelationshipConnection;
  let targetConn: RelationshipConnection;

  if (conn1.cardinality === '1' && (conn2.cardinality === 'N' || conn2.cardinality === 'M')) {
    sourceConn = conn1;
    targetConn = conn2;
  } else if ((conn1.cardinality === 'N' || conn1.cardinality === 'M') && conn2.cardinality === '1') {
    sourceConn = conn2;
    targetConn = conn1;
  } else {
    // 1:1 — pick first as source
    sourceConn = conn1;
    targetConn = conn2;
  }

  const sourceTable = resolveEntityName(schema, sourceConn.entityId);
  const targetTable = resolveEntityName(schema, targetConn.entityId);
  const sourceCol = resolveFieldName(schema, sourceConn.entityId, sourceConn.fieldId);
  const targetCol = resolveFieldName(schema, targetConn.entityId, targetConn.fieldId);

  return {
    name: toSnakeCase(rel.name),
    type: rel.type,
    sourceTable,
    targetTable,
    sourceColumns: [sourceCol],
    targetColumns: [targetCol],
    rules: rel.rules.map(r => ({
      name: r.name,
      trigger: r.trigger.toLowerCase().replace('_', '_') as any,
      action: r.action.type,
    })),
  };
}
