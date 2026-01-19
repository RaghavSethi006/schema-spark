import { memo, useState } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { Table, Key, Link, Trash2, GripVertical, ChevronDown, ChevronUp } from 'lucide-react';
import { Entity, Field } from '@/lib/schema';
import { useSchemaStore } from '@/lib/store';
import { cn } from '@/lib/utils';

interface EntityNodeData {
  entity: Entity;
}

const FieldBadge = ({ field }: { field: Field }) => {
  if (field.isPrimaryKey) {
    return (
      <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium bg-field-pk/20 text-field-pk">
        <Key className="w-2.5 h-2.5" />
        PK
      </span>
    );
  }
  if (field.isForeignKey) {
    return (
      <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium bg-field-fk/20 text-field-fk">
        <Link className="w-2.5 h-2.5" />
        FK
      </span>
    );
  }
  return null;
};

const FieldRow = memo(({ field, entityId, isSelected }: { field: Field; entityId: string; isSelected: boolean }) => {
  const selectField = useSchemaStore((s) => s.selectField);

  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        selectField(field.id);
      }}
      className={cn(
        'group flex items-center justify-between px-3 py-1.5 text-sm cursor-pointer transition-colors',
        'hover:bg-secondary/50',
        isSelected && 'bg-primary/10 border-l-2 border-l-primary'
      )}
    >
      <div className="flex items-center gap-2 min-w-0">
        <span className={cn(
          'truncate font-mono text-xs',
          field.isPrimaryKey && 'font-semibold text-field-pk',
          field.isForeignKey && 'text-field-fk',
          field.isNullable && 'text-muted-foreground'
        )}>
          {field.name}
        </span>
      </div>
      <div className="flex items-center gap-1.5 flex-shrink-0">
        <span className="text-[10px] font-mono text-muted-foreground uppercase">
          {field.type}
        </span>
        <FieldBadge field={field} />
        {field.isNullable && !field.isPrimaryKey && (
          <span className="text-[10px] text-muted-foreground">?</span>
        )}
        {field.isUnique && !field.isPrimaryKey && (
          <span className="text-[10px] px-1 bg-accent/20 text-accent rounded">U</span>
        )}
      </div>
      
      {/* Handles for relationships - positioned on the right edge */}
      <Handle
        type="source"
        position={Position.Right}
        id={`${field.id}-source`}
        className="!w-3 !h-3 !bg-primary !border-2 !border-node-bg opacity-0 group-hover:opacity-100 transition-opacity !right-[-6px]"
      />
      <Handle
        type="target"
        position={Position.Left}
        id={`${field.id}-target`}
        className="!w-3 !h-3 !bg-primary !border-2 !border-node-bg opacity-0 group-hover:opacity-100 transition-opacity !left-[-6px]"
      />
    </div>
  );
});

FieldRow.displayName = 'FieldRow';

export const EntityNode = memo(({ data, selected }: NodeProps & { data: EntityNodeData }) => {
  const { entity } = data;
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { selectEntity, deleteEntity, selectedEntityId, selectedFieldId } = useSchemaStore();
  
  const handleClick = () => {
    selectEntity(entity.id);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(`Delete entity "${entity.name}"?`)) {
      deleteEntity(entity.id);
    }
  };

  return (
    <div
      onClick={handleClick}
      className={cn(
        'min-w-[220px] max-w-[320px] rounded-lg overflow-hidden shadow-xl transition-all duration-200',
        'bg-node-bg border-2',
        selected || selectedEntityId === entity.id
          ? 'border-node-border-selected glow-primary'
          : 'border-node-border hover:border-muted-foreground/50',
        'animate-fade-in'
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 bg-node-header border-b border-border">
        <div className="flex items-center gap-2">
          <GripVertical className="w-4 h-4 text-muted-foreground cursor-grab" />
          <Table className="w-4 h-4 text-primary" />
          <span className="font-semibold text-sm truncate">{entity.name}</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsCollapsed(!isCollapsed);
            }}
            className="p-1 rounded hover:bg-secondary transition-colors"
          >
            {isCollapsed ? (
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            ) : (
              <ChevronUp className="w-4 h-4 text-muted-foreground" />
            )}
          </button>
          <button
            onClick={handleDelete}
            className="p-1 rounded hover:bg-destructive/20 hover:text-destructive transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Fields */}
      {!isCollapsed && (
        <div className="divide-y divide-border/50">
          {entity.fields.map((field) => (
            <FieldRow
              key={field.id}
              field={field}
              entityId={entity.id}
              isSelected={selectedFieldId === field.id}
            />
          ))}
          {entity.fields.length === 0 && (
            <div className="px-3 py-4 text-center text-sm text-muted-foreground">
              No fields yet
            </div>
          )}
        </div>
      )}

      {/* Entity-level handles */}
      <Handle
        type="source"
        position={Position.Right}
        id="entity-source"
        className="!w-3 !h-3 !bg-primary !border-2 !border-node-bg !top-1/2"
      />
      <Handle
        type="target"
        position={Position.Left}
        id="entity-target"
        className="!w-3 !h-3 !bg-primary !border-2 !border-node-bg !top-1/2"
      />
    </div>
  );
});

EntityNode.displayName = 'EntityNode';
