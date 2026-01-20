import { 
  ArrowRight, 
  Link2, 
  Trash2, 
  GitBranch,
  Plus,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { useSchemaStore } from '@/lib/store';
import { RelationType } from '@/lib/schema';
import { cn } from '@/lib/utils';

export const RelationEditor = () => {
  const { 
    schema,
    updateRelation,
    deleteRelation,
    addRelation,
  } = useSchemaStore();

  const getEntityName = (id: string) => {
    return schema.entities.find(e => e.id === id)?.name || 'Unknown';
  };

  const getFieldName = (entityId: string, fieldId: string) => {
    const entity = schema.entities.find(e => e.id === entityId);
    return entity?.fields.find(f => f.id === fieldId)?.name || 'Unknown';
  };

  const getRelationTypeLabel = (type: RelationType) => {
    switch (type) {
      case 'one-to-one': return '1:1';
      case 'one-to-many': return '1:N';
      case 'many-to-many': return 'N:M';
    }
  };

  if (schema.entities.length < 2) {
    return (
      <div className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <GitBranch className="w-5 h-5 text-primary" />
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Relations
          </span>
        </div>
        <div className="text-center p-6 rounded-lg bg-muted/30 border border-border">
          <Link2 className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Add at least 2 entities to create relationships
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 animate-slide-in-right">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <GitBranch className="w-5 h-5 text-primary" />
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Relations ({schema.relations.length})
          </span>
        </div>
      </div>

      {/* Quick Add Relation */}
      <QuickAddRelation />

      <Separator className="my-4" />

      {/* Existing Relations */}
      {schema.relations.length === 0 ? (
        <div className="text-center p-6 rounded-lg bg-muted/30 border border-border">
          <Link2 className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            No relations yet. Use the form above or connect fields on the canvas.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <Label className="text-xs text-muted-foreground">Existing Relations</Label>
          {schema.relations.map((relation) => (
            <div
              key={relation.id}
              className="rounded-lg border border-border p-3 space-y-3 bg-card/50"
            >
              {/* Visual representation */}
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-medium text-primary">
                    {getEntityName(relation.sourceEntityId)}
                  </span>
                  <span className="text-muted-foreground text-xs">
                    .{getFieldName(relation.sourceEntityId, relation.sourceFieldId)}
                  </span>
                </div>
                <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-muted text-xs font-mono">
                  {getRelationTypeLabel(relation.type)}
                  <ArrowRight className="w-3 h-3" />
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-medium text-secondary">
                    {getEntityName(relation.targetEntityId)}
                  </span>
                  <span className="text-muted-foreground text-xs">
                    .{getFieldName(relation.targetEntityId, relation.targetFieldId)}
                  </span>
                </div>
              </div>

              {/* Relation Type Selector */}
              <div className="flex items-center gap-2">
                <Label className="text-xs w-20">Type</Label>
                <Select
                  value={relation.type}
                  onValueChange={(value) => updateRelation(relation.id, { type: value as RelationType })}
                >
                  <SelectTrigger className="h-7 text-xs flex-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="one-to-one">One-to-One (1:1)</SelectItem>
                    <SelectItem value="one-to-many">One-to-Many (1:N)</SelectItem>
                    <SelectItem value="many-to-many">Many-to-Many (N:M)</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => deleteRelation(relation.id)}
                  className="h-7 w-7 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pseudocode Help */}
      <div className="mt-4 p-3 rounded-lg bg-muted/50 border border-border">
        <Label className="text-xs text-muted-foreground mb-2 block">Generated Logic Preview</Label>
        <pre className="text-xs font-mono text-muted-foreground overflow-x-auto">
{schema.relations.length > 0 ? (
  schema.relations.map((r) => {
    const source = getEntityName(r.sourceEntityId);
    const target = getEntityName(r.targetEntityId);
    const sourceField = getFieldName(r.sourceEntityId, r.sourceFieldId);
    const targetField = getFieldName(r.targetEntityId, r.targetFieldId);
    
    if (r.type === 'one-to-many') {
      return `# ${source} has many ${target}
if ${target.toLowerCase()}.${sourceField} == ${source.toLowerCase()}.${targetField}:
    ${source.toLowerCase()}.${target.toLowerCase()}s.append(${target.toLowerCase()})`;
    } else if (r.type === 'one-to-one') {
      return `# ${source} has one ${target}
if ${target.toLowerCase()}.${sourceField} == ${source.toLowerCase()}.${targetField}:
    ${source.toLowerCase()}.${target.toLowerCase()} = ${target.toLowerCase()}`;
    } else {
      return `# ${source} <-> ${target} (many-to-many)
# Requires junction table: ${source}_${target}`;
    }
  }).join('\n\n')
) : (
  `# No relations defined
# Add a relation to see generated code`
)}
        </pre>
      </div>
    </div>
  );
};

// Quick Add Relation Component
const QuickAddRelation = () => {
  const { schema, addRelation } = useSchemaStore();
  
  const [sourceEntityId, setSourceEntityId] = React.useState<string>('');
  const [sourceFieldId, setSourceFieldId] = React.useState<string>('');
  const [targetEntityId, setTargetEntityId] = React.useState<string>('');
  const [targetFieldId, setTargetFieldId] = React.useState<string>('');
  const [relationType, setRelationType] = React.useState<RelationType>('one-to-many');

  const sourceEntity = schema.entities.find(e => e.id === sourceEntityId);
  const targetEntity = schema.entities.find(e => e.id === targetEntityId);

  const handleAddRelation = () => {
    if (!sourceEntityId || !sourceFieldId || !targetEntityId || !targetFieldId) return;
    
    addRelation({
      type: relationType,
      sourceEntityId,
      sourceFieldId,
      targetEntityId,
      targetFieldId,
    });

    // Reset form
    setSourceEntityId('');
    setSourceFieldId('');
    setTargetEntityId('');
    setTargetFieldId('');
  };

  const isValid = sourceEntityId && sourceFieldId && targetEntityId && targetFieldId;

  return (
    <div className="space-y-3 p-3 rounded-lg bg-muted/30 border border-border">
      <Label className="text-xs flex items-center gap-1">
        <Plus className="w-3 h-3" />
        Add New Relation
      </Label>
      
      {/* Source Entity + Field */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label className="text-xs text-muted-foreground mb-1 block">From Entity</Label>
          <Select value={sourceEntityId} onValueChange={(v) => { setSourceEntityId(v); setSourceFieldId(''); }}>
            <SelectTrigger className="h-8 text-xs">
              <SelectValue placeholder="Entity..." />
            </SelectTrigger>
            <SelectContent>
              {schema.entities.map((entity) => (
                <SelectItem key={entity.id} value={entity.id}>
                  {entity.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs text-muted-foreground mb-1 block">Field</Label>
          <Select value={sourceFieldId} onValueChange={setSourceFieldId} disabled={!sourceEntityId}>
            <SelectTrigger className="h-8 text-xs">
              <SelectValue placeholder="Field..." />
            </SelectTrigger>
            <SelectContent>
              {sourceEntity?.fields.map((field) => (
                <SelectItem key={field.id} value={field.id}>
                  {field.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Relation Type */}
      <div className="flex items-center justify-center gap-2">
        <div className="flex-1 h-px bg-border" />
        <Select value={relationType} onValueChange={(v) => setRelationType(v as RelationType)}>
          <SelectTrigger className="h-7 w-28 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="one-to-one">1:1</SelectItem>
            <SelectItem value="one-to-many">1:N</SelectItem>
            <SelectItem value="many-to-many">N:M</SelectItem>
          </SelectContent>
        </Select>
        <ArrowRight className="w-4 h-4 text-muted-foreground" />
        <div className="flex-1 h-px bg-border" />
      </div>

      {/* Target Entity + Field */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label className="text-xs text-muted-foreground mb-1 block">To Entity</Label>
          <Select value={targetEntityId} onValueChange={(v) => { setTargetEntityId(v); setTargetFieldId(''); }}>
            <SelectTrigger className="h-8 text-xs">
              <SelectValue placeholder="Entity..." />
            </SelectTrigger>
            <SelectContent>
              {schema.entities.map((entity) => (
                <SelectItem key={entity.id} value={entity.id}>
                  {entity.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs text-muted-foreground mb-1 block">Field</Label>
          <Select value={targetFieldId} onValueChange={setTargetFieldId} disabled={!targetEntityId}>
            <SelectTrigger className="h-8 text-xs">
              <SelectValue placeholder="Field..." />
            </SelectTrigger>
            <SelectContent>
              {targetEntity?.fields.map((field) => (
                <SelectItem key={field.id} value={field.id}>
                  {field.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Button 
        onClick={handleAddRelation} 
        disabled={!isValid}
        size="sm" 
        className="w-full h-8 text-xs"
      >
        <Plus className="w-3 h-3 mr-1" />
        Add Relation
      </Button>
    </div>
  );
};

import React from 'react';
