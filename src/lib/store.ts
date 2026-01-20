import { create } from 'zustand';
import { 
  ERSchema, 
  Entity, 
  Field, 
  Relation, 
  Relationship,
  RelationshipAttribute,
  RelationshipConnection,
  RelationshipRule,
  RelationshipConstraint,
  createEmptySchema, 
  createEntity, 
  createField,
  createRelationship,
  createRelationshipAttribute,
  createRelationshipConnection,
  createRelationshipRule,
  createRelationshipConstraint,
  RelationType,
  ParticipationType,
} from './schema';

interface SchemaStore {
  schema: ERSchema;
  selectedEntityId: string | null;
  selectedFieldId: string | null;
  selectedRelationshipId: string | null;
  
  // Schema actions
  setSchema: (schema: ERSchema) => void;
  setSchemaName: (name: string) => void;
  resetSchema: () => void;
  
  // Entity actions
  addEntity: (name: string, position: { x: number; y: number }) => Entity;
  updateEntity: (id: string, updates: Partial<Entity>) => void;
  deleteEntity: (id: string) => void;
  setEntityPosition: (id: string, position: { x: number; y: number }) => void;
  
  // Field actions
  addField: (entityId: string, name?: string) => Field | null;
  updateField: (entityId: string, fieldId: string, updates: Partial<Field>) => void;
  deleteField: (entityId: string, fieldId: string) => void;
  
  // Legacy Relation actions (for backward compatibility)
  addRelation: (relation: Omit<Relation, 'id'>) => Relation;
  updateRelation: (id: string, updates: Partial<Relation>) => void;
  deleteRelation: (id: string) => void;
  
  // NEW: Relationship (first-class) actions
  addRelationship: (name: string, position: { x: number; y: number }, type?: RelationType) => Relationship;
  updateRelationship: (id: string, updates: Partial<Relationship>) => void;
  deleteRelationship: (id: string) => void;
  setRelationshipPosition: (id: string, position: { x: number; y: number }) => void;
  
  // Relationship connection actions
  addRelationshipConnection: (relationshipId: string, entityId: string, fieldId: string, cardinality?: '1' | 'N' | 'M', participation?: ParticipationType) => RelationshipConnection | null;
  updateRelationshipConnection: (relationshipId: string, connectionId: string, updates: Partial<RelationshipConnection>) => void;
  deleteRelationshipConnection: (relationshipId: string, connectionId: string) => void;
  
  // Relationship attribute actions
  addRelationshipAttribute: (relationshipId: string, name?: string) => RelationshipAttribute | null;
  updateRelationshipAttribute: (relationshipId: string, attributeId: string, updates: Partial<RelationshipAttribute>) => void;
  deleteRelationshipAttribute: (relationshipId: string, attributeId: string) => void;
  
  // Relationship rule actions
  addRelationshipRule: (relationshipId: string, name?: string) => RelationshipRule | null;
  updateRelationshipRule: (relationshipId: string, ruleId: string, updates: Partial<RelationshipRule>) => void;
  deleteRelationshipRule: (relationshipId: string, ruleId: string) => void;
  
  // Relationship constraint actions
  addRelationshipConstraint: (relationshipId: string, name?: string) => RelationshipConstraint | null;
  updateRelationshipConstraint: (relationshipId: string, constraintId: string, updates: Partial<RelationshipConstraint>) => void;
  deleteRelationshipConstraint: (relationshipId: string, constraintId: string) => void;
  
  // Selection actions
  selectEntity: (id: string | null) => void;
  selectField: (id: string | null) => void;
  selectRelationship: (id: string | null) => void;
  
  // Helpers
  getEntityById: (id: string) => Entity | undefined;
  getFieldById: (entityId: string, fieldId: string) => Field | undefined;
  getRelationshipById: (id: string) => Relationship | undefined;
}

export const useSchemaStore = create<SchemaStore>((set, get) => ({
  schema: createEmptySchema(),
  selectedEntityId: null,
  selectedFieldId: null,
  selectedRelationshipId: null,
  
  setSchema: (schema) => set({ schema: { ...schema, relationships: schema.relationships || [] } }),
  
  setSchemaName: (name) => set((state) => ({
    schema: {
      ...state.schema,
      name,
      updatedAt: new Date().toISOString(),
    },
  })),
  
  resetSchema: () => set({
    schema: createEmptySchema(),
    selectedEntityId: null,
    selectedFieldId: null,
    selectedRelationshipId: null,
  }),
  
  // Entity actions
  addEntity: (name, position) => {
    const entity = createEntity(name, position);
    set((state) => ({
      schema: {
        ...state.schema,
        entities: [...state.schema.entities, entity],
        updatedAt: new Date().toISOString(),
      },
      selectedEntityId: entity.id,
      selectedRelationshipId: null,
    }));
    return entity;
  },
  
  updateEntity: (id, updates) => set((state) => ({
    schema: {
      ...state.schema,
      entities: state.schema.entities.map((e) =>
        e.id === id ? { ...e, ...updates } : e
      ),
      updatedAt: new Date().toISOString(),
    },
  })),
  
  deleteEntity: (id) => set((state) => ({
    schema: {
      ...state.schema,
      entities: state.schema.entities.filter((e) => e.id !== id),
      relations: state.schema.relations.filter(
        (r) => r.sourceEntityId !== id && r.targetEntityId !== id
      ),
      // Remove connections to deleted entity from relationships
      relationships: state.schema.relationships.map((rel) => ({
        ...rel,
        connections: rel.connections.filter((conn) => conn.entityId !== id),
      })),
      updatedAt: new Date().toISOString(),
    },
    selectedEntityId: state.selectedEntityId === id ? null : state.selectedEntityId,
  })),
  
  setEntityPosition: (id, position) => set((state) => ({
    schema: {
      ...state.schema,
      entities: state.schema.entities.map((e) =>
        e.id === id ? { ...e, position } : e
      ),
    },
  })),
  
  // Field actions
  addField: (entityId, name) => {
    const entity = get().schema.entities.find((e) => e.id === entityId);
    if (!entity) return null;
    
    const field = createField(name || `field_${entity.fields.length}`);
    set((state) => ({
      schema: {
        ...state.schema,
        entities: state.schema.entities.map((e) =>
          e.id === entityId ? { ...e, fields: [...e.fields, field] } : e
        ),
        updatedAt: new Date().toISOString(),
      },
      selectedFieldId: field.id,
    }));
    return field;
  },
  
  updateField: (entityId, fieldId, updates) => set((state) => ({
    schema: {
      ...state.schema,
      entities: state.schema.entities.map((e) =>
        e.id === entityId
          ? {
              ...e,
              fields: e.fields.map((f) =>
                f.id === fieldId ? { ...f, ...updates } : f
              ),
            }
          : e
      ),
      updatedAt: new Date().toISOString(),
    },
  })),
  
  deleteField: (entityId, fieldId) => set((state) => ({
    schema: {
      ...state.schema,
      entities: state.schema.entities.map((e) =>
        e.id === entityId
          ? { ...e, fields: e.fields.filter((f) => f.id !== fieldId) }
          : e
      ),
      relations: state.schema.relations.filter(
        (r) =>
          !(r.sourceEntityId === entityId && r.sourceFieldId === fieldId) &&
          !(r.targetEntityId === entityId && r.targetFieldId === fieldId)
      ),
      // Remove connections to deleted field from relationships
      relationships: state.schema.relationships.map((rel) => ({
        ...rel,
        connections: rel.connections.filter((conn) => 
          !(conn.entityId === entityId && conn.fieldId === fieldId)
        ),
      })),
      updatedAt: new Date().toISOString(),
    },
    selectedFieldId: state.selectedFieldId === fieldId ? null : state.selectedFieldId,
  })),
  
  // Legacy Relation actions
  addRelation: (relation) => {
    const newRelation: Relation = {
      ...relation,
      id: crypto.randomUUID(),
    };
    set((state) => ({
      schema: {
        ...state.schema,
        relations: [...state.schema.relations, newRelation],
        updatedAt: new Date().toISOString(),
      },
    }));
    return newRelation;
  },
  
  updateRelation: (id, updates) => set((state) => ({
    schema: {
      ...state.schema,
      relations: state.schema.relations.map((r) =>
        r.id === id ? { ...r, ...updates } : r
      ),
      updatedAt: new Date().toISOString(),
    },
  })),
  
  deleteRelation: (id) => set((state) => ({
    schema: {
      ...state.schema,
      relations: state.schema.relations.filter((r) => r.id !== id),
      updatedAt: new Date().toISOString(),
    },
  })),
  
  // NEW: Relationship (first-class) actions
  addRelationship: (name, position, type = 'one-to-many') => {
    const relationship = createRelationship(name, position, type);
    set((state) => ({
      schema: {
        ...state.schema,
        relationships: [...(state.schema.relationships || []), relationship],
        updatedAt: new Date().toISOString(),
      },
      selectedRelationshipId: relationship.id,
      selectedEntityId: null,
    }));
    return relationship;
  },
  
  updateRelationship: (id, updates) => set((state) => ({
    schema: {
      ...state.schema,
      relationships: (state.schema.relationships || []).map((r) =>
        r.id === id ? { ...r, ...updates } : r
      ),
      updatedAt: new Date().toISOString(),
    },
  })),
  
  deleteRelationship: (id) => set((state) => ({
    schema: {
      ...state.schema,
      relationships: (state.schema.relationships || []).filter((r) => r.id !== id),
      updatedAt: new Date().toISOString(),
    },
    selectedRelationshipId: state.selectedRelationshipId === id ? null : state.selectedRelationshipId,
  })),
  
  setRelationshipPosition: (id, position) => set((state) => ({
    schema: {
      ...state.schema,
      relationships: (state.schema.relationships || []).map((r) =>
        r.id === id ? { ...r, position } : r
      ),
    },
  })),
  
  // Relationship connection actions
  addRelationshipConnection: (relationshipId, entityId, fieldId, cardinality = '1', participation = 'partial') => {
    const relationship = get().schema.relationships?.find((r) => r.id === relationshipId);
    if (!relationship) return null;
    
    const connection = createRelationshipConnection(entityId, fieldId, cardinality, participation);
    set((state) => ({
      schema: {
        ...state.schema,
        relationships: state.schema.relationships.map((r) =>
          r.id === relationshipId
            ? { ...r, connections: [...r.connections, connection] }
            : r
        ),
        updatedAt: new Date().toISOString(),
      },
    }));
    return connection;
  },
  
  updateRelationshipConnection: (relationshipId, connectionId, updates) => set((state) => ({
    schema: {
      ...state.schema,
      relationships: (state.schema.relationships || []).map((r) =>
        r.id === relationshipId
          ? {
              ...r,
              connections: r.connections.map((c) =>
                c.id === connectionId ? { ...c, ...updates } : c
              ),
            }
          : r
      ),
      updatedAt: new Date().toISOString(),
    },
  })),
  
  deleteRelationshipConnection: (relationshipId, connectionId) => set((state) => ({
    schema: {
      ...state.schema,
      relationships: (state.schema.relationships || []).map((r) =>
        r.id === relationshipId
          ? { ...r, connections: r.connections.filter((c) => c.id !== connectionId) }
          : r
      ),
      updatedAt: new Date().toISOString(),
    },
  })),
  
  // Relationship attribute actions
  addRelationshipAttribute: (relationshipId, name) => {
    const relationship = get().schema.relationships?.find((r) => r.id === relationshipId);
    if (!relationship) return null;
    
    const attribute = createRelationshipAttribute(name || `attr_${relationship.attributes.length}`);
    set((state) => ({
      schema: {
        ...state.schema,
        relationships: state.schema.relationships.map((r) =>
          r.id === relationshipId
            ? { ...r, attributes: [...r.attributes, attribute] }
            : r
        ),
        updatedAt: new Date().toISOString(),
      },
    }));
    return attribute;
  },
  
  updateRelationshipAttribute: (relationshipId, attributeId, updates) => set((state) => ({
    schema: {
      ...state.schema,
      relationships: (state.schema.relationships || []).map((r) =>
        r.id === relationshipId
          ? {
              ...r,
              attributes: r.attributes.map((a) =>
                a.id === attributeId ? { ...a, ...updates } : a
              ),
            }
          : r
      ),
      updatedAt: new Date().toISOString(),
    },
  })),
  
  deleteRelationshipAttribute: (relationshipId, attributeId) => set((state) => ({
    schema: {
      ...state.schema,
      relationships: (state.schema.relationships || []).map((r) =>
        r.id === relationshipId
          ? { ...r, attributes: r.attributes.filter((a) => a.id !== attributeId) }
          : r
      ),
      updatedAt: new Date().toISOString(),
    },
  })),
  
  // Relationship rule actions
  addRelationshipRule: (relationshipId, name) => {
    const relationship = get().schema.relationships?.find((r) => r.id === relationshipId);
    if (!relationship) return null;
    
    const rule = createRelationshipRule(name || `Rule ${relationship.rules.length + 1}`);
    set((state) => ({
      schema: {
        ...state.schema,
        relationships: state.schema.relationships.map((r) =>
          r.id === relationshipId
            ? { ...r, rules: [...r.rules, rule] }
            : r
        ),
        updatedAt: new Date().toISOString(),
      },
    }));
    return rule;
  },
  
  updateRelationshipRule: (relationshipId, ruleId, updates) => set((state) => ({
    schema: {
      ...state.schema,
      relationships: (state.schema.relationships || []).map((r) =>
        r.id === relationshipId
          ? {
              ...r,
              rules: r.rules.map((rule) =>
                rule.id === ruleId ? { ...rule, ...updates } : rule
              ),
            }
          : r
      ),
      updatedAt: new Date().toISOString(),
    },
  })),
  
  deleteRelationshipRule: (relationshipId, ruleId) => set((state) => ({
    schema: {
      ...state.schema,
      relationships: (state.schema.relationships || []).map((r) =>
        r.id === relationshipId
          ? { ...r, rules: r.rules.filter((rule) => rule.id !== ruleId) }
          : r
      ),
      updatedAt: new Date().toISOString(),
    },
  })),
  
  // Relationship constraint actions
  addRelationshipConstraint: (relationshipId, name) => {
    const relationship = get().schema.relationships?.find((r) => r.id === relationshipId);
    if (!relationship) return null;
    
    const constraint = createRelationshipConstraint(name || `Constraint ${relationship.constraints.length + 1}`);
    set((state) => ({
      schema: {
        ...state.schema,
        relationships: state.schema.relationships.map((r) =>
          r.id === relationshipId
            ? { ...r, constraints: [...r.constraints, constraint] }
            : r
        ),
        updatedAt: new Date().toISOString(),
      },
    }));
    return constraint;
  },
  
  updateRelationshipConstraint: (relationshipId, constraintId, updates) => set((state) => ({
    schema: {
      ...state.schema,
      relationships: (state.schema.relationships || []).map((r) =>
        r.id === relationshipId
          ? {
              ...r,
              constraints: r.constraints.map((c) =>
                c.id === constraintId ? { ...c, ...updates } : c
              ),
            }
          : r
      ),
      updatedAt: new Date().toISOString(),
    },
  })),
  
  deleteRelationshipConstraint: (relationshipId, constraintId) => set((state) => ({
    schema: {
      ...state.schema,
      relationships: (state.schema.relationships || []).map((r) =>
        r.id === relationshipId
          ? { ...r, constraints: r.constraints.filter((c) => c.id !== constraintId) }
          : r
      ),
      updatedAt: new Date().toISOString(),
    },
  })),
  
  // Selection actions
  selectEntity: (id) => set({ selectedEntityId: id, selectedFieldId: null, selectedRelationshipId: null }),
  selectField: (id) => set({ selectedFieldId: id }),
  selectRelationship: (id) => set({ selectedRelationshipId: id, selectedEntityId: null, selectedFieldId: null }),
  
  // Helpers
  getEntityById: (id) => get().schema.entities.find((e) => e.id === id),
  getFieldById: (entityId, fieldId) => {
    const entity = get().schema.entities.find((e) => e.id === entityId);
    return entity?.fields.find((f) => f.id === fieldId);
  },
  getRelationshipById: (id) => get().schema.relationships?.find((r) => r.id === id),
}));
