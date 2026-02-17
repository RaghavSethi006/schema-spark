

# Fix: Relationship Diamonds Must Show Edges and Export Correctly

## Problem

The app has two disconnected data models:
- **Canvas edges** are driven only by `schema.relations` (legacy entity-to-entity lines)
- **Relationship diamonds** store their connections in `schema.relationships[].connections[]`

When a user configures a diamond's connections in the sidebar, nothing updates `schema.relations`, so no edges appear and export sees 0 relationships.

## Chosen Approach: Option 1 (Derive Everything from `schema.relationships`)

`schema.relationships` is the canonical source of truth for diamond-based relationships. Edges are derived at render time. Export materializes relationships at export time. Legacy `schema.relations` continues to work in parallel for manually drawn entity-to-entity lines.

This avoids sync bugs, duplication, and keeps the two systems independent.

## Changes

### 1. New file: `src/lib/diagramEdges.ts` -- Pure derivation functions

Create two pure functions:

**`deriveRelationshipEdges(schema: ERSchema): Edge[]`**
- Iterates `schema.relationships`
- For each relationship with 2+ connections, generates one ReactFlow `Edge` per connection:
  - `id`: `rel-edge-${relationship.id}-${connection.id}` (deterministic)
  - `source`: `relationship.id` (the diamond node)
  - `target`: `connection.entityId` (the entity node)
  - `sourceHandle`: `${connection.id}-${position}` (matches RelationshipNode handle IDs)
  - `targetHandle`: `entity-target` (the entity-level handle on the left side)
  - Styled with cardinality label (1, N, M), smoothstep, animated
- Position assignment: connections[0] = left, [1] = right, [2] = top, [3] = bottom (matching RelationshipNode's existing logic)

**`deriveLegacyEdges(relations: Relation[]): Edge[]`**
- Extracts the existing edge-building logic from DiagramCanvas (currently inline in `initialEdges`)

### 2. Update `src/components/diagram/DiagramCanvas.tsx`

Change `initialEdges` from only legacy relations to a union:

```
const initialEdges = useMemo(() => {
  const legacyEdges = deriveLegacyEdges(schema.relations);
  const relationshipEdges = deriveRelationshipEdges(schema);
  return [...legacyEdges, ...relationshipEdges];
}, [schema.relations, schema.relationships, schema.entities]);
```

This is the core fix -- diamond connections now produce visible edges automatically.

### 3. New file: `src/lib/export/materialize.ts` -- Export materialization

Create `materializeRelationshipsForExport(schema: ERSchema): { tables: IRTable[], relationships: IRRelationship[] }`:

- For each `schema.relationships` entry with 2+ connections:
  - **1:1 / 1:N**: Generate an `IRRelationship` with FK references. The "N" side entity gets the FK column pointing to the "1" side's PK.
  - **M:N (binary)**: Generate a junction `IRTable` named after the relationship (e.g., "Enrolls" becomes `enrolls` table) with FK columns to both entities + any relationship attributes as additional columns. Generate two `IRRelationship` entries (junction-to-entity-A, junction-to-entity-B).
  - **Ternary (3+ entities)**: Generate an associative table with FK columns to all participating entities + relationship attributes.
  - Include relationship attributes as columns on the junction/associative table.
  - Map `onDelete`/`onUpdate` actions to IR references.

### 4. Update `src/lib/export/pipeline.ts` -- Use materialized relationships

In `transformToIR()`:
- Call `materializeRelationshipsForExport(schema)` 
- Merge the returned junction tables into `ir.tables`
- Merge the returned relationships into `ir.relationships`
- Keep the existing legacy `schema.relations` conversion so old-style relations still export

In `generateProjectFiles()`:
- No changes needed -- it already uses the IR output from `transformToIR()`

### 5. Update `src/components/diagram/DiagramCanvas.tsx` -- Handle diamond connections via canvas drag

Update `onConnect` callback:
- Detect if source or target is a relationship node (check `schema.relationships` by ID)
- If connecting entity-to-diamond: call `addRelationshipConnection()` instead of `addRelation()`, defaulting fieldId to the entity's PK field
- If connecting entity-to-entity (legacy): keep existing `addRelation()` behavior

### 6. Update `src/components/diagram/RelationshipNode.tsx` -- Stable handle IDs

Ensure handles always exist for all 4 positions (left, right, top, bottom) so ReactFlow can render edges to them even when a connection is added via sidebar rather than drag. Currently handles are only rendered for existing connections -- add fallback handles for unoccupied positions with `style={{ opacity: 0 }}` so they exist in the DOM.

## What Does NOT Change

- `schema.relations` (legacy) -- untouched, still works for manual entity-to-entity lines
- Store actions (`addRelationshipConnection`, `updateRelationshipConnection`, `deleteRelationshipConnection`) -- already correct
- RelationshipNode visual design -- unchanged
- EntityNode handles -- unchanged
- Sidebar connection manager -- unchanged

## Technical Details

### Edge ID Convention
- Legacy edges: `legacy-${relation.id}`
- Relationship diamond edges: `rel-edge-${relationship.id}-${connection.id}`

This guarantees no collisions between the two edge sets.

### Handle Mapping
- RelationshipNode positions: connections[0]=left, [1]=right, [2]=top, [3]=bottom
- RelationshipNode handle IDs: `${connection.id}-left`, `${connection.id}-right`, etc.
- EntityNode has `entity-target` (left) and `entity-source` (right) handles at entity level

### Files Created
1. `src/lib/diagramEdges.ts` -- pure edge derivation functions
2. `src/lib/export/materialize.ts` -- export materialization (relationships to IR tables/FKs)

### Files Modified
1. `src/components/diagram/DiagramCanvas.tsx` -- use derived edges, update onConnect
2. `src/components/diagram/RelationshipNode.tsx` -- always render 4 handles
3. `src/lib/export/pipeline.ts` -- integrate materialized relationships into IR

### Acceptance Tests Covered
1. Add diamond + connections in sidebar => edges appear (deriveRelationshipEdges)
2. Reload/reopen => edges persist (deterministic derivation from persisted schema)
3. Export => non-zero relationships + junction tables for M:N (materializeRelationshipsForExport)
4. Edit connection => edges update, no duplicates (stable edge IDs)
5. Delete connection/diamond => edges disappear (derivation re-runs, missing connections = no edges)

