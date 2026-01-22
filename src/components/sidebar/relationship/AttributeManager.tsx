import { useState } from 'react';
import { 
  Plus, 
  Trash2, 
  Settings,
  ChevronDown,
  CircleDot,
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
import { Textarea } from '@/components/ui/textarea';
import { useSchemaStore } from '@/lib/store';
import { 
  Relationship, 
  RelationshipAttribute,
  FIELD_TYPES,
  FieldType,
} from '@/lib/schema';
import { cn } from '@/lib/utils';

interface AttributeManagerProps {
  relationship: Relationship;
}

export const AttributeManager = ({ relationship }: AttributeManagerProps) => {
  const { 
    addRelationshipAttribute,
    updateRelationshipAttribute,
    deleteRelationshipAttribute,
  } = useSchemaStore();

  const [selectedAttrId, setSelectedAttrId] = useState<string | null>(null);

  const handleAddAttribute = () => {
    const attr = addRelationshipAttribute(relationship.id, `attr_${relationship.attributes.length}`);
    if (attr) {
      setSelectedAttrId(attr.id);
    }
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Settings className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium">
            Relationship Attributes ({relationship.attributes.length})
          </span>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={handleAddAttribute}
          className="h-7 gap-1 text-xs"
        >
          <Plus className="w-3 h-3" />
          Add
        </Button>
      </div>

      <p className="text-xs text-muted-foreground">
        Attributes that belong to the relationship itself (e.g., enrollment_date, grade, role).
      </p>

      {/* Attributes List */}
      {relationship.attributes.length === 0 ? (
        <div className="text-center p-6 rounded-lg bg-muted/30 border border-border">
          <CircleDot className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            No attributes defined. Add attributes like dates, scores, or statuses.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {relationship.attributes.map((attr) => (
            <AttributeItem
              key={attr.id}
              attribute={attr}
              relationshipId={relationship.id}
              isSelected={selectedAttrId === attr.id}
              onSelect={() => setSelectedAttrId(selectedAttrId === attr.id ? null : attr.id)}
            />
          ))}
        </div>
      )}

      {/* Common Attribute Templates */}
      {relationship.attributes.length === 0 && (
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Quick Add</Label>
          <div className="flex flex-wrap gap-2">
            {[
              { name: 'created_at', type: 'datetime' as FieldType },
              { name: 'updated_at', type: 'datetime' as FieldType },
              { name: 'status', type: 'string' as FieldType },
              { name: 'role', type: 'string' as FieldType },
              { name: 'grade', type: 'integer' as FieldType },
              { name: 'amount', type: 'float' as FieldType },
            ].map((template) => (
              <Button
                key={template.name}
                variant="outline"
                size="sm"
                className="h-6 text-[10px] px-2"
                onClick={() => {
                  const attr = addRelationshipAttribute(relationship.id, template.name);
                  if (attr) {
                    updateRelationshipAttribute(relationship.id, attr.id, { type: template.type });
                  }
                }}
              >
                + {template.name}
              </Button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Individual attribute item component
const AttributeItem = ({ 
  attribute, 
  relationshipId,
  isSelected,
  onSelect,
}: { 
  attribute: RelationshipAttribute;
  relationshipId: string;
  isSelected: boolean;
  onSelect: () => void;
}) => {
  const { updateRelationshipAttribute, deleteRelationshipAttribute } = useSchemaStore();

  return (
    <Collapsible open={isSelected} onOpenChange={() => onSelect()}>
      <div className={cn(
        "rounded-lg border transition-all",
        isSelected ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground/50"
      )}>
        <CollapsibleTrigger className="w-full">
          <div className="flex items-center justify-between p-3">
            <div className="flex items-center gap-2">
              <CircleDot className="w-3.5 h-3.5 text-primary" />
              <span className="font-mono text-sm">{attribute.name}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground font-mono">
                {attribute.type}
              </span>
              {!attribute.isNullable && (
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-primary/20 text-primary font-medium">
                  required
                </span>
              )}
              <ChevronDown className={cn(
                "w-4 h-4 text-muted-foreground transition-transform",
                isSelected && "rotate-180"
              )} />
            </div>
          </div>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="px-3 pb-3 space-y-3 border-t border-border pt-3">
            {/* Attribute Name */}
            <div className="space-y-1.5">
              <Label className="text-xs">Name</Label>
              <Input
                value={attribute.name}
                onChange={(e) => updateRelationshipAttribute(relationshipId, attribute.id, { name: e.target.value })}
                className="h-8 font-mono text-sm"
                placeholder="attribute_name"
              />
            </div>

            {/* Attribute Type */}
            <div className="space-y-1.5">
              <Label className="text-xs">Type</Label>
              <Select
                value={attribute.type}
                onValueChange={(value) => updateRelationshipAttribute(relationshipId, attribute.id, { type: value as FieldType })}
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

            {/* Nullable Toggle */}
            <div className="flex items-center justify-between">
              <span className="text-sm">Nullable</span>
              <Switch
                checked={attribute.isNullable}
                onCheckedChange={(checked) => updateRelationshipAttribute(relationshipId, attribute.id, { isNullable: checked })}
              />
            </div>

            {/* Default Value */}
            <div className="space-y-1.5">
              <Label className="text-xs">Default Value</Label>
              <Input
                value={attribute.defaultValue || ''}
                onChange={(e) => updateRelationshipAttribute(relationshipId, attribute.id, { defaultValue: e.target.value || undefined })}
                className="h-8 font-mono text-sm"
                placeholder="NULL"
              />
            </div>

            {/* Check Constraint */}
            <div className="space-y-1.5">
              <Label className="text-xs">Check Constraint (SQL)</Label>
              <Textarea
                value={attribute.checkConstraint || ''}
                onChange={(e) => updateRelationshipAttribute(relationshipId, attribute.id, { checkConstraint: e.target.value || undefined })}
                className="h-16 font-mono text-xs resize-none"
                placeholder="e.g., grade BETWEEN 0 AND 100"
              />
            </div>

            <Separator />

            <Button
              variant="ghost"
              size="sm"
              onClick={() => deleteRelationshipAttribute(relationshipId, attribute.id)}
              className="w-full h-8 text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="w-3.5 h-3.5 mr-2" />
              Delete Attribute
            </Button>
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
};
