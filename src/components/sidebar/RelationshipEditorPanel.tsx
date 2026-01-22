import { useState } from 'react';
import { 
  Diamond, 
  Trash2, 
  Plus, 
  Link2,
  Unlink,
  Settings,
  ChevronDown,
  AlertCircle,
  CheckCircle,
  Code,
  Workflow,
  FileCode2,
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
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { useSchemaStore } from '@/lib/store';
import { 
  RelationType, 
  ParticipationType, 
  OnDeleteAction,
  FIELD_TYPES,
  FieldType,
  Relationship,
  RelationshipConnection,
} from '@/lib/schema';
import { cn } from '@/lib/utils';
import { ConnectionManager } from './relationship/ConnectionManager';
import { AttributeManager } from './relationship/AttributeManager';
import { LogicRuleEditor } from './relationship/LogicRuleEditor';
import { RelationshipCodePreview } from './relationship/RelationshipCodePreview';

export const RelationshipEditorPanel = () => {
  const { 
    schema,
    selectedRelationshipId, 
    getRelationshipById,
    updateRelationship,
    deleteRelationship,
  } = useSchemaStore();

  const relationship = selectedRelationshipId ? getRelationshipById(selectedRelationshipId) : null;

  if (!relationship) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 mb-4 rounded-full bg-muted flex items-center justify-center">
          <Diamond className="w-8 h-8 text-muted-foreground" />
        </div>
        <h3 className="font-medium mb-2">No Relationship Selected</h3>
        <p className="text-sm text-muted-foreground">
          Click on a relationship diamond in the canvas to edit its properties
        </p>
      </div>
    );
  }

  // Validation status
  const isValid = relationship.connections.length >= 2;
  const connectionCount = relationship.connections.length;

  return (
    <ScrollArea className="h-full">
      <div className="flex flex-col animate-slide-in-right">
        {/* Relationship Header */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Diamond className="w-5 h-5 text-primary" />
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Relationship
              </span>
            </div>
            {isValid ? (
              <Badge variant="outline" className="text-green-500 border-green-500/30 bg-green-500/10">
                <CheckCircle className="w-3 h-3 mr-1" />
                Valid
              </Badge>
            ) : (
              <Badge variant="outline" className="text-destructive border-destructive/30 bg-destructive/10">
                <AlertCircle className="w-3 h-3 mr-1" />
                Incomplete
              </Badge>
            )}
          </div>
          
          <Input
            value={relationship.name}
            onChange={(e) => updateRelationship(relationship.id, { name: e.target.value })}
            className="font-semibold text-lg h-10 mb-3"
            placeholder="Relationship name"
          />

          {/* Validation message */}
          {!isValid && (
            <div className="p-2 rounded-lg bg-destructive/10 border border-destructive/20 text-xs text-destructive flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>
                Relationships require at least 2 entity connections. 
                Currently: {connectionCount} connection{connectionCount !== 1 ? 's' : ''}.
              </span>
            </div>
          )}
        </div>

        {/* Tabbed Content */}
        <Tabs defaultValue="connections" className="flex-1">
          <div className="px-4 pt-2 border-b border-border">
            <TabsList className="w-full grid grid-cols-4 h-8">
              <TabsTrigger value="connections" className="text-[10px] gap-0.5 px-1">
                <Link2 className="w-3 h-3" />
                <span className="hidden sm:inline">Connect</span>
              </TabsTrigger>
              <TabsTrigger value="attributes" className="text-[10px] gap-0.5 px-1">
                <Settings className="w-3 h-3" />
                <span className="hidden sm:inline">Attrs</span>
              </TabsTrigger>
              <TabsTrigger value="logic" className="text-[10px] gap-0.5 px-1">
                <Workflow className="w-3 h-3" />
                <span className="hidden sm:inline">Logic</span>
              </TabsTrigger>
              <TabsTrigger value="code" className="text-[10px] gap-0.5 px-1">
                <FileCode2 className="w-3 h-3" />
                <span className="hidden sm:inline">Code</span>
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="connections" className="m-0">
            <ConnectionManager relationship={relationship} />
          </TabsContent>

          <TabsContent value="attributes" className="m-0">
            <AttributeManager relationship={relationship} />
          </TabsContent>

          <TabsContent value="logic" className="m-0">
            <LogicRuleEditor relationship={relationship} />
          </TabsContent>

          <TabsContent value="code" className="m-0">
            <RelationshipCodePreview relationship={relationship} />
          </TabsContent>
        </Tabs>

        {/* Footer with settings and delete */}
        <div className="p-4 border-t border-border space-y-3">
          {/* Quick Settings */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Type</Label>
              <Select
                value={relationship.type}
                onValueChange={(v) => updateRelationship(relationship.id, { type: v as RelationType })}
              >
                <SelectTrigger className="h-7 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="one-to-one">1:1 (One-to-One)</SelectItem>
                  <SelectItem value="one-to-many">1:N (One-to-Many)</SelectItem>
                  <SelectItem value="many-to-many">N:M (Many-to-Many)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">On Delete</Label>
              <Select
                value={relationship.onDelete}
                onValueChange={(v) => updateRelationship(relationship.id, { onDelete: v as OnDeleteAction })}
              >
                <SelectTrigger className="h-7 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CASCADE">CASCADE</SelectItem>
                  <SelectItem value="SET_NULL">SET NULL</SelectItem>
                  <SelectItem value="RESTRICT">RESTRICT</SelectItem>
                  <SelectItem value="NO_ACTION">NO ACTION</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Toggles */}
          <div className="flex items-center justify-between text-sm">
            <span>Identifying Relationship</span>
            <Switch
              checked={relationship.isIdentifying}
              onCheckedChange={(checked) => updateRelationship(relationship.id, { isIdentifying: checked })}
            />
          </div>
          <div className="flex items-center justify-between text-sm">
            <span>Recursive (Self-Reference)</span>
            <Switch
              checked={relationship.isRecursive}
              onCheckedChange={(checked) => updateRelationship(relationship.id, { isRecursive: checked })}
            />
          </div>

          <Separator />

          {/* Delete */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => deleteRelationship(relationship.id)}
            className="w-full h-8 text-destructive border-destructive/30 hover:text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="w-3.5 h-3.5 mr-2" />
            Delete Relationship
          </Button>
        </div>
      </div>
    </ScrollArea>
  );
};
