import { create } from 'zustand';
import { 
  ERSchema, 
  Entity, 
  Field, 
  Relation, 
  createEmptySchema, 
  createEntity, 
  createField 
} from './schema';

interface SchemaStore {
  schema: ERSchema;
  selectedEntityId: string | null;
  selectedFieldId: string | null;
  
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
  
  // Relation actions
  addRelation: (relation: Omit<Relation, 'id'>) => Relation;
  updateRelation: (id: string, updates: Partial<Relation>) => void;
  deleteRelation: (id: string) => void;
  
  // Selection actions
  selectEntity: (id: string | null) => void;
  selectField: (id: string | null) => void;
  
  // Helpers
  getEntityById: (id: string) => Entity | undefined;
  getFieldById: (entityId: string, fieldId: string) => Field | undefined;
}

export const useSchemaStore = create<SchemaStore>((set, get) => ({
  schema: createEmptySchema(),
  selectedEntityId: null,
  selectedFieldId: null,
  
  setSchema: (schema) => set({ schema }),
  
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
  }),
  
  addEntity: (name, position) => {
    const entity = createEntity(name, position);
    set((state) => ({
      schema: {
        ...state.schema,
        entities: [...state.schema.entities, entity],
        updatedAt: new Date().toISOString(),
      },
      selectedEntityId: entity.id,
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
      updatedAt: new Date().toISOString(),
    },
    selectedFieldId: state.selectedFieldId === fieldId ? null : state.selectedFieldId,
  })),
  
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
  
  selectEntity: (id) => set({ selectedEntityId: id, selectedFieldId: null }),
  selectField: (id) => set({ selectedFieldId: id }),
  
  getEntityById: (id) => get().schema.entities.find((e) => e.id === id),
  getFieldById: (entityId, fieldId) => {
    const entity = get().schema.entities.find((e) => e.id === entityId);
    return entity?.fields.find((f) => f.id === fieldId);
  },
}));
