import { useState, useMemo } from 'react';
import { 
  Plus, 
  Trash2, 
  Link2,
  Unlink,
  AlertTriangle,
  CheckCircle2,
  Key,
  ArrowRight,
  ChevronDown,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { useSchemaStore } from '@/lib/store';
import { 
  Relationship, 
  RelationshipConnection, 
  ParticipationType,
  Entity,
  Field,
  FIELD_TYPES,
} from '@/lib/schema';
import { cn } from '@/lib/utils';

interface ConnectionManagerProps {
  relationship: Relationship;
}

interface CompatibilityResult {
  compatible: boolean;
  warnings: string[];
  errors: string[];
}

// Check data type compatibility between two fields
const checkFieldCompatibility = (field1: Field, field2: Field): CompatibilityResult => {
  const result: CompatibilityResult = { compatible: true, warnings: [], errors: [] };
  
  // Same type = compatible
  if (field1.type === field2.type) {
    return result;
  }
  
  // Integer/Float compatibility
  const numericTypes = ['integer', 'float'];
  if (numericTypes.includes(field1.type) && numericTypes.includes(field2.type)) {
    result.warnings.push('Implicit numeric conversion may occur');
    return result;
  }
  
  // String/Text compatibility
  const stringTypes = ['string', 'text', 'uuid'];
  if (stringTypes.includes(field1.type) && stringTypes.includes(field2.type)) {
    result.warnings.push('String length differences may cause truncation');
    return result;
  }
  
  // Date/DateTime compatibility
  const dateTypes = ['date', 'datetime'];
  if (dateTypes.includes(field1.type) && dateTypes.includes(field2.type)) {
    result.warnings.push('Date/DateTime conversion required');
    return result;
  }
  
  // Incompatible types
  result.compatible = false;
  result.errors.push(`Type mismatch: ${field1.type} ↔ ${field2.type}`);
  return result;
};

export const ConnectionManager = ({ relationship }: ConnectionManagerProps) => {
  const { 
    schema,
    addRelationshipConnection,
    updateRelationshipConnection,
    deleteRelationshipConnection,
  } = useSchemaStore();

  const [showAddForm, setShowAddForm] = useState(false);
  const [newEntityId, setNewEntityId] = useState('');
  const [newFieldId, setNewFieldId] = useState('');
  const [newCardinality, setNewCardinality] = useState<'1' | 'N' | 'M'>('1');
  const [newParticipation, setNewParticipation] = useState<ParticipationType>('partial');
  const [newRole, setNewRole] = useState('');

  // Get entity and field helpers
  const getEntity = (entityId: string) => schema.entities.find(e => e.id === entityId);
  const getField = (entityId: string, fieldId: string) => {
    const entity = getEntity(entityId);
    return entity?.fields.find(f => f.id === fieldId);
  };

  // Available entities (not already connected, unless recursive)
  const availableEntities = useMemo(() => {
    const connectedEntityIds = relationship.connections.map(c => c.entityId);
    
    // For recursive relationships, allow connecting to same entity multiple times
    if (relationship.isRecursive) {
      return schema.entities;
    }
    
    // Filter entities that aren't already connected
    // But allow if less than 2 connections to same entity (for composite keys)
    return schema.entities.filter(entity => {
      const connectionsToEntity = connectedEntityIds.filter(id => id === entity.id).length;
      return connectionsToEntity < 2;
    });
  }, [schema.entities, relationship.connections, relationship.isRecursive]);

  const selectedNewEntity = newEntityId ? getEntity(newEntityId) : null;

  // Get suitable fields for connection (prefer PKs and FKs)
  const suitableFields = useMemo(() => {
    if (!selectedNewEntity) return [];
    
    return selectedNewEntity.fields.map(field => ({
      field,
      suitability: field.isPrimaryKey ? 'primary' : 
                   field.isForeignKey ? 'foreign' : 
                   field.isUnique ? 'unique' : 'regular',
    })).sort((a, b) => {
      const order = { primary: 0, foreign: 1, unique: 2, regular: 3 };
      return order[a.suitability] - order[b.suitability];
    });
  }, [selectedNewEntity]);

  // Validate new connection
  const validateNewConnection = (): CompatibilityResult => {
    if (!newEntityId || !newFieldId) {
      return { compatible: false, warnings: [], errors: ['Select entity and field'] };
    }
    
    const newField = getField(newEntityId, newFieldId);
    if (!newField) {
      return { compatible: false, warnings: [], errors: ['Field not found'] };
    }

    // Check compatibility with existing connections
    const allResults: CompatibilityResult = { compatible: true, warnings: [], errors: [] };
    
    for (const conn of relationship.connections) {
      const existingField = getField(conn.entityId, conn.fieldId);
      if (existingField) {
        const result = checkFieldCompatibility(newField, existingField);
        allResults.compatible = allResults.compatible && result.compatible;
        allResults.warnings.push(...result.warnings);
        allResults.errors.push(...result.errors);
      }
    }

    return allResults;
  };

  const validation = validateNewConnection();

  const handleAddConnection = () => {
    if (!validation.compatible) return;
    
    addRelationshipConnection(
      relationship.id,
      newEntityId,
      newFieldId,
      newCardinality,
      newParticipation
    );

    // Update role if provided
    if (newRole.trim()) {
      const connections = useSchemaStore.getState().getRelationshipById(relationship.id)?.connections;
      const lastConn = connections?.[connections.length - 1];
      if (lastConn) {
        updateRelationshipConnection(relationship.id, lastConn.id, { role: newRole.trim() });
      }
    }

    // Reset form
    setNewEntityId('');
    setNewFieldId('');
    setNewRole('');
    setShowAddForm(false);
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link2 className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium">
            Entity Connections ({relationship.connections.length})
          </span>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setShowAddForm(!showAddForm)}
          className="h-7 gap-1 text-xs"
        >
          <Plus className="w-3 h-3" />
          Connect
        </Button>
      </div>

      {/* Add Connection Form */}
      {showAddForm && (
        <div className="p-3 rounded-lg bg-muted/50 border border-border space-y-3">
          <Label className="text-xs font-medium">Add Entity Connection</Label>
          
          <div className="grid grid-cols-2 gap-2">
            {/* Entity Selector */}
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Entity</Label>
              <Select 
                value={newEntityId} 
                onValueChange={(v) => { setNewEntityId(v); setNewFieldId(''); }}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Select entity..." />
                </SelectTrigger>
                <SelectContent>
                  {availableEntities.map((entity) => (
                    <SelectItem key={entity.id} value={entity.id}>
                      {entity.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Field Selector */}
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Field</Label>
              <Select 
                value={newFieldId} 
                onValueChange={setNewFieldId}
                disabled={!newEntityId}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Select field..." />
                </SelectTrigger>
                <SelectContent>
                  {suitableFields.map(({ field, suitability }) => (
                    <SelectItem key={field.id} value={field.id}>
                      <span className="flex items-center gap-1">
                        {suitability === 'primary' && <Key className="w-3 h-3 text-field-pk" />}
                        {suitability === 'foreign' && <Link2 className="w-3 h-3 text-field-fk" />}
                        <span>{field.name}</span>
                        <span className="text-muted-foreground text-[10px]">({field.type})</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {/* Cardinality */}
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Cardinality</Label>
              <Select value={newCardinality} onValueChange={(v: '1' | 'N' | 'M') => setNewCardinality(v)}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 (One)</SelectItem>
                  <SelectItem value="N">N (Many)</SelectItem>
                  <SelectItem value="M">M (Many, distinct)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Participation */}
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Participation</Label>
              <Select value={newParticipation} onValueChange={(v: ParticipationType) => setNewParticipation(v)}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="partial">Partial (Optional)</SelectItem>
                  <SelectItem value="total">Total (Required)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Role (for recursive/ternary) */}
          {(relationship.isRecursive || relationship.connections.length >= 1) && (
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Role (optional)</Label>
              <Input
                value={newRole}
                onChange={(e) => setNewRole(e.target.value)}
                placeholder="e.g., 'manager', 'employee'"
                className="h-8 text-xs"
              />
            </div>
          )}

          {/* Validation Feedback */}
          {newEntityId && newFieldId && (
            <div className={cn(
              "p-2 rounded text-xs flex items-start gap-2",
              validation.compatible 
                ? "bg-green-500/10 text-green-600" 
                : "bg-destructive/10 text-destructive"
            )}>
              {validation.compatible ? (
                <CheckCircle2 className="w-4 h-4 shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 shrink-0" />
              )}
              <div>
                {validation.errors.map((err, i) => <div key={i}>{err}</div>)}
                {validation.warnings.map((warn, i) => (
                  <div key={i} className="text-yellow-600">{warn}</div>
                ))}
                {validation.compatible && validation.warnings.length === 0 && (
                  <span>Types are compatible</span>
                )}
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={handleAddConnection}
              disabled={!validation.compatible || !newEntityId || !newFieldId}
              className="flex-1 h-7 text-xs"
            >
              Add Connection
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setShowAddForm(false)}
              className="h-7 text-xs"
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Existing Connections */}
      {relationship.connections.length === 0 ? (
        <div className="text-center p-6 rounded-lg bg-muted/30 border border-border">
          <Unlink className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            No connections yet. Connect entities to define the relationship.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {relationship.connections.map((conn, index) => (
            <ConnectionItem
              key={conn.id}
              connection={conn}
              relationshipId={relationship.id}
              entity={getEntity(conn.entityId)}
              field={getField(conn.entityId, conn.fieldId)}
              index={index}
            />
          ))}
        </div>
      )}

      {/* Connection mapping visual */}
      {relationship.connections.length >= 2 && (
        <div className="mt-4 p-3 rounded-lg bg-card border border-border">
          <Label className="text-xs text-muted-foreground mb-2 block">Attribute Mapping</Label>
          <div className="flex flex-wrap items-center justify-center gap-2 text-xs font-mono">
            {relationship.connections.map((conn, i) => {
              const entity = getEntity(conn.entityId);
              const field = getField(conn.entityId, conn.fieldId);
              return (
                <span key={conn.id} className="flex items-center gap-1">
                  {i > 0 && <ArrowRight className="w-3 h-3 text-muted-foreground mx-1" />}
                  <span className="text-primary">{entity?.name}</span>
                  <span className="text-muted-foreground">.</span>
                  <span>{field?.name}</span>
                  {conn.role && (
                    <Badge variant="secondary" className="text-[9px] h-4 px-1">
                      {conn.role}
                    </Badge>
                  )}
                </span>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

// Individual connection item component
const ConnectionItem = ({ 
  connection, 
  relationshipId,
  entity, 
  field,
  index,
}: { 
  connection: RelationshipConnection;
  relationshipId: string;
  entity?: Entity;
  field?: Field;
  index: number;
}) => {
  const { updateRelationshipConnection, deleteRelationshipConnection } = useSchemaStore();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div className={cn(
        "rounded-lg border transition-all",
        isOpen ? "border-primary bg-primary/5" : "border-border"
      )}>
        <CollapsibleTrigger className="w-full">
          <div className="flex items-center justify-between p-3">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-muted text-[10px] flex items-center justify-center font-medium">
                {index + 1}
              </span>
              <span className="font-mono text-sm text-primary">{entity?.name || 'Unknown'}</span>
              <span className="text-muted-foreground">.</span>
              <span className="font-mono text-sm">{field?.name || 'Unknown'}</span>
              {connection.role && (
                <Badge variant="secondary" className="text-[9px] h-4">
                  {connection.role}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-[10px] h-5">
                {connection.cardinality}
              </Badge>
              <Badge 
                variant="outline" 
                className={cn(
                  "text-[10px] h-5",
                  connection.participation === 'total' 
                    ? "bg-primary/10 text-primary" 
                    : ""
                )}
              >
                {connection.participation}
              </Badge>
              <ChevronDown className={cn(
                "w-4 h-4 text-muted-foreground transition-transform",
                isOpen && "rotate-180"
              )} />
            </div>
          </div>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="px-3 pb-3 space-y-3 border-t border-border pt-3">
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Cardinality</Label>
                <Select 
                  value={connection.cardinality} 
                  onValueChange={(v: '1' | 'N' | 'M') => 
                    updateRelationshipConnection(relationshipId, connection.id, { cardinality: v })
                  }
                >
                  <SelectTrigger className="h-7 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 (One)</SelectItem>
                    <SelectItem value="N">N (Many)</SelectItem>
                    <SelectItem value="M">M (Many, distinct)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Participation</Label>
                <Select 
                  value={connection.participation} 
                  onValueChange={(v: ParticipationType) => 
                    updateRelationshipConnection(relationshipId, connection.id, { participation: v })
                  }
                >
                  <SelectTrigger className="h-7 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="partial">Partial (Optional)</SelectItem>
                    <SelectItem value="total">Total (Required)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Role</Label>
              <Input
                value={connection.role || ''}
                onChange={(e) => 
                  updateRelationshipConnection(relationshipId, connection.id, { role: e.target.value || undefined })
                }
                placeholder="e.g., 'manager', 'employee'"
                className="h-7 text-xs"
              />
            </div>

            <Separator />

            <Button
              variant="ghost"
              size="sm"
              onClick={() => deleteRelationshipConnection(relationshipId, connection.id)}
              className="w-full h-7 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="w-3 h-3 mr-1" />
              Remove Connection
            </Button>
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
};
