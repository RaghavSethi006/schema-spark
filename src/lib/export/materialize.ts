import { ERSchema, Relationship, RelationshipConnection, FieldType } from '../schema';
import { IRTable, IRColumn, IRRelationship, toSnakeCase } from './types';
import { ExportConfig } from './types';

/**
 * Materialize first-class relationship diamonds into exportable IR tables and relationships.
 * Also injects FK columns into existing IR tables for 1:1 / 1:N relationships.
 *
 * @param schema - the full ER schema
 * @param config - export config (needed for tablePluralizer)
 * @param existingTables - mutable array of IR tables (FK columns will be injected into these)
 */
export const materializeRelationshipsForExport = (
  schema: ERSchema,
  config: ExportConfig,
  existingTables: IRTable[]
): { tables: IRTable[]; relationships: IRRelationship[] } => {
  const tables: IRTable[] = [];
  const relationships: IRRelationship[] = [];

  for (const rel of schema.relationships || []) {
    if (rel.connections.length < 2) continue;

    const isManyToMany = rel.type === 'many-to-many';
    const isTernary = rel.connections.length >= 3;

    if (isManyToMany || isTernary) {
      const { table, rels } = buildJunctionTable(rel, schema, config);
      tables.push(table);
      relationships.push(...rels);
    } else {
      // 1:1 or 1:N — generate FK column + IR relationship
      const result = buildFKRelationship(rel, schema, config, existingTables);
      if (result) relationships.push(result);
    }
  }

  return { tables, relationships };
};

// ── helpers ──────────────────────────────────────────────────────────

/** Produce the same IR table name that transformToIR uses */
function resolveEntityTableName(schema: ERSchema, entityId: string, config: ExportConfig): string {
  const entity = schema.entities.find(e => e.id === entityId);
  if (!entity) return entityId;
  const base = toSnakeCase(entity.name);
  return config.tablePluralizer ? base + 's' : base;
}

/** Resolve a field id to its snake_case column name */
function resolveFieldColumnName(schema: ERSchema, entityId: string, fieldId: string): string {
  const entity = schema.entities.find(e => e.id === entityId);
  if (!entity) return fieldId;
  const field = entity.fields.find(f => f.id === fieldId);
  return field ? toSnakeCase(field.name) : fieldId;
}

/** Find PK field info for an entity */
function findPKField(schema: ERSchema, entityId: string): { name: string; type: FieldType } {
  const entity = schema.entities.find(e => e.id === entityId);
  if (!entity) return { name: 'id', type: 'integer' };
  const pk = entity.fields.find(f => f.isPrimaryKey);
  return pk ? { name: toSnakeCase(pk.name), type: pk.type } : { name: 'id', type: 'integer' };
}

// ── junction / associative table (M:N and ternary) ──────────────────

function buildJunctionTable(
  rel: Relationship,
  schema: ERSchema,
  config: ExportConfig
): { table: IRTable; rels: IRRelationship[] } {
  const tableName = toSnakeCase(rel.name);
  const columns: IRColumn[] = [];
  const rels: IRRelationship[] = [];

  // Decide PK type: use first connected entity's PK type so uuid schemas stay consistent
  const firstPK = findPKField(schema, rel.connections[0].entityId);
  const pkType: FieldType = firstPK.type === 'uuid' ? 'uuid' : 'integer';

  columns.push({
    name: 'id',
    originalName: 'id',
    type: pkType,
    nullable: false,
    primaryKey: true,
    unique: true,
    autoIncrement: pkType === 'integer',
  });

  // FK columns for each connected entity
  for (const conn of rel.connections) {
    const entityTableName = resolveEntityTableName(schema, conn.entityId, config);
    const pk = findPKField(schema, conn.entityId);
    const fkColName = `${entityTableName}_${pk.name}`;

    columns.push({
      name: fkColName,
      originalName: fkColName,
      type: pk.type, // match referenced PK type
      nullable: false,
      primaryKey: false,
      unique: false,
      autoIncrement: false,
      references: {
        table: entityTableName,
        column: pk.name,
        onDelete: rel.onDelete,
        onUpdate: rel.onUpdate,
      },
    });

    rels.push({
      name: `${tableName}_to_${entityTableName}`,
      type: 'one-to-many',
      sourceTable: entityTableName,
      targetTable: tableName,
      sourceColumns: [pk.name],
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

// ── FK relationship (1:1 and 1:N) ───────────────────────────────────

function buildFKRelationship(
  rel: Relationship,
  schema: ERSchema,
  config: ExportConfig,
  existingTables: IRTable[]
): IRRelationship | null {
  const conn1 = rel.connections[0];
  const conn2 = rel.connections[1];
  if (!conn1 || !conn2) return null;

  // Determine source ("1" side) and target ("N" / FK-holder side)
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

  const sourceTable = resolveEntityTableName(schema, sourceConn.entityId, config);
  const targetTable = resolveEntityTableName(schema, targetConn.entityId, config);
  const sourcePK = findPKField(schema, sourceConn.entityId);

  // Inject FK column into the target (N-side) IR table
  const fkColName = `${sourceTable}_${sourcePK.name}`;
  const targetIRTable = existingTables.find(t => t.name === targetTable);
  if (targetIRTable && !targetIRTable.columns.some(c => c.name === fkColName)) {
    targetIRTable.columns.push({
      name: fkColName,
      originalName: fkColName,
      type: sourcePK.type,
      nullable: targetConn.participation === 'partial',
      primaryKey: false,
      unique: rel.type === 'one-to-one',
      autoIncrement: false,
      references: {
        table: sourceTable,
        column: sourcePK.name,
        onDelete: rel.onDelete,
        onUpdate: rel.onUpdate,
      },
    });
  }

  return {
    name: toSnakeCase(rel.name),
    type: rel.type,
    sourceTable,
    targetTable,
    sourceColumns: [sourcePK.name],
    targetColumns: [fkColName],
    rules: rel.rules.map(r => ({
      name: r.name,
      trigger: r.trigger.toLowerCase().replace('_', '_') as any,
      action: r.action.type,
    })),
  };
}
