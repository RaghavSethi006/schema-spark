import { useCallback, useMemo } from 'react';
import {
  ReactFlow,
  Controls,
  Background,
  BackgroundVariant,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Node,
  Edge,
  NodeTypes,
  Panel,
  MarkerType,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { EntityNode } from './EntityNode';
import { RelationshipNode } from './RelationshipNode';
import { createDemoSchema } from '@/lib/demo';
import { useSchemaStore } from '@/lib/store';
import { Plus, Diamond, FileJson, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

const nodeTypes: NodeTypes = {
  entity: EntityNode,
  relationship: RelationshipNode,
};

export const DiagramCanvas = () => {
  const { setSchema } = useSchemaStore();
  const { 
    schema, 
    addEntity, 
    addRelation,
    addRelationship,
    setEntityPosition,
    setRelationshipPosition,
    selectEntity,
    selectRelationship,
  } = useSchemaStore();

  // Convert schema entities and relationships to React Flow nodes
  const initialNodes: Node[] = useMemo(() => {
    const entityNodes = schema.entities.map((entity) => ({
      id: entity.id,
      type: 'entity',
      position: entity.position,
      data: { entity },
    }));

    const relationshipNodes = (schema.relationships || []).map((relationship) => ({
      id: relationship.id,
      type: 'relationship',
      position: relationship.position,
      data: { relationship },
    }));

    return [...entityNodes, ...relationshipNodes];
  }, [schema.entities, schema.relationships]);

  // Convert schema relations to React Flow edges
  const initialEdges: Edge[] = useMemo(() => {
    return schema.relations.map((relation) => ({
      id: relation.id,
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
  }, [schema.relations]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Sync nodes when schema changes
  useMemo(() => {
    setNodes(initialNodes);
  }, [initialNodes, setNodes]);

  useMemo(() => {
    setEdges(initialEdges);
  }, [initialEdges, setEdges]);

  const onConnect = useCallback(
    (params: Connection) => {
      if (!params.source || !params.target || !params.sourceHandle || !params.targetHandle) return;
      
      // Extract field IDs from handles
      const sourceFieldId = params.sourceHandle.replace('-source', '');
      const targetFieldId = params.targetHandle.replace('-target', '');
      
      // Add relation to schema
      addRelation({
        type: 'one-to-many',
        sourceEntityId: params.source,
        sourceFieldId,
        targetEntityId: params.target,
        targetFieldId,
      });
      
      setEdges((eds) => addEdge(params, eds));
    },
    [addRelation, setEdges]
  );

  const onNodeDragStop = useCallback(
    (_: React.MouseEvent, node: Node) => {
      if (node.type === 'relationship') {
        setRelationshipPosition(node.id, node.position);
      } else {
        setEntityPosition(node.id, node.position);
      }
    },
    [setEntityPosition, setRelationshipPosition]
  );

  const handleAddEntity = () => {
    const offset = schema.entities.length * 30;
    addEntity(`Entity${schema.entities.length + 1}`, { 
      x: 100 + offset, 
      y: 100 + offset 
    });
  };

  const handleAddRelationship = () => {
    const offset = (schema.relationships?.length || 0) * 50;
    addRelationship(`Relationship${(schema.relationships?.length || 0) + 1}`, { 
      x: 300 + offset, 
      y: 250 + offset 
    });
  };

  const handlePaneClick = () => {
    selectEntity(null);
    selectRelationship(null);
  };

  return (
    <div className="w-full h-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeDragStop={onNodeDragStop}
        onPaneClick={handlePaneClick}
        nodeTypes={nodeTypes}
        fitView
        proOptions={{ hideAttribution: true }}
        className="bg-canvas-bg"
        defaultEdgeOptions={{
          type: 'smoothstep',
          animated: true,
        }}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={20}
          size={1}
          color="hsl(var(--canvas-dot))"
        />
        <Controls 
          className="!bg-card !border-border"
          showInteractive={false}
        />
        
        {/* Toolbar */}
        <Panel position="top-left" className="flex gap-2">
          <Button
            onClick={handleAddEntity}
            size="sm"
            className="gap-2 shadow-lg"
          >
            <Plus className="w-4 h-4" />
            Add Entity
          </Button>
          <Button
            onClick={handleAddRelationship}
            size="sm"
            variant="secondary"
            className="gap-2 shadow-lg"
          >
            <Diamond className="w-4 h-4" />
            Add Relationship
          </Button>
        </Panel>

        {/* Empty state */}
        {schema.entities.length === 0 && (
          <Panel position="top-center" className="mt-20">
            <div className="text-center p-8 rounded-xl bg-card/80 backdrop-blur border border-border shadow-xl animate-fade-in">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                <FileJson className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Start Designing</h3>
              <p className="text-muted-foreground text-sm mb-4 max-w-xs">
                Click "Add Entity" to create your first table, or load a demo project.
              </p>
              <div className="flex flex-col sm:flex-row gap-2 justify-center">
                <Button onClick={handleAddEntity} className="gap-2">
                  <Plus className="w-4 h-4" />
                  Create First Entity
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setSchema(createDemoSchema())}
                  className="gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  Load Demo (User + Post)
                </Button>
              </div>
            </div>
          </Panel>
        )}
      </ReactFlow>
    </div>
  );
};
