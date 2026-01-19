import { ERSchema, Entity, Relation, createField } from './schema';
import { v4 as uuid } from 'uuid';

// Create a demo schema with User and Post entities
export const createDemoSchema = (): ERSchema => {
  const userId = uuid();
  const postId = uuid();
  
  const userPkId = uuid();
  const postPkId = uuid();
  const postFkId = uuid();

  const userEntity: Entity = {
    id: userId,
    name: 'User',
    position: { x: 100, y: 150 },
    fields: [
      {
        id: userPkId,
        name: 'id',
        type: 'integer',
        isPrimaryKey: true,
        isNullable: false,
        isUnique: true,
        isForeignKey: false,
      },
      {
        id: uuid(),
        name: 'email',
        type: 'string',
        isPrimaryKey: false,
        isNullable: false,
        isUnique: true,
        isForeignKey: false,
      },
      {
        id: uuid(),
        name: 'username',
        type: 'string',
        isPrimaryKey: false,
        isNullable: false,
        isUnique: true,
        isForeignKey: false,
      },
      {
        id: uuid(),
        name: 'created_at',
        type: 'datetime',
        isPrimaryKey: false,
        isNullable: true,
        isUnique: false,
        isForeignKey: false,
      },
    ],
  };

  const postEntity: Entity = {
    id: postId,
    name: 'Post',
    position: { x: 500, y: 150 },
    fields: [
      {
        id: postPkId,
        name: 'id',
        type: 'integer',
        isPrimaryKey: true,
        isNullable: false,
        isUnique: true,
        isForeignKey: false,
      },
      {
        id: uuid(),
        name: 'title',
        type: 'string',
        isPrimaryKey: false,
        isNullable: false,
        isUnique: false,
        isForeignKey: false,
      },
      {
        id: uuid(),
        name: 'content',
        type: 'text',
        isPrimaryKey: false,
        isNullable: true,
        isUnique: false,
        isForeignKey: false,
      },
      {
        id: postFkId,
        name: 'user_id',
        type: 'integer',
        isPrimaryKey: false,
        isNullable: false,
        isUnique: false,
        isForeignKey: true,
        foreignKeyRef: {
          entityId: userId,
          fieldId: userPkId,
        },
      },
      {
        id: uuid(),
        name: 'is_published',
        type: 'boolean',
        isPrimaryKey: false,
        isNullable: false,
        isUnique: false,
        isForeignKey: false,
      },
      {
        id: uuid(),
        name: 'created_at',
        type: 'datetime',
        isPrimaryKey: false,
        isNullable: true,
        isUnique: false,
        isForeignKey: false,
      },
    ],
  };

  const relation: Relation = {
    id: uuid(),
    type: 'one-to-many',
    sourceEntityId: postId,
    sourceFieldId: postFkId,
    targetEntityId: userId,
    targetFieldId: userPkId,
  };

  return {
    version: '1.0.0',
    name: 'Blog API',
    entities: [userEntity, postEntity],
    relations: [relation],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
};
