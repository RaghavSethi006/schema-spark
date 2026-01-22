import { useState } from 'react';
import { 
  Plus, 
  Trash2, 
  GripVertical,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useSchemaStore } from '@/lib/store';
import { 
  RelationshipRule,
  RuleCondition,
} from '@/lib/schema';
import { cn } from '@/lib/utils';

interface VisualConditionBuilderProps {
  rule: RelationshipRule;
  relationshipId: string;
  availableFields: { label: string; value: string; entity?: string }[];
}

const OPERATORS: { value: RuleCondition['operator']; label: string }[] = [
  { value: '==', label: '==' },
  { value: '!=', label: '!=' },
  { value: '>', label: '>' },
  { value: '<', label: '<' },
  { value: '>=', label: '>=' },
  { value: '<=', label: '<=' },
  { value: 'IS_NULL', label: 'IS NULL' },
  { value: 'IS_NOT_NULL', label: 'IS NOT NULL' },
  { value: 'IN', label: 'IN' },
  { value: 'NOT_IN', label: 'NOT IN' },
];

const LOGICAL_OPERATORS: ('AND' | 'OR')[] = ['AND', 'OR'];

export const VisualConditionBuilder = ({ 
  rule, 
  relationshipId,
  availableFields,
}: VisualConditionBuilderProps) => {
  const { updateRelationshipRule } = useSchemaStore();

  const conditions = rule.conditions || [];

  const addCondition = () => {
    const newCondition: RuleCondition = {
      id: crypto.randomUUID(),
      type: 'comparison',
      leftOperand: availableFields[0]?.value || '',
      operator: '==',
      rightOperand: '',
      logicalOperator: conditions.length > 0 ? 'AND' : undefined,
    };
    
    updateRelationshipRule(relationshipId, rule.id, {
      conditions: [...conditions, newCondition],
    });
  };

  const updateCondition = (conditionId: string, updates: Partial<RuleCondition>) => {
    updateRelationshipRule(relationshipId, rule.id, {
      conditions: conditions.map(c => 
        c.id === conditionId ? { ...c, ...updates } : c
      ),
    });
  };

  const deleteCondition = (conditionId: string) => {
    const newConditions = conditions.filter(c => c.id !== conditionId);
    // Clear logical operator from first condition
    if (newConditions.length > 0 && newConditions[0].logicalOperator) {
      newConditions[0] = { ...newConditions[0], logicalOperator: undefined };
    }
    updateRelationshipRule(relationshipId, rule.id, { conditions: newConditions });
  };

  // Generate DSL preview from conditions
  const generateDslPreview = (): string => {
    if (conditions.length === 0) return '# Add conditions above';
    
    const lines: string[] = [`${rule.trigger}:`];
    
    conditions.forEach((cond, index) => {
      const prefix = index === 0 ? '  IF ' : `  ${cond.logicalOperator || 'AND'} `;
      let conditionStr = `${cond.leftOperand} ${cond.operator}`;
      
      if (!['IS_NULL', 'IS_NOT_NULL'].includes(cond.operator)) {
        conditionStr += ` ${cond.rightOperand}`;
      }
      
      lines.push(prefix + conditionStr);
    });

    // Add action
    if (rule.action.type === 'THROW_ERROR') {
      lines.push(`    THROW Error("${rule.action.errorMessage || 'Validation failed'}")`);
    } else if (rule.action.type === 'BLOCK') {
      lines.push('    BLOCK');
    } else {
      lines.push(`    ${rule.action.type}`);
    }

    return lines.join('\n');
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-xs text-muted-foreground">Conditions</Label>
        <Button
          size="sm"
          variant="ghost"
          onClick={addCondition}
          className="h-6 text-xs gap-1"
        >
          <Plus className="w-3 h-3" />
          Add
        </Button>
      </div>

      {conditions.length === 0 ? (
        <div className="text-center p-4 rounded-lg bg-muted/30 border border-dashed border-border">
          <p className="text-xs text-muted-foreground">
            No conditions. Click "Add" to create IF/AND/OR blocks.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {conditions.map((condition, index) => (
            <ConditionRow
              key={condition.id}
              condition={condition}
              index={index}
              availableFields={availableFields}
              onUpdate={(updates) => updateCondition(condition.id, updates)}
              onDelete={() => deleteCondition(condition.id)}
            />
          ))}
        </div>
      )}

      {/* DSL Preview */}
      <div className="mt-3 p-2 rounded bg-muted/50 border border-border">
        <Label className="text-[10px] text-muted-foreground mb-1 block">Generated DSL</Label>
        <pre className="text-[10px] font-mono text-foreground/80 whitespace-pre-wrap">
          {generateDslPreview()}
        </pre>
      </div>
    </div>
  );
};

// Individual condition row
const ConditionRow = ({
  condition,
  index,
  availableFields,
  onUpdate,
  onDelete,
}: {
  condition: RuleCondition;
  index: number;
  availableFields: { label: string; value: string; entity?: string }[];
  onUpdate: (updates: Partial<RuleCondition>) => void;
  onDelete: () => void;
}) => {
  const showRightOperand = !['IS_NULL', 'IS_NOT_NULL'].includes(condition.operator);

  return (
    <div className="flex flex-col gap-2 p-2 rounded-lg bg-card border border-border">
      {/* Logical Operator (for non-first conditions) */}
      {index > 0 && (
        <div className="flex items-center gap-2">
          <Badge 
            variant="secondary" 
            className={cn(
              "cursor-pointer text-[10px] h-5",
              condition.logicalOperator === 'OR' && "bg-yellow-500/20 text-yellow-600"
            )}
            onClick={() => onUpdate({ 
              logicalOperator: condition.logicalOperator === 'AND' ? 'OR' : 'AND' 
            })}
          >
            {condition.logicalOperator || 'AND'}
          </Badge>
          <span className="text-[10px] text-muted-foreground">(click to toggle)</span>
        </div>
      )}

      <div className="flex items-center gap-2">
        {/* Left Operand */}
        <Select
          value={condition.leftOperand}
          onValueChange={(v) => onUpdate({ leftOperand: v })}
        >
          <SelectTrigger className="h-7 text-[10px] flex-1 min-w-0">
            <SelectValue placeholder="Field..." />
          </SelectTrigger>
          <SelectContent>
            {availableFields.map((field) => (
              <SelectItem key={field.value} value={field.value} className="text-xs">
                {field.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Operator */}
        <Select
          value={condition.operator}
          onValueChange={(v: RuleCondition['operator']) => onUpdate({ operator: v })}
        >
          <SelectTrigger className="h-7 text-[10px] w-20">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {OPERATORS.map((op) => (
              <SelectItem key={op.value} value={op.value} className="text-xs font-mono">
                {op.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Right Operand */}
        {showRightOperand && (
          <Input
            value={condition.rightOperand}
            onChange={(e) => onUpdate({ rightOperand: e.target.value })}
            className="h-7 text-[10px] flex-1 min-w-0 font-mono"
            placeholder="value"
          />
        )}

        {/* Delete */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onDelete}
          className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
        >
          <Trash2 className="w-3 h-3" />
        </Button>
      </div>
    </div>
  );
};
