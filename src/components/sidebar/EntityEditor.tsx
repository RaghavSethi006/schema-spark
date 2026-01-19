import { useState } from 'react';
import { 
  Plus, 
  Trash2, 
  Key, 
  Link, 
  ChevronDown,
  Database,
  Layers,
  Settings2,
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
import { useSchemaStore } from '@/lib/store';
import { FIELD_TYPES, FieldType } from '@/lib/schema';
import { cn } from '@/lib/utils';

export const EntityEditor = () => {
  const { 
    schema,
    selectedEntityId, 
    selectedFieldId,
    getEntityById,
    updateEntity,
    addField,
    updateField,
    deleteField,
  } = useSchemaStore();

  const entity = selectedEntityId ? getEntityById(selectedEntityId) : null;
  const selectedField = entity?.fields.find(f => f.id === selectedFieldId);

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
    <div className="h-full flex flex-col overflow-hidden animate-slide-in-right">
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
      <div className="flex-1 overflow-y-auto">
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
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-border">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Settings2 className="w-3.5 h-3.5" />
          <span>Connect fields to create relationships</span>
        </div>
      </div>
    </div>
  );
};
