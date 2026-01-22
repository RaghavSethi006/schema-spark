import { useState, useMemo } from 'react';
import { 
  Plus, 
  Trash2, 
  Workflow,
  ChevronDown,
  Code,
  Eye,
  AlertTriangle,
  Zap,
  Settings2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
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
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useSchemaStore } from '@/lib/store';
import { 
  Relationship, 
  RelationshipRule,
  RuleCondition,
  RuleAction,
  RuleTrigger,
  RuleScope,
} from '@/lib/schema';
import { cn } from '@/lib/utils';
import { VisualConditionBuilder } from './VisualConditionBuilder';

interface LogicRuleEditorProps {
  relationship: Relationship;
}

const TRIGGER_OPTIONS: { value: RuleTrigger; label: string; color: string }[] = [
  { value: 'BEFORE_CREATE', label: 'Before Create', color: 'text-blue-500' },
  { value: 'AFTER_CREATE', label: 'After Create', color: 'text-green-500' },
  { value: 'BEFORE_UPDATE', label: 'Before Update', color: 'text-yellow-500' },
  { value: 'AFTER_UPDATE', label: 'After Update', color: 'text-orange-500' },
  { value: 'BEFORE_DELETE', label: 'Before Delete', color: 'text-red-500' },
  { value: 'AFTER_DELETE', label: 'After Delete', color: 'text-pink-500' },
];

const SCOPE_OPTIONS: { value: RuleScope; label: string }[] = [
  { value: 'database', label: 'Database Only' },
  { value: 'backend', label: 'Backend Only' },
  { value: 'both', label: 'Both' },
];

const ACTION_OPTIONS: { value: RuleAction['type']; label: string }[] = [
  { value: 'THROW_ERROR', label: 'Throw Error' },
  { value: 'BLOCK', label: 'Block Operation' },
  { value: 'UPDATE_FIELD', label: 'Update Field' },
  { value: 'LOG', label: 'Log Event' },
  { value: 'CUSTOM', label: 'Custom Code' },
];

export const LogicRuleEditor = ({ relationship }: LogicRuleEditorProps) => {
  const { 
    schema,
    addRelationshipRule,
    updateRelationshipRule,
    deleteRelationshipRule,
  } = useSchemaStore();

  const [selectedRuleId, setSelectedRuleId] = useState<string | null>(null);

  // Get available fields for conditions
  const availableFields = useMemo(() => {
    const fields: { label: string; value: string; entity?: string }[] = [];
    
    // Add relationship attributes
    relationship.attributes.forEach(attr => {
      fields.push({
        label: `relationship.${attr.name}`,
        value: `relationship.${attr.name}`,
      });
    });

    // Add connected entity fields
    relationship.connections.forEach(conn => {
      const entity = schema.entities.find(e => e.id === conn.entityId);
      if (entity) {
        entity.fields.forEach(field => {
          const prefix = conn.role ? `${conn.role}` : entity.name.toLowerCase();
          fields.push({
            label: `${prefix}.${field.name}`,
            value: `${entity.name}.${field.name}`,
            entity: entity.name,
          });
        });
      }
    });

    return fields;
  }, [relationship, schema.entities]);

  const handleAddRule = () => {
    const rule = addRelationshipRule(relationship.id, `Rule ${relationship.rules.length + 1}`);
    if (rule) {
      setSelectedRuleId(rule.id);
    }
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Workflow className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium">
            Logic Rules ({relationship.rules.length})
          </span>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={handleAddRule}
          className="h-7 gap-1 text-xs"
        >
          <Plus className="w-3 h-3" />
          Add Rule
        </Button>
      </div>

      <p className="text-xs text-muted-foreground">
        Define business logic, validation rules, and triggers for this relationship.
      </p>

      {/* Rules List */}
      {relationship.rules.length === 0 ? (
        <div className="text-center p-6 rounded-lg bg-muted/30 border border-border">
          <Zap className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            No rules defined. Add validation or business logic rules.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {relationship.rules.map((rule) => (
            <RuleItem
              key={rule.id}
              rule={rule}
              relationshipId={relationship.id}
              isSelected={selectedRuleId === rule.id}
              onSelect={() => setSelectedRuleId(selectedRuleId === rule.id ? null : rule.id)}
              availableFields={availableFields}
            />
          ))}
        </div>
      )}

      {/* Rule Templates */}
      {relationship.rules.length === 0 && relationship.connections.length >= 2 && (
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Quick Templates</Label>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-6 text-[10px] px-2"
              onClick={() => {
                const rule = addRelationshipRule(relationship.id, 'Prevent Self-Reference');
                if (rule) {
                  const conn1 = relationship.connections[0];
                  const conn2 = relationship.connections[1];
                  const entity1 = schema.entities.find(e => e.id === conn1?.entityId);
                  const entity2 = schema.entities.find(e => e.id === conn2?.entityId);
                  if (entity1 && entity2) {
                    updateRelationshipRule(relationship.id, rule.id, {
                      trigger: 'BEFORE_CREATE',
                      dslCode: `IF ${entity1.name}.id == ${entity2.name}.id\n  THROW Error("Self-reference not allowed")`,
                    });
                  }
                }
              }}
            >
              + Self-Reference Check
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-6 text-[10px] px-2"
              onClick={() => {
                const rule = addRelationshipRule(relationship.id, 'Max Relations Limit');
                if (rule) {
                  updateRelationshipRule(relationship.id, rule.id, {
                    trigger: 'BEFORE_CREATE',
                    dslCode: `IF COUNT(${relationship.name}) >= 5\n  THROW Error("Maximum relations reached")`,
                  });
                }
              }}
            >
              + Max Limit
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

// Individual rule item component
const RuleItem = ({ 
  rule, 
  relationshipId,
  isSelected,
  onSelect,
  availableFields,
}: { 
  rule: RelationshipRule;
  relationshipId: string;
  isSelected: boolean;
  onSelect: () => void;
  availableFields: { label: string; value: string; entity?: string }[];
}) => {
  const { updateRelationshipRule, deleteRelationshipRule } = useSchemaStore();
  const [editorMode, setEditorMode] = useState<'visual' | 'code'>('code');

  const triggerOption = TRIGGER_OPTIONS.find(t => t.value === rule.trigger);

  return (
    <Collapsible open={isSelected} onOpenChange={() => onSelect()}>
      <div className={cn(
        "rounded-lg border transition-all",
        isSelected ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground/50",
        !rule.enabled && "opacity-50"
      )}>
        <CollapsibleTrigger className="w-full">
          <div className="flex items-center justify-between p-3">
            <div className="flex items-center gap-2">
              <Zap className={cn("w-3.5 h-3.5", triggerOption?.color || "text-primary")} />
              <span className="text-sm font-medium">{rule.name}</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-[9px] h-5">
                {triggerOption?.label || rule.trigger}
              </Badge>
              <Badge 
                variant="outline" 
                className={cn(
                  "text-[9px] h-5",
                  rule.scope === 'both' ? "bg-primary/10" : ""
                )}
              >
                {rule.scope}
              </Badge>
              <ChevronDown className={cn(
                "w-4 h-4 text-muted-foreground transition-transform",
                isSelected && "rotate-180"
              )} />
            </div>
          </div>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="px-3 pb-3 space-y-3 border-t border-border pt-3">
            {/* Rule Name */}
            <div className="space-y-1.5">
              <Label className="text-xs">Rule Name</Label>
              <Input
                value={rule.name}
                onChange={(e) => updateRelationshipRule(relationshipId, rule.id, { name: e.target.value })}
                className="h-8 text-sm"
                placeholder="Rule name"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              {/* Trigger */}
              <div className="space-y-1">
                <Label className="text-xs">Trigger</Label>
                <Select
                  value={rule.trigger}
                  onValueChange={(v: RuleTrigger) => updateRelationshipRule(relationshipId, rule.id, { trigger: v })}
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TRIGGER_OPTIONS.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>
                        <span className={opt.color}>{opt.label}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Scope */}
              <div className="space-y-1">
                <Label className="text-xs">Scope</Label>
                <Select
                  value={rule.scope}
                  onValueChange={(v: RuleScope) => updateRelationshipRule(relationshipId, rule.id, { scope: v })}
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SCOPE_OPTIONS.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Enabled Toggle */}
            <div className="flex items-center justify-between">
              <span className="text-sm">Enabled</span>
              <Switch
                checked={rule.enabled}
                onCheckedChange={(checked) => updateRelationshipRule(relationshipId, rule.id, { enabled: checked })}
              />
            </div>

            <Separator />

            {/* Editor Mode Toggle */}
            <Tabs value={editorMode} onValueChange={(v) => setEditorMode(v as 'visual' | 'code')}>
              <TabsList className="w-full grid grid-cols-2 h-7">
                <TabsTrigger value="visual" className="text-xs gap-1">
                  <Eye className="w-3 h-3" />
                  Visual
                </TabsTrigger>
                <TabsTrigger value="code" className="text-xs gap-1">
                  <Code className="w-3 h-3" />
                  Code
                </TabsTrigger>
              </TabsList>

              <TabsContent value="visual" className="mt-3">
                <VisualConditionBuilder
                  rule={rule}
                  relationshipId={relationshipId}
                  availableFields={availableFields}
                />
              </TabsContent>

              <TabsContent value="code" className="mt-3 space-y-3">
                {/* DSL Code Editor */}
                <div className="space-y-1.5">
                  <Label className="text-xs">Pseudo-Code / DSL</Label>
                  <Textarea
                    value={rule.dslCode || ''}
                    onChange={(e) => updateRelationshipRule(relationshipId, rule.id, { dslCode: e.target.value || undefined })}
                    className="h-32 font-mono text-xs resize-none"
                    placeholder={`${rule.trigger}:\n  IF entity.field == value\n    THROW Error("Message")`}
                  />
                </div>

                {/* Action Type */}
                <div className="space-y-1.5">
                  <Label className="text-xs">Action Type</Label>
                  <Select
                    value={rule.action.type}
                    onValueChange={(v: RuleAction['type']) => 
                      updateRelationshipRule(relationshipId, rule.id, { 
                        action: { ...rule.action, type: v } 
                      })
                    }
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ACTION_OPTIONS.map(opt => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Error Message (for THROW_ERROR) */}
                {rule.action.type === 'THROW_ERROR' && (
                  <div className="space-y-1.5">
                    <Label className="text-xs">Error Message</Label>
                    <Input
                      value={rule.action.errorMessage || ''}
                      onChange={(e) => 
                        updateRelationshipRule(relationshipId, rule.id, { 
                          action: { ...rule.action, errorMessage: e.target.value } 
                        })
                      }
                      className="h-8 text-xs"
                      placeholder="Validation failed"
                    />
                  </div>
                )}
              </TabsContent>
            </Tabs>

            <Separator />

            <Button
              variant="ghost"
              size="sm"
              onClick={() => deleteRelationshipRule(relationshipId, rule.id)}
              className="w-full h-8 text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="w-3.5 h-3.5 mr-2" />
              Delete Rule
            </Button>
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
};
