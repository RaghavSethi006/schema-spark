// ERForge Schema Types - Single Source of Truth
// This JSON schema is used by the UI and all code generators

export type FieldType = 
  | 'integer'
  | 'string'
  | 'text'
  | 'boolean'
  | 'float'
  | 'datetime'
  | 'date'
  | 'uuid';

export interface Field {
  id: string;
  name: string;
  type: FieldType;
  isPrimaryKey: boolean;
  isNullable: boolean;
  isUnique: boolean;
  isForeignKey: boolean;
  foreignKeyRef?: {
    entityId: string;
    fieldId: string;
  };
  defaultValue?: string;
}

export interface Entity {
  id: string;
  name: string;
  fields: Field[];
  position: { x: number; y: number };
  isWeak?: boolean; // Weak entity depends on another entity
}

// ============================================
// RELATIONSHIP AS FIRST-CLASS ENTITY
// ============================================

export type RelationType = 'one-to-one' | 'one-to-many' | 'many-to-many';
export type ParticipationType = 'total' | 'partial';
export type OnDeleteAction = 'CASCADE' | 'SET_NULL' | 'RESTRICT' | 'NO_ACTION';
export type OnUpdateAction = 'CASCADE' | 'SET_NULL' | 'RESTRICT' | 'NO_ACTION';
export type RuleTrigger = 'BEFORE_CREATE' | 'AFTER_CREATE' | 'BEFORE_DELETE' | 'AFTER_DELETE' | 'BEFORE_UPDATE' | 'AFTER_UPDATE';
export type RuleScope = 'database' | 'backend' | 'both';

// Relationship Attribute (like enrollment_date, grade, etc.)
export interface RelationshipAttribute {
  id: string;
  name: string;
  type: FieldType;
  isNullable: boolean;
  defaultValue?: string;
  checkConstraint?: string; // e.g., "grade BETWEEN 0 AND 100"
}

// Connection from relationship to an entity
export interface RelationshipConnection {
  id: string;
  entityId: string;
  fieldId: string; // The field used for the connection
  cardinality: '1' | 'N' | 'M';
  participation: ParticipationType;
  role?: string; // e.g., "manager", "employee" for recursive relationships
}

// Logic Rule for relationships
export interface RelationshipRule {
  id: string;
  name: string;
  description?: string;
  trigger: RuleTrigger;
  scope: RuleScope;
  enabled: boolean;
  
  // The rule can be defined as structured conditions OR raw DSL
  conditions?: RuleCondition[];
  dslCode?: string; // Raw pseudo-code/DSL for advanced users
  
  // Actions to take
  action: RuleAction;
}

export interface RuleCondition {
  id: string;
  type: 'comparison' | 'cardinality' | 'temporal' | 'null_check' | 'custom';
  leftOperand: string; // e.g., "employee.id", "relationship.grade"
  operator: '==' | '!=' | '>' | '<' | '>=' | '<=' | 'IS_NULL' | 'IS_NOT_NULL' | 'IN' | 'NOT_IN';
  rightOperand: string; // e.g., "manager.id", "100", "['active', 'pending']"
  logicalOperator?: 'AND' | 'OR'; // For chaining conditions
}

export interface RuleAction {
  type: 'THROW_ERROR' | 'BLOCK' | 'UPDATE_FIELD' | 'LOG' | 'CUSTOM';
  errorMessage?: string;
  updateField?: {
    entity: string;
    field: string;
    value: string;
  };
  customCode?: string;
}

// Constraint on the relationship
export interface RelationshipConstraint {
  id: string;
  name: string;
  type: 'unique' | 'check' | 'max_relations' | 'temporal' | 'custom';
  enabled: boolean;
  
  // For unique constraints
  uniqueFields?: string[]; // Combination of attribute/entity field names
  
  // For check constraints
  checkExpression?: string; // SQL-like expression
  
  // For max_relations
  maxRelationsConfig?: {
    entityId: string;
    limit: number;
  };
  
  // For temporal constraints
  temporalConfig?: {
    startField: string;
    endField: string;
    allowOverlap: boolean;
  };
  
  // For custom
  customDsl?: string;
}

// The main Relationship entity (diamond shape in ER diagrams)
export interface Relationship {
  id: string;
  name: string;
  type: RelationType;
  position: { x: number; y: number };
  
  // Connections to entities (2 or more for ternary+)
  connections: RelationshipConnection[];
  
  // Relationship's own attributes
  attributes: RelationshipAttribute[];
  
  // Foreign key behavior
  onDelete: OnDeleteAction;
  onUpdate: OnUpdateAction;
  
  // Logic rules (business logic)
  rules: RelationshipRule[];
  
  // Constraints
  constraints: RelationshipConstraint[];
  
  // Visual properties
  isIdentifying: boolean; // Identifying vs non-identifying relationship
  isRecursive: boolean; // Self-referencing relationship
  
  // Description for documentation
  description?: string;
}

// Legacy Relation type for backward compatibility
export interface Relation {
  id: string;
  type: RelationType;
  sourceEntityId: string;
  sourceFieldId: string;
  targetEntityId: string;
  targetFieldId: string;
}

export interface ERSchema {
  version: string;
  name: string;
  entities: Entity[];
  relations: Relation[]; // Legacy - kept for backward compatibility
  relationships: Relationship[]; // New first-class relationships
  createdAt: string;
  updatedAt: string;
}

// Field type display information
export const FIELD_TYPES: { value: FieldType; label: string; sqlType: string; pythonType: string }[] = [
  { value: 'integer', label: 'Integer', sqlType: 'INTEGER', pythonType: 'int' },
  { value: 'string', label: 'String (255)', sqlType: 'VARCHAR(255)', pythonType: 'str' },
  { value: 'text', label: 'Text', sqlType: 'TEXT', pythonType: 'str' },
  { value: 'boolean', label: 'Boolean', sqlType: 'BOOLEAN', pythonType: 'bool' },
  { value: 'float', label: 'Float', sqlType: 'REAL', pythonType: 'float' },
  { value: 'datetime', label: 'DateTime', sqlType: 'DATETIME', pythonType: 'datetime' },
  { value: 'date', label: 'Date', sqlType: 'DATE', pythonType: 'date' },
  { value: 'uuid', label: 'UUID', sqlType: 'VARCHAR(36)', pythonType: 'str' },
];

// Default empty schema
export const createEmptySchema = (name: string = 'Untitled Project'): ERSchema => ({
  version: '1.0.0',
  name,
  entities: [],
  relations: [],
  relationships: [],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

// Create a new entity with default ID field
export const createEntity = (name: string, position: { x: number; y: number }): Entity => ({
  id: crypto.randomUUID(),
  name,
  fields: [
    {
      id: crypto.randomUUID(),
      name: 'id',
      type: 'integer',
      isPrimaryKey: true,
      isNullable: false,
      isUnique: true,
      isForeignKey: false,
    },
  ],
  position,
});

// Create a new field
export const createField = (name: string = 'new_field'): Field => ({
  id: crypto.randomUUID(),
  name,
  type: 'string',
  isPrimaryKey: false,
  isNullable: true,
  isUnique: false,
  isForeignKey: false,
});

// Create a new relationship
export const createRelationship = (
  name: string, 
  position: { x: number; y: number },
  type: RelationType = 'one-to-many'
): Relationship => ({
  id: crypto.randomUUID(),
  name,
  type,
  position,
  connections: [],
  attributes: [],
  onDelete: 'RESTRICT',
  onUpdate: 'CASCADE',
  rules: [],
  constraints: [],
  isIdentifying: false,
  isRecursive: false,
});

// Create a relationship attribute
export const createRelationshipAttribute = (name: string = 'new_attribute'): RelationshipAttribute => ({
  id: crypto.randomUUID(),
  name,
  type: 'string',
  isNullable: true,
});

// Create a relationship connection
export const createRelationshipConnection = (
  entityId: string,
  fieldId: string,
  cardinality: '1' | 'N' | 'M' = '1',
  participation: ParticipationType = 'partial'
): RelationshipConnection => ({
  id: crypto.randomUUID(),
  entityId,
  fieldId,
  cardinality,
  participation,
});

// Create a relationship rule
export const createRelationshipRule = (name: string = 'New Rule'): RelationshipRule => ({
  id: crypto.randomUUID(),
  name,
  trigger: 'BEFORE_CREATE',
  scope: 'both',
  enabled: true,
  conditions: [],
  action: {
    type: 'THROW_ERROR',
    errorMessage: 'Validation failed',
  },
});

// Create a relationship constraint
export const createRelationshipConstraint = (name: string = 'New Constraint'): RelationshipConstraint => ({
  id: crypto.randomUUID(),
  name,
  type: 'check',
  enabled: true,
});

// Validation helpers
export interface ValidationError {
  type: 'error' | 'warning';
  entityId?: string;
  fieldId?: string;
  relationId?: string;
  relationshipId?: string;
  message: string;
}

export const validateSchema = (schema: ERSchema): ValidationError[] => {
  const errors: ValidationError[] = [];

  // Check each entity
  schema.entities.forEach((entity) => {
    // Check for primary key
    const hasPrimaryKey = entity.fields.some((f) => f.isPrimaryKey);
    if (!hasPrimaryKey) {
      errors.push({
        type: 'error',
        entityId: entity.id,
        message: `Entity "${entity.name}" has no primary key`,
      });
    }

    // Check for empty entity name
    if (!entity.name.trim()) {
      errors.push({
        type: 'error',
        entityId: entity.id,
        message: 'Entity has no name',
      });
    }

    // Check for duplicate field names
    const fieldNames = entity.fields.map((f) => f.name.toLowerCase());
    const duplicates = fieldNames.filter((name, index) => fieldNames.indexOf(name) !== index);
    if (duplicates.length > 0) {
      errors.push({
        type: 'error',
        entityId: entity.id,
        message: `Entity "${entity.name}" has duplicate field names: ${[...new Set(duplicates)].join(', ')}`,
      });
    }

    // Check each field
    entity.fields.forEach((field) => {
      if (!field.name.trim()) {
        errors.push({
          type: 'error',
          entityId: entity.id,
          fieldId: field.id,
          message: `Field in "${entity.name}" has no name`,
        });
      }

      // Validate foreign key references
      if (field.isForeignKey && field.foreignKeyRef) {
        const targetEntity = schema.entities.find((e) => e.id === field.foreignKeyRef?.entityId);
        if (!targetEntity) {
          errors.push({
            type: 'error',
            entityId: entity.id,
            fieldId: field.id,
            message: `Foreign key "${field.name}" references non-existent entity`,
          });
        } else {
          const targetField = targetEntity.fields.find((f) => f.id === field.foreignKeyRef?.fieldId);
          if (!targetField) {
            errors.push({
              type: 'error',
              entityId: entity.id,
              fieldId: field.id,
              message: `Foreign key "${field.name}" references non-existent field`,
            });
          }
        }
      }
    });
  });

  // Check for duplicate entity names
  const entityNames = schema.entities.map((e) => e.name.toLowerCase());
  const duplicateEntities = entityNames.filter((name, index) => entityNames.indexOf(name) !== index);
  if (duplicateEntities.length > 0) {
    errors.push({
      type: 'error',
      message: `Duplicate entity names: ${[...new Set(duplicateEntities)].join(', ')}`,
    });
  }

  // Validate relationships
  schema.relationships.forEach((relationship) => {
    // Check for at least 2 connections
    if (relationship.connections.length < 2) {
      errors.push({
        type: 'error',
        relationshipId: relationship.id,
        message: `Relationship "${relationship.name}" must connect at least 2 entities`,
      });
    }

    // Check if connected entities exist
    relationship.connections.forEach((conn) => {
      const entity = schema.entities.find((e) => e.id === conn.entityId);
      if (!entity) {
        errors.push({
          type: 'error',
          relationshipId: relationship.id,
          message: `Relationship "${relationship.name}" references non-existent entity`,
        });
      } else {
        const field = entity.fields.find((f) => f.id === conn.fieldId);
        if (!field) {
          errors.push({
            type: 'error',
            relationshipId: relationship.id,
            message: `Relationship "${relationship.name}" references non-existent field in "${entity.name}"`,
          });
        }
      }
    });

    // Check for empty relationship name
    if (!relationship.name.trim()) {
      errors.push({
        type: 'error',
        relationshipId: relationship.id,
        message: 'Relationship has no name',
      });
    }

    // Check relationship attributes
    relationship.attributes.forEach((attr) => {
      if (!attr.name.trim()) {
        errors.push({
          type: 'warning',
          relationshipId: relationship.id,
          message: `Relationship "${relationship.name}" has an attribute without a name`,
        });
      }
    });

    // Validate rules
    relationship.rules.forEach((rule) => {
      if (rule.enabled && !rule.conditions?.length && !rule.dslCode) {
        errors.push({
          type: 'warning',
          relationshipId: relationship.id,
          message: `Rule "${rule.name}" in "${relationship.name}" has no conditions defined`,
        });
      }
    });
  });

  // Legacy relations validation
  schema.relations.forEach((relation) => {
    const sourceEntity = schema.entities.find((e) => e.id === relation.sourceEntityId);
    const targetEntity = schema.entities.find((e) => e.id === relation.targetEntityId);

    if (!sourceEntity) {
      errors.push({
        type: 'error',
        relationId: relation.id,
        message: 'Relation references non-existent source entity',
      });
    }

    if (!targetEntity) {
      errors.push({
        type: 'error',
        relationId: relation.id,
        message: 'Relation references non-existent target entity',
      });
    }
  });

  return errors;
};

// Helper to derive relation type from cardinalities
export const deriveRelationType = (conn1: RelationshipConnection, conn2: RelationshipConnection): RelationType => {
  const c1 = conn1.cardinality;
  const c2 = conn2.cardinality;
  
  if (c1 === '1' && c2 === '1') return 'one-to-one';
  if ((c1 === '1' && (c2 === 'N' || c2 === 'M')) || ((c1 === 'N' || c1 === 'M') && c2 === '1')) return 'one-to-many';
  return 'many-to-many';
};

// Generate DSL code from rule conditions
export const generateDslFromRule = (rule: RelationshipRule): string => {
  if (rule.dslCode) return rule.dslCode;
  if (!rule.conditions || rule.conditions.length === 0) return '# No conditions defined';

  const conditionStrings = rule.conditions.map((cond, index) => {
    const prefix = index > 0 ? `  ${cond.logicalOperator || 'AND'} ` : 'IF ';
    return `${prefix}${cond.leftOperand} ${cond.operator} ${cond.rightOperand}`;
  });

  let actionStr = '';
  switch (rule.action.type) {
    case 'THROW_ERROR':
      actionStr = `  THROW Error("${rule.action.errorMessage || 'Validation failed'}")`;
      break;
    case 'BLOCK':
      actionStr = '  BLOCK operation';
      break;
    case 'UPDATE_FIELD':
      if (rule.action.updateField) {
        actionStr = `  UPDATE ${rule.action.updateField.entity}.${rule.action.updateField.field} = ${rule.action.updateField.value}`;
      }
      break;
    case 'LOG':
      actionStr = '  LOG event';
      break;
    case 'CUSTOM':
      actionStr = rule.action.customCode || '  # Custom action';
      break;
  }

  return `# Rule: ${rule.name}\n# Trigger: ${rule.trigger}\n${conditionStrings.join('\n')}\nTHEN\n${actionStr}`;
};
