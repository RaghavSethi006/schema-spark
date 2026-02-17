import { Edge, MarkerType } from '@xyflow/react';
import { ERSchema, Relation } from './schema';

const POSITIONS = ['left', 'right', 'top', 'bottom'] as const;

/**
 * Derive ReactFlow edges from first-class relationship diamonds.
 * Each connection in a relationship produces one edge: diamond ↔ entity.
 */
export const deriveRelationshipEdges = (schema: ERSchema): Edge[] => {
  const edges: Edge[] = [];

  for (const rel of schema.relationships || []) {
    if (rel.connections.length < 1) continue;

    rel.connections.forEach((conn, index) => {
      const position = POSITIONS[index % POSITIONS.length];
      const handleType = position === 'left' || position === 'top' ? 'target' : 'source';

      // Cardinality label for the edge
      const cardLabel = conn.cardinality === '1' ? '1' : conn.cardinality;

      edges.push({
        id: `rel-edge-${rel.id}-${conn.id}`,
        // Diamond is always the source conceptually; ReactFlow just needs consistent handle types
        source: handleType === 'source' ? rel.id : conn.entityId,
        target: handleType === 'source' ? conn.entityId : rel.id,
        sourceHandle: handleType === 'source' ? `${conn.id}-${position}` : 'entity-source',
        targetHandle: handleType === 'source' ? 'entity-target' : `${conn.id}-${position}`,
        type: 'smoothstep',
        animated: true,
        style: { strokeWidth: 2, strokeDasharray: '5 3' },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          width: 16,
          height: 16,
        },
        label: cardLabel,
        labelStyle: {
          fill: 'hsl(var(--foreground))',
          fontWeight: 600,
          fontSize: 11,
        },
        labelBgStyle: {
          fill: 'hsl(var(--card))',
          stroke: 'hsl(var(--border))',
          strokeWidth: 1,
        },
      });
    });
  }

  return edges;
};

/**
 * Derive ReactFlow edges from legacy entity-to-entity relations.
 * Extracted from DiagramCanvas for reuse.
 */
export const deriveLegacyEdges = (relations: Relation[]): Edge[] => {
  return relations.map((relation) => ({
    id: `legacy-${relation.id}`,
    source: relation.sourceEntityId,
    target: relation.targetEntityId,
    sourceHandle: `${relation.sourceFieldId}-source`,
    targetHandle: `${relation.targetFieldId}-target`,
    type: 'smoothstep',
    animated: true,
    style: { strokeWidth: 2 },
    markerEnd: {
      type: MarkerType.ArrowClosed,
      width: 20,
      height: 20,
    },
    label: relation.type === 'one-to-many' ? '1:N' : '1:1',
    labelStyle: {
      fill: 'hsl(var(--foreground))',
      fontWeight: 500,
      fontSize: 10,
    },
    labelBgStyle: {
      fill: 'hsl(var(--card))',
      stroke: 'hsl(var(--border))',
      strokeWidth: 1,
    },
  }));
};
