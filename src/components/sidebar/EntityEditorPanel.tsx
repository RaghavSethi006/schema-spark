import { useState } from 'react';
import { 
  Plus, 
  Trash2, 
  Key, 
  Link, 
  ChevronDown,
  Database,
  Layers,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
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
import { ScrollArea } from '@/components/ui/scroll-area';
import { useSchemaStore } from '@/lib/store';
import { FIELD_TYPES, FieldType } from '@/lib/schema';
import { cn } from '@/lib/utils';

export const EntityEditorPanel = () => {
  const { 
    schema,
    selectedEntityId, 
    selectedFieldId,
    getEntityById,
    updateEntity,
    addField,
    updateField,
    deleteField,
    deleteEntity,
  } = useSchemaStore();

  const entity = selectedEntityId ? getEntityById(selectedEntityId) : null;

  if (!entity) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 mb-4 rounded-full bg-muted flex items-center justify-center">
          <Database className="w-8 h-8 text-muted-foreground" />
        </div>
        <h3 className="font-medium mb-2">No Entity Selected</h3>
        <p className="text-sm text-muted-foreground">
          Click on an entity in the canvas to edit its properties
        </p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-full">
      <div className="flex flex-col animate-slide-in-right">
        {/* Entity Header */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center gap-2 mb-3">
            <Layers className="w-5 h-5 text-primary" />
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Entity
            </span>
          </div>
          <Input
            value={entity.name}
            onChange={(e) => updateEntity(entity.id, { name: e.target.value })}
            className="font-semibold text-lg h-10"
            placeholder="Entity name"
          />
        </div>

        {/* Fields List */}
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-muted-foreground">
              Fields ({entity.fields.length})
            </span>
            <Button
              size="sm"
              variant="outline"
              onClick={() => addField(entity.id)}
              className="h-7 gap-1 text-xs"
            >
              <Plus className="w-3 h-3" />
              Add Field
            </Button>
          </div>

          <div className="space-y-2">
            {entity.fields.map((field) => (
              <Collapsible
                key={field.id}
                open={selectedFieldId === field.id}
                onOpenChange={(open) => {
                  if (open) {
                    useSchemaStore.getState().selectField(field.id);
                  }
                }}
              >
                <div
                  className={cn(
                    'rounded-lg border transition-all',
                    selectedFieldId === field.id
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-muted-foreground/50'
                  )}
                >
                  <CollapsibleTrigger className="w-full">
                    <div className="flex items-center justify-between p-3">
                      <div className="flex items-center gap-2">
                        {field.isPrimaryKey && (
                          <Key className="w-3.5 h-3.5 text-field-pk" />
                        )}
                        {field.isForeignKey && (
                          <Link className="w-3.5 h-3.5 text-field-fk" />
                        )}
                        <span className={cn(
                          'font-mono text-sm',
                          field.isPrimaryKey && 'text-field-pk font-semibold'
                        )}>
                          {field.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground font-mono">
                          {field.type}
                        </span>
                        <ChevronDown className={cn(
                          'w-4 h-4 text-muted-foreground transition-transform',
                          selectedFieldId === field.id && 'rotate-180'
                        )} />
                      </div>
                    </div>
                  </CollapsibleTrigger>

                  <CollapsibleContent>
                    <div className="px-3 pb-3 space-y-3 border-t border-border pt-3">
                      {/* Field Name */}
                      <div className="space-y-1.5">
                        <Label className="text-xs">Name</Label>
                        <Input
                          value={field.name}
                          onChange={(e) => updateField(entity.id, field.id, { name: e.target.value })}
                          className="h-8 font-mono text-sm"
                          placeholder="field_name"
                        />
                      </div>

                      {/* Field Type */}
                      <div className="space-y-1.5">
                        <Label className="text-xs">Type</Label>
                        <Select
                          value={field.type}
                          onValueChange={(value) => updateField(entity.id, field.id, { type: value as FieldType })}
                        >
                          <SelectTrigger className="h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {FIELD_TYPES.map((type) => (
                              <SelectItem key={type.value} value={type.value}>
                                <span className="font-mono text-sm">{type.label}</span>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Constraints */}
                      <div className="space-y-2">
                        <Label className="text-xs">Constraints</Label>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Key className="w-3.5 h-3.5 text-field-pk" />
                            <span className="text-sm">Primary Key</span>
                          </div>
                          <Switch
                            checked={field.isPrimaryKey}
                            onCheckedChange={(checked) => updateField(entity.id, field.id, { 
                              isPrimaryKey: checked,
                              isNullable: checked ? false : field.isNullable,
                              isUnique: checked ? true : field.isUnique,
                            })}
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-sm">Nullable</span>
                          <Switch
                            checked={field.isNullable}
                            onCheckedChange={(checked) => updateField(entity.id, field.id, { isNullable: checked })}
                            disabled={field.isPrimaryKey}
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-sm">Unique</span>
                          <Switch
                            checked={field.isUnique}
                            onCheckedChange={(checked) => updateField(entity.id, field.id, { isUnique: checked })}
                            disabled={field.isPrimaryKey}
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Link className="w-3.5 h-3.5 text-field-fk" />
                            <span className="text-sm">Foreign Key</span>
                          </div>
                          <Switch
                            checked={field.isForeignKey}
                            onCheckedChange={(checked) => updateField(entity.id, field.id, { isForeignKey: checked })}
                            disabled={field.isPrimaryKey}
                          />
                        </div>

                        {/* Foreign Key Reference Selector */}
                        {field.isForeignKey && (
                          <ForeignKeySelector 
                            entityId={entity.id} 
                            fieldId={field.id} 
                            currentRef={field.foreignKeyRef}
                          />
                        )}
                      </div>

                      {/* Delete Field */}
                      {!field.isPrimaryKey && (
                        <>
                          <Separator />
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteField(entity.id, field.id)}
                            className="w-full h-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="w-3.5 h-3.5 mr-2" />
                            Delete Field
                          </Button>
                        </>
                      )}
                    </div>
                  </CollapsibleContent>
                </div>
              </Collapsible>
            ))}
          </div>
        </div>

        {/* Delete Entity */}
        <div className="p-4 border-t border-border">
          <Button
            variant="outline"
            size="sm"
            onClick={() => deleteEntity(entity.id)}
            className="w-full h-8 text-destructive border-destructive/30 hover:text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="w-3.5 h-3.5 mr-2" />
            Delete Entity
          </Button>
        </div>
      </div>
    </ScrollArea>
  );
};

// Foreign Key Selector Component
const ForeignKeySelector = ({ 
  entityId, 
  fieldId, 
  currentRef 
}: { 
  entityId: string; 
  fieldId: string; 
  currentRef?: { entityId: string; fieldId: string };
}) => {
  const { schema, updateField } = useSchemaStore();
  
  // Get all entities except current one
  const otherEntities = schema.entities.filter(e => e.id !== entityId);
  const selectedRefEntity = currentRef ? schema.entities.find(e => e.id === currentRef.entityId) : null;

  return (
    <div className="space-y-2 pl-5 border-l-2 border-field-fk/30">
      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">References Entity</Label>
        <Select 
          value={currentRef?.entityId || ''} 
          onValueChange={(v) => updateField(entityId, fieldId, { 
            foreignKeyRef: { entityId: v, fieldId: '' } 
          })}
        >
          <SelectTrigger className="h-7 text-xs">
            <SelectValue placeholder="Select entity..." />
          </SelectTrigger>
          <SelectContent>
            {otherEntities.map((entity) => (
              <SelectItem key={entity.id} value={entity.id}>
                {entity.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {selectedRefEntity && (
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">References Field</Label>
          <Select 
            value={currentRef?.fieldId || ''} 
            onValueChange={(v) => updateField(entityId, fieldId, { 
              foreignKeyRef: { entityId: currentRef!.entityId, fieldId: v } 
            })}
          >
            <SelectTrigger className="h-7 text-xs">
              <SelectValue placeholder="Select field..." />
            </SelectTrigger>
            <SelectContent>
              {selectedRefEntity.fields.map((field) => (
                <SelectItem key={field.id} value={field.id}>
                  <span className="flex items-center gap-1">
                    {field.isPrimaryKey && <Key className="w-3 h-3 text-field-pk" />}
                    {field.name}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );
};
