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
}

export type RelationType = 'one-to-many' | 'one-to-one' | 'many-to-many';

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
  relations: Relation[];
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

// Validation helpers
export interface ValidationError {
  type: 'error' | 'warning';
  entityId?: string;
  fieldId?: string;
  relationId?: string;
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

  // Validate relations
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
