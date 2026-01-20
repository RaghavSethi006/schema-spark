import { memo, useMemo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { 
  Diamond, 
  Link, 
  Unlink, 
  Eye, 
  Settings,
  ArrowRight,
  CircleDot,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSchemaStore } from '@/lib/store';
import { Relationship, RelationshipConnection } from '@/lib/schema';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface RelationshipNodeData {
  relationship: Relationship;
}

// Diamond shape component
const DiamondShape = ({ 
  isSelected, 
  isIdentifying,
  type,
  hasConnections,
}: { 
  isSelected: boolean; 
  isIdentifying: boolean;
  type: string;
  hasConnections: boolean;
}) => {
  const bgColor = useMemo(() => {
    if (!hasConnections) return 'hsl(var(--muted))';
    switch (type) {
      case 'one-to-one': return 'hsl(var(--chart-1))';
      case 'one-to-many': return 'hsl(var(--chart-2))';
      case 'many-to-many': return 'hsl(var(--chart-3))';
      default: return 'hsl(var(--primary))';
    }
  }, [type, hasConnections]);

  return (
    <div 
      className={cn(
        "w-24 h-24 transform rotate-45 rounded-md transition-all duration-200",
        "border-2 flex items-center justify-center",
        isSelected 
          ? "border-primary shadow-lg shadow-primary/30 ring-2 ring-primary/50" 
          : "border-border hover:border-primary/50",
        isIdentifying && "border-double border-4"
      )}
      style={{ backgroundColor: bgColor }}
    >
      <div className="transform -rotate-45 flex flex-col items-center gap-1">
        {!hasConnections ? (
          <Unlink className="w-5 h-5 text-muted-foreground" />
        ) : type === 'many-to-many' ? (
          <Link className="w-5 h-5 text-white" />
        ) : (
          <Diamond className="w-5 h-5 text-white" />
        )}
      </div>
    </div>
  );
};

// Connection indicator showing cardinality
const ConnectionIndicator = ({ 
  connection, 
  position,
  entityName,
}: { 
  connection: RelationshipConnection; 
  position: 'left' | 'right' | 'top' | 'bottom';
  entityName: string;
}) => {
  const positionClasses: Record<string, string> = {
    left: '-left-20 top-1/2 -translate-y-1/2',
    right: '-right-20 top-1/2 -translate-y-1/2',
    top: 'left-1/2 -translate-x-1/2 -top-10',
    bottom: 'left-1/2 -translate-x-1/2 -bottom-10',
  };

  return (
    <div className={cn("absolute text-xs flex flex-col items-center gap-0.5", positionClasses[position])}>
      <span className="font-mono font-bold text-foreground">
        {connection.cardinality === '1' ? '1' : connection.cardinality}
      </span>
      <span className={cn(
        "text-[10px] px-1 rounded",
        connection.participation === 'total' 
          ? "bg-primary/20 text-primary font-medium" 
          : "bg-muted text-muted-foreground"
      )}>
        {connection.participation === 'total' ? 'total' : 'partial'}
      </span>
      <span className="text-muted-foreground text-[9px] truncate max-w-16">
        {entityName}
      </span>
    </div>
  );
};

// Attribute badge
const AttributeBadge = ({ name, type }: { name: string; type: string }) => (
  <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-card border border-border text-[10px]">
    <CircleDot className="w-2.5 h-2.5 text-primary" />
    <span className="text-foreground">{name}</span>
    <span className="text-muted-foreground">: {type}</span>
  </div>
);

export const RelationshipNode = memo(({ data, selected }: NodeProps) => {
  const { relationship } = data as unknown as RelationshipNodeData;
  const { selectRelationship, schema } = useSchemaStore();

  // Get entity names for connections
  const getEntityName = (entityId: string) => {
    return schema.entities.find(e => e.id === entityId)?.name || 'Unknown';
  };

  // Determine handle positions based on connections
  const connectionPositions = useMemo(() => {
    const positions: ('left' | 'right' | 'top' | 'bottom')[] = ['left', 'right', 'top', 'bottom'];
    return relationship.connections.map((conn, index) => ({
      connection: conn,
      position: positions[index % positions.length],
    }));
  }, [relationship.connections]);

  const hasConnections = relationship.connections.length > 0;
  const hasAttributes = relationship.attributes.length > 0;
  const hasRules = relationship.rules.length > 0;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    selectRelationship(relationship.id);
  };

  const getTypeLabel = () => {
    switch (relationship.type) {
      case 'one-to-one': return '1:1';
      case 'one-to-many': return '1:N';
      case 'many-to-many': return 'N:M';
    }
  };

  return (
    <TooltipProvider>
      <div 
        className="relative group"
        onClick={handleClick}
      >
        {/* Connection handles */}
        {connectionPositions.map(({ connection, position }) => (
          <Handle
            key={connection.id}
            type={position === 'left' || position === 'top' ? 'target' : 'source'}
            position={
              position === 'left' ? Position.Left :
              position === 'right' ? Position.Right :
              position === 'top' ? Position.Top : Position.Bottom
            }
            id={`${connection.id}-${position}`}
            className={cn(
              "!w-3 !h-3 !border-2",
              "!bg-card !border-primary",
              "hover:!bg-primary transition-colors"
            )}
          />
        ))}

        {/* Default handles when no connections */}
        {!hasConnections && (
          <>
            <Handle
              type="target"
              position={Position.Left}
              id="default-left"
              className="!w-3 !h-3 !border-2 !bg-card !border-muted-foreground hover:!border-primary"
            />
            <Handle
              type="source"
              position={Position.Right}
              id="default-right"
              className="!w-3 !h-3 !border-2 !bg-card !border-muted-foreground hover:!border-primary"
            />
          </>
        )}

        {/* Connection indicators */}
        {connectionPositions.map(({ connection, position }) => (
          <ConnectionIndicator
            key={connection.id}
            connection={connection}
            position={position}
            entityName={getEntityName(connection.entityId)}
          />
        ))}

        {/* Diamond shape */}
        <DiamondShape 
          isSelected={selected || false}
          isIdentifying={relationship.isIdentifying}
          type={relationship.type}
          hasConnections={hasConnections}
        />

        {/* Relationship name */}
        <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap">
          <div className="flex items-center gap-1.5">
            <span className="font-medium text-sm text-foreground">
              {relationship.name}
            </span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
              {getTypeLabel()}
            </span>
          </div>
        </div>

        {/* Attributes displayed around the diamond */}
        {hasAttributes && (
          <div className="absolute -top-14 left-1/2 -translate-x-1/2 flex flex-wrap gap-1 justify-center max-w-48">
            {relationship.attributes.slice(0, 3).map((attr) => (
              <AttributeBadge key={attr.id} name={attr.name} type={attr.type} />
            ))}
            {relationship.attributes.length > 3 && (
              <div className="text-[10px] text-muted-foreground">
                +{relationship.attributes.length - 3} more
              </div>
            )}
          </div>
        )}

        {/* Indicators for rules/constraints */}
        <div className="absolute -right-2 -top-2 flex gap-1">
          {hasRules && (
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                  <Settings className="w-3 h-3 text-primary-foreground" />
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>{relationship.rules.length} rule(s) defined</p>
              </TooltipContent>
            </Tooltip>
          )}
          {relationship.constraints.length > 0 && (
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="w-5 h-5 rounded-full bg-secondary flex items-center justify-center">
                  <Eye className="w-3 h-3 text-secondary-foreground" />
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>{relationship.constraints.length} constraint(s)</p>
              </TooltipContent>
            </Tooltip>
          )}
        </div>

        {/* FK behavior indicator */}
        <div className="absolute -bottom-14 left-1/2 -translate-x-1/2 flex items-center gap-1 text-[9px] text-muted-foreground">
          <span>ON DELETE:</span>
          <span className="font-mono text-foreground">{relationship.onDelete}</span>
        </div>

        {/* Recursive indicator */}
        {relationship.isRecursive && (
          <div className="absolute top-0 left-0 -translate-x-1/2 -translate-y-1/2">
            <div className="px-1.5 py-0.5 rounded bg-primary/20 text-primary text-[9px] font-medium">
              Recursive
            </div>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
});

RelationshipNode.displayName = 'RelationshipNode';
