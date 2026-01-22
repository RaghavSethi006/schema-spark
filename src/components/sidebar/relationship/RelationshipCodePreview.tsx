import { useMemo } from 'react';
import { 
  FileCode2, 
  Copy,
  Check,
  Database,
  Server,
  AlertTriangle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useSchemaStore } from '@/lib/store';
import { 
  Relationship, 
  FIELD_TYPES,
  generateDslFromRule,
} from '@/lib/schema';
import { cn } from '@/lib/utils';
import { useState } from 'react';

interface RelationshipCodePreviewProps {
  relationship: Relationship;
}

export const RelationshipCodePreview = ({ relationship }: RelationshipCodePreviewProps) => {
  const { schema } = useSchemaStore();
  const [copied, setCopied] = useState<string | null>(null);

  // Get entity helpers
  const getEntity = (entityId: string) => schema.entities.find(e => e.id === entityId);
  const getField = (entityId: string, fieldId: string) => {
    const entity = getEntity(entityId);
    return entity?.fields.find(f => f.id === fieldId);
  };

  // Generate relationship definition DSL
  const relationshipDsl = useMemo(() => {
    const lines: string[] = [];
    
    lines.push(`RELATIONSHIP ${relationship.name} (`);
    
    // Connections
    relationship.connections.forEach((conn, i) => {
      const entity = getEntity(conn.entityId);
      const field = getField(conn.entityId, conn.fieldId);
      if (entity && field) {
        const roleStr = conn.role ? ` AS ${conn.role}` : '';
        const comma = i < relationship.connections.length - 1 ? ',' : '';
        lines.push(`  ${entity.name}.${field.name}${roleStr} [${conn.cardinality}, ${conn.participation}]${comma}`);
      }
    });
    
    lines.push(')');
    
    // Attributes
    if (relationship.attributes.length > 0) {
      lines.push('ATTRIBUTES (');
      relationship.attributes.forEach((attr, i) => {
        const fieldType = FIELD_TYPES.find(t => t.value === attr.type);
        const nullStr = attr.isNullable ? '' : ' NOT NULL';
        const defaultStr = attr.defaultValue ? ` DEFAULT ${attr.defaultValue}` : '';
        const checkStr = attr.checkConstraint ? ` CHECK (${attr.checkConstraint})` : '';
        const comma = i < relationship.attributes.length - 1 ? ',' : '';
        lines.push(`  ${attr.name} ${fieldType?.sqlType || 'TEXT'}${nullStr}${defaultStr}${checkStr}${comma}`);
      });
      lines.push(')');
    }
    
    // Rules
    if (relationship.rules.filter(r => r.enabled).length > 0) {
      lines.push('RULES (');
      relationship.rules.filter(r => r.enabled).forEach((rule) => {
        lines.push(`  ${rule.trigger}:`);
        if (rule.dslCode) {
          rule.dslCode.split('\n').forEach(line => {
            lines.push(`    ${line}`);
          });
        } else if (rule.conditions && rule.conditions.length > 0) {
          lines.push(`    ${generateDslFromRule(rule)}`);
        }
      });
      lines.push(')');
    }
    
    // FK Behavior
    lines.push('');
    lines.push(`ON DELETE ${relationship.onDelete}`);
    lines.push(`ON UPDATE ${relationship.onUpdate}`);
    
    return lines.join('\n');
  }, [relationship, schema.entities]);

  // Generate SQL
  const sqlCode = useMemo(() => {
    const lines: string[] = [];
    
    // For many-to-many, generate junction table
    if (relationship.type === 'many-to-many' && relationship.connections.length >= 2) {
      const entities = relationship.connections.map(c => getEntity(c.entityId)).filter(Boolean);
      const tableName = entities.map(e => e!.name.toLowerCase()).join('_');
      
      lines.push(`-- Junction table for ${relationship.name}`);
      lines.push(`CREATE TABLE ${tableName} (`);
      
      // FK columns
      relationship.connections.forEach((conn, i) => {
        const entity = getEntity(conn.entityId);
        const field = getField(conn.entityId, conn.fieldId);
        if (entity && field) {
          const fieldType = FIELD_TYPES.find(t => t.value === field.type);
          const colName = conn.role 
            ? `${conn.role}_${field.name}` 
            : `${entity.name.toLowerCase()}_${field.name}`;
          const comma = i < relationship.connections.length - 1 || relationship.attributes.length > 0 ? ',' : '';
          lines.push(`  ${colName} ${fieldType?.sqlType || 'INTEGER'} NOT NULL${comma}`);
        }
      });
      
      // Relationship attributes
      relationship.attributes.forEach((attr, i) => {
        const fieldType = FIELD_TYPES.find(t => t.value === attr.type);
        const nullStr = attr.isNullable ? '' : ' NOT NULL';
        const defaultStr = attr.defaultValue ? ` DEFAULT ${attr.defaultValue}` : '';
        const comma = i < relationship.attributes.length - 1 ? ',' : '';
        lines.push(`  ${attr.name} ${fieldType?.sqlType || 'TEXT'}${nullStr}${defaultStr}${comma}`);
      });
      
      lines.push('');
      
      // Primary key
      const pkCols = relationship.connections.map(conn => {
        const entity = getEntity(conn.entityId);
        const field = getField(conn.entityId, conn.fieldId);
        if (!entity || !field) return null;
        return conn.role 
          ? `${conn.role}_${field.name}` 
          : `${entity.name.toLowerCase()}_${field.name}`;
      }).filter(Boolean);
      
      lines.push(`  PRIMARY KEY (${pkCols.join(', ')}),`);
      
      // Foreign keys
      relationship.connections.forEach((conn, i) => {
        const entity = getEntity(conn.entityId);
        const field = getField(conn.entityId, conn.fieldId);
        if (entity && field) {
          const colName = conn.role 
            ? `${conn.role}_${field.name}` 
            : `${entity.name.toLowerCase()}_${field.name}`;
          const comma = i < relationship.connections.length - 1 ? ',' : '';
          lines.push(`  FOREIGN KEY (${colName}) REFERENCES ${entity.name}(${field.name}) ON DELETE ${relationship.onDelete}${comma}`);
        }
      });
      
      lines.push(');');
      
      // Check constraints for attributes
      relationship.attributes.filter(a => a.checkConstraint).forEach(attr => {
        lines.push('');
        lines.push(`-- Check constraint for ${attr.name}`);
        lines.push(`ALTER TABLE ${tableName} ADD CONSTRAINT chk_${attr.name} CHECK (${attr.checkConstraint});`);
      });
      
    } else {
      lines.push('-- This relationship type generates FK on entity tables');
      lines.push('-- See individual entity definitions');
    }
    
    return lines.join('\n');
  }, [relationship, schema.entities]);

  // Generate Python/SQLAlchemy
  const pythonCode = useMemo(() => {
    const lines: string[] = [];
    
    if (relationship.type === 'many-to-many' && relationship.connections.length >= 2) {
      const entities = relationship.connections.map(c => getEntity(c.entityId)).filter(Boolean);
      const tableName = entities.map(e => e!.name.toLowerCase()).join('_');
      
      lines.push('# Junction table model');
      lines.push(`class ${tableName.split('_').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join('')}(Base):`);
      lines.push(`    __tablename__ = "${tableName}"`);
      lines.push('');
      
      // FK columns
      relationship.connections.forEach(conn => {
        const entity = getEntity(conn.entityId);
        const field = getField(conn.entityId, conn.fieldId);
        if (entity && field) {
          const fieldType = FIELD_TYPES.find(t => t.value === field.type);
          const colName = conn.role 
            ? `${conn.role}_${field.name}` 
            : `${entity.name.toLowerCase()}_${field.name}`;
          lines.push(`    ${colName} = Column(${fieldType?.pythonType === 'int' ? 'Integer' : 'String'}, ForeignKey("${entity.name.toLowerCase()}.${field.name}"), primary_key=True)`);
        }
      });
      
      // Relationship attributes
      relationship.attributes.forEach(attr => {
        const fieldType = FIELD_TYPES.find(t => t.value === attr.type);
        let colType = 'String';
        if (fieldType?.pythonType === 'int') colType = 'Integer';
        else if (fieldType?.pythonType === 'float') colType = 'Float';
        else if (fieldType?.pythonType === 'bool') colType = 'Boolean';
        else if (fieldType?.pythonType === 'datetime') colType = 'DateTime';
        
        const nullableStr = attr.isNullable ? ', nullable=True' : ', nullable=False';
        const defaultStr = attr.defaultValue ? `, default=${attr.defaultValue}` : '';
        lines.push(`    ${attr.name} = Column(${colType}${nullableStr}${defaultStr})`);
      });
      
      // Validation hooks
      if (relationship.rules.filter(r => r.enabled).length > 0) {
        lines.push('');
        lines.push('    @validates("*")');
        lines.push('    def validate_all(self, key, value):');
        lines.push('        # Auto-generated validation from relationship rules');
        relationship.rules.filter(r => r.enabled).forEach(rule => {
          if (rule.action.type === 'THROW_ERROR') {
            lines.push(`        # ${rule.name}`);
            lines.push(`        # ${rule.dslCode?.split('\n').join(' ') || generateDslFromRule(rule)}`);
          }
        });
        lines.push('        return value');
      }
    }
    
    return lines.join('\n');
  }, [relationship, schema.entities]);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  // Warnings
  const warnings = useMemo(() => {
    const w: string[] = [];
    
    if (relationship.connections.length < 2) {
      w.push('Relationship needs at least 2 entity connections');
    }
    
    relationship.rules.filter(r => r.enabled && !r.dslCode && (!r.conditions || r.conditions.length === 0)).forEach(rule => {
      w.push(`Rule "${rule.name}" has no conditions defined`);
    });
    
    return w;
  }, [relationship]);

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center gap-2">
        <FileCode2 className="w-4 h-4 text-primary" />
        <span className="text-sm font-medium">Code Preview</span>
      </div>

      {warnings.length > 0 && (
        <div className="p-2 rounded-lg bg-yellow-500/10 border border-yellow-500/20 space-y-1">
          {warnings.map((w, i) => (
            <div key={i} className="flex items-start gap-2 text-xs text-yellow-600">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              <span>{w}</span>
            </div>
          ))}
        </div>
      )}

      <Tabs defaultValue="dsl" className="w-full">
        <TabsList className="w-full grid grid-cols-3 h-7">
          <TabsTrigger value="dsl" className="text-[10px]">DSL</TabsTrigger>
          <TabsTrigger value="sql" className="text-[10px]">SQL</TabsTrigger>
          <TabsTrigger value="python" className="text-[10px]">Python</TabsTrigger>
        </TabsList>

        <TabsContent value="dsl" className="mt-2">
          <CodeBlock
            code={relationshipDsl}
            onCopy={() => copyToClipboard(relationshipDsl, 'dsl')}
            copied={copied === 'dsl'}
          />
        </TabsContent>

        <TabsContent value="sql" className="mt-2">
          <CodeBlock
            code={sqlCode}
            onCopy={() => copyToClipboard(sqlCode, 'sql')}
            copied={copied === 'sql'}
          />
        </TabsContent>

        <TabsContent value="python" className="mt-2">
          <CodeBlock
            code={pythonCode}
            onCopy={() => copyToClipboard(pythonCode, 'python')}
            copied={copied === 'python'}
          />
        </TabsContent>
      </Tabs>

      {/* Code generation info */}
      <div className="p-2 rounded bg-muted/50 border border-border">
        <Label className="text-[10px] text-muted-foreground">Export Info</Label>
        <div className="mt-1 flex flex-wrap gap-1">
          <Badge variant="secondary" className="text-[9px] h-4">
            <Database className="w-2.5 h-2.5 mr-1" />
            {relationship.type === 'many-to-many' ? 'Junction Table' : 'FK Reference'}
          </Badge>
          <Badge variant="secondary" className="text-[9px] h-4">
            <Server className="w-2.5 h-2.5 mr-1" />
            {relationship.rules.filter(r => r.enabled).length} Rules
          </Badge>
          <Badge variant="secondary" className="text-[9px] h-4">
            {relationship.attributes.length} Attributes
          </Badge>
        </div>
      </div>
    </div>
  );
};

// Code block component
const CodeBlock = ({ 
  code, 
  onCopy, 
  copied 
}: { 
  code: string; 
  onCopy: () => void; 
  copied: boolean;
}) => (
  <div className="relative">
    <Button
      variant="ghost"
      size="sm"
      onClick={onCopy}
      className="absolute top-2 right-2 h-6 w-6 p-0"
    >
      {copied ? (
        <Check className="w-3 h-3 text-green-500" />
      ) : (
        <Copy className="w-3 h-3" />
      )}
    </Button>
    <pre className="p-3 rounded-lg bg-card border border-border text-[10px] font-mono overflow-x-auto max-h-60 overflow-y-auto">
      {code || '# No code generated yet'}
    </pre>
  </div>
);
