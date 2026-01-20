import { ERSchema, Entity, Relation, Relationship, createRelationship } from './schema';
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

  // Legacy relation for backward compatibility
  const relation: Relation = {
    id: uuid(),
    type: 'one-to-many',
    sourceEntityId: postId,
    sourceFieldId: postFkId,
    targetEntityId: userId,
    targetFieldId: userPkId,
  };

  // New first-class relationship with attributes and rules
  const authorshipRelationship: Relationship = {
    id: uuid(),
    name: 'Writes',
    type: 'one-to-many',
    position: { x: 300, y: 200 },
    connections: [
      {
        id: uuid(),
        entityId: userId,
        fieldId: userPkId,
        cardinality: '1',
        participation: 'partial',
        role: 'author',
      },
      {
        id: uuid(),
        entityId: postId,
        fieldId: postFkId,
        cardinality: 'N',
        participation: 'total',
        role: 'post',
      },
    ],
    attributes: [
      {
        id: uuid(),
        name: 'assigned_at',
        type: 'datetime',
        isNullable: true,
      },
    ],
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
    rules: [
      {
        id: uuid(),
        name: 'Validate Author',
        description: 'Ensure post has a valid author',
        trigger: 'BEFORE_CREATE',
        scope: 'both',
        enabled: true,
        conditions: [
          {
            id: uuid(),
            type: 'null_check',
            leftOperand: 'post.user_id',
            operator: 'IS_NOT_NULL',
            rightOperand: '',
          },
        ],
        action: {
          type: 'THROW_ERROR',
          errorMessage: 'Post must have an author',
        },
      },
    ],
    constraints: [
      {
        id: uuid(),
        name: 'Unique Author Per Post',
        type: 'unique',
        enabled: true,
        uniqueFields: ['post_id'],
      },
    ],
    isIdentifying: false,
    isRecursive: false,
    description: 'User writes multiple posts',
  };

  return {
    version: '1.0.0',
    name: 'Blog API',
    entities: [userEntity, postEntity],
    relations: [relation],
    relationships: [authorshipRelationship],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
};
