import { ERSchema } from '../schema';
import { v4 as uuid } from 'uuid';

export function createBlogSchema(): ERSchema {
  const userId = uuid(), postId = uuid(), commentId = uuid(),
        tagId = uuid(), categoryId = uuid(), mediaId = uuid();

  const userPk = uuid(), postPk = uuid(), commentPk = uuid(),
        tagPk = uuid(), categoryPk = uuid(), mediaPk = uuid();

  const postAuthorFk = uuid(), commentPostFk = uuid(), commentAuthorFk = uuid(),
        commentParentFk = uuid(), categoryParentFk = uuid(), mediaUploadedByFk = uuid();

  return {
    version: '1.0.0', name: 'Blog Platform',
    entities: [
      {
        id: userId, name: 'User', position: { x: 100, y: 100 },
        fields: [
          { id: userPk, name: 'id', type: 'uuid', isPrimaryKey: true, isNullable: false, isUnique: true, isForeignKey: false },
          { id: uuid(), name: 'username', type: 'string', isPrimaryKey: false, isNullable: false, isUnique: true, isForeignKey: false },
          { id: uuid(), name: 'email', type: 'string', isPrimaryKey: false, isNullable: false, isUnique: true, isForeignKey: false },
          { id: uuid(), name: 'display_name', type: 'string', isPrimaryKey: false, isNullable: false, isUnique: false, isForeignKey: false },
          { id: uuid(), name: 'bio', type: 'text', isPrimaryKey: false, isNullable: true, isUnique: false, isForeignKey: false },
          { id: uuid(), name: 'avatar_url', type: 'string', isPrimaryKey: false, isNullable: true, isUnique: false, isForeignKey: false },
          { id: uuid(), name: 'role', type: 'string', isPrimaryKey: false, isNullable: false, isUnique: false, isForeignKey: false, defaultValue: 'subscriber' },
          { id: uuid(), name: 'is_active', type: 'boolean', isPrimaryKey: false, isNullable: false, isUnique: false, isForeignKey: false, defaultValue: 'true' },
          { id: uuid(), name: 'last_login', type: 'datetime', isPrimaryKey: false, isNullable: true, isUnique: false, isForeignKey: false },
          { id: uuid(), name: 'created_at', type: 'datetime', isPrimaryKey: false, isNullable: false, isUnique: false, isForeignKey: false },
        ],
      },
      {
        id: postId, name: 'Post', position: { x: 500, y: 100 },
        fields: [
          { id: postPk, name: 'id', type: 'uuid', isPrimaryKey: true, isNullable: false, isUnique: true, isForeignKey: false },
          { id: postAuthorFk, name: 'author_id', type: 'uuid', isPrimaryKey: false, isNullable: false, isUnique: false, isForeignKey: true, foreignKeyRef: { entityId: userId, fieldId: userPk } },
          { id: uuid(), name: 'title', type: 'string', isPrimaryKey: false, isNullable: false, isUnique: false, isForeignKey: false },
          { id: uuid(), name: 'slug', type: 'string', isPrimaryKey: false, isNullable: false, isUnique: true, isForeignKey: false },
          { id: uuid(), name: 'excerpt', type: 'text', isPrimaryKey: false, isNullable: true, isUnique: false, isForeignKey: false },
          { id: uuid(), name: 'content', type: 'text', isPrimaryKey: false, isNullable: false, isUnique: false, isForeignKey: false },
          { id: uuid(), name: 'status', type: 'string', isPrimaryKey: false, isNullable: false, isUnique: false, isForeignKey: false, defaultValue: 'draft' },
          { id: uuid(), name: 'featured_image_url', type: 'string', isPrimaryKey: false, isNullable: true, isUnique: false, isForeignKey: false },
          { id: uuid(), name: 'is_featured', type: 'boolean', isPrimaryKey: false, isNullable: false, isUnique: false, isForeignKey: false, defaultValue: 'false' },
          { id: uuid(), name: 'view_count', type: 'integer', isPrimaryKey: false, isNullable: false, isUnique: false, isForeignKey: false, defaultValue: '0' },
          { id: uuid(), name: 'published_at', type: 'datetime', isPrimaryKey: false, isNullable: true, isUnique: false, isForeignKey: false },
          { id: uuid(), name: 'created_at', type: 'datetime', isPrimaryKey: false, isNullable: false, isUnique: false, isForeignKey: false },
          { id: uuid(), name: 'updated_at', type: 'datetime', isPrimaryKey: false, isNullable: false, isUnique: false, isForeignKey: false },
        ],
      },
      {
        id: commentId, name: 'Comment', position: { x: 900, y: 100 },
        fields: [
          { id: commentPk, name: 'id', type: 'uuid', isPrimaryKey: true, isNullable: false, isUnique: true, isForeignKey: false },
          { id: commentPostFk, name: 'post_id', type: 'uuid', isPrimaryKey: false, isNullable: false, isUnique: false, isForeignKey: true, foreignKeyRef: { entityId: postId, fieldId: postPk } },
          { id: commentAuthorFk, name: 'author_id', type: 'uuid', isPrimaryKey: false, isNullable: false, isUnique: false, isForeignKey: true, foreignKeyRef: { entityId: userId, fieldId: userPk } },
          { id: commentParentFk, name: 'parent_comment_id', type: 'uuid', isPrimaryKey: false, isNullable: true, isUnique: false, isForeignKey: true, foreignKeyRef: { entityId: commentId, fieldId: commentPk } },
          { id: uuid(), name: 'content', type: 'text', isPrimaryKey: false, isNullable: false, isUnique: false, isForeignKey: false },
          { id: uuid(), name: 'status', type: 'string', isPrimaryKey: false, isNullable: false, isUnique: false, isForeignKey: false, defaultValue: 'pending' },
          { id: uuid(), name: 'ip_address', type: 'string', isPrimaryKey: false, isNullable: true, isUnique: false, isForeignKey: false },
          { id: uuid(), name: 'created_at', type: 'datetime', isPrimaryKey: false, isNullable: false, isUnique: false, isForeignKey: false },
        ],
      },
      {
        id: tagId, name: 'Tag', position: { x: 100, y: 450 },
        fields: [
          { id: tagPk, name: 'id', type: 'uuid', isPrimaryKey: true, isNullable: false, isUnique: true, isForeignKey: false },
          { id: uuid(), name: 'name', type: 'string', isPrimaryKey: false, isNullable: false, isUnique: true, isForeignKey: false },
          { id: uuid(), name: 'slug', type: 'string', isPrimaryKey: false, isNullable: false, isUnique: true, isForeignKey: false },
          { id: uuid(), name: 'description', type: 'text', isPrimaryKey: false, isNullable: true, isUnique: false, isForeignKey: false },
          { id: uuid(), name: 'post_count', type: 'integer', isPrimaryKey: false, isNullable: false, isUnique: false, isForeignKey: false, defaultValue: '0' },
          { id: uuid(), name: 'created_at', type: 'datetime', isPrimaryKey: false, isNullable: false, isUnique: false, isForeignKey: false },
        ],
      },
      {
        id: categoryId, name: 'Category', position: { x: 500, y: 450 },
        fields: [
          { id: categoryPk, name: 'id', type: 'uuid', isPrimaryKey: true, isNullable: false, isUnique: true, isForeignKey: false },
          { id: uuid(), name: 'name', type: 'string', isPrimaryKey: false, isNullable: false, isUnique: true, isForeignKey: false },
          { id: uuid(), name: 'slug', type: 'string', isPrimaryKey: false, isNullable: false, isUnique: true, isForeignKey: false },
          { id: uuid(), name: 'description', type: 'text', isPrimaryKey: false, isNullable: true, isUnique: false, isForeignKey: false },
          { id: categoryParentFk, name: 'parent_id', type: 'uuid', isPrimaryKey: false, isNullable: true, isUnique: false, isForeignKey: true, foreignKeyRef: { entityId: categoryId, fieldId: categoryPk } },
          { id: uuid(), name: 'sort_order', type: 'integer', isPrimaryKey: false, isNullable: false, isUnique: false, isForeignKey: false, defaultValue: '0' },
        ],
      },
      {
        id: mediaId, name: 'Media', position: { x: 900, y: 450 },
        fields: [
          { id: mediaPk, name: 'id', type: 'uuid', isPrimaryKey: true, isNullable: false, isUnique: true, isForeignKey: false },
          { id: mediaUploadedByFk, name: 'uploaded_by', type: 'uuid', isPrimaryKey: false, isNullable: false, isUnique: false, isForeignKey: true, foreignKeyRef: { entityId: userId, fieldId: userPk } },
          { id: uuid(), name: 'filename', type: 'string', isPrimaryKey: false, isNullable: false, isUnique: false, isForeignKey: false },
          { id: uuid(), name: 'mime_type', type: 'string', isPrimaryKey: false, isNullable: false, isUnique: false, isForeignKey: false },
          { id: uuid(), name: 'file_size', type: 'integer', isPrimaryKey: false, isNullable: false, isUnique: false, isForeignKey: false },
          { id: uuid(), name: 'url', type: 'string', isPrimaryKey: false, isNullable: false, isUnique: true, isForeignKey: false },
          { id: uuid(), name: 'alt_text', type: 'string', isPrimaryKey: false, isNullable: true, isUnique: false, isForeignKey: false },
          { id: uuid(), name: 'created_at', type: 'datetime', isPrimaryKey: false, isNullable: false, isUnique: false, isForeignKey: false },
        ],
      },
    ],
    relations: [],
    relationships: [
      // Authors (User → Post, 1:N)
      {
        id: uuid(), name: 'Authors', type: 'one-to-many', position: { x: 300, y: 50 },
        connections: [
          { id: uuid(), entityId: userId, fieldId: userPk, cardinality: '1', participation: 'partial', role: 'author' },
          { id: uuid(), entityId: postId, fieldId: postAuthorFk, cardinality: 'N', participation: 'total', role: 'post' },
        ],
        attributes: [],
        onDelete: 'CASCADE', onUpdate: 'CASCADE',
        rules: [
          { id: uuid(), name: 'Only Authors Can Publish', description: 'Only users with role author/editor/admin can set post status to published', trigger: 'BEFORE_UPDATE', scope: 'both', enabled: true, conditions: [{ id: uuid(), type: 'comparison', leftOperand: 'user.role', operator: 'IN', rightOperand: "['author','editor','admin']" }], action: { type: 'THROW_ERROR', errorMessage: 'Only authors, editors, or admins can publish posts' } },
        ],
        constraints: [],
        isIdentifying: false, isRecursive: false, description: 'Users author posts with role-based publishing',
      },
      // CommentsOn (User ↔ Post via Comment, M:N)
      {
        id: uuid(), name: 'CommentsOn', type: 'many-to-many', position: { x: 700, y: 50 },
        connections: [
          { id: uuid(), entityId: userId, fieldId: userPk, cardinality: 'N', participation: 'partial', role: 'commenter' },
          { id: uuid(), entityId: postId, fieldId: postPk, cardinality: 'M', participation: 'partial', role: 'post' },
        ],
        attributes: [
          { id: uuid(), name: 'content', type: 'text', isNullable: false },
          { id: uuid(), name: 'status', type: 'string', isNullable: false, defaultValue: 'pending' },
        ],
        onDelete: 'CASCADE', onUpdate: 'CASCADE',
        rules: [
          { id: uuid(), name: 'Max 3 Reply Nesting Levels', trigger: 'BEFORE_CREATE', scope: 'both', enabled: true, conditions: [], action: { type: 'THROW_ERROR', errorMessage: 'Comments cannot be nested more than 3 levels deep' } },
          { id: uuid(), name: 'Auto-Moderate Spam', description: 'Flag comments with spam-like content for moderation', trigger: 'BEFORE_CREATE', scope: 'backend', enabled: true, conditions: [], action: { type: 'UPDATE_FIELD', updateField: { entity: 'Comment', field: 'status', value: 'spam' } } },
        ],
        constraints: [],
        isIdentifying: false, isRecursive: false, description: 'Users comment on posts with moderation and nesting',
      },
      // TaggedWith (Post ↔ Tag, M:N)
      {
        id: uuid(), name: 'TaggedWith', type: 'many-to-many', position: { x: 300, y: 300 },
        connections: [
          { id: uuid(), entityId: postId, fieldId: postPk, cardinality: 'N', participation: 'partial', role: 'post' },
          { id: uuid(), entityId: tagId, fieldId: tagPk, cardinality: 'M', participation: 'partial', role: 'tag' },
        ],
        attributes: [
          { id: uuid(), name: 'tagged_at', type: 'datetime', isNullable: false },
        ],
        onDelete: 'CASCADE', onUpdate: 'CASCADE',
        rules: [
          { id: uuid(), name: 'Max 10 Tags Per Post', trigger: 'BEFORE_CREATE', scope: 'both', enabled: true, conditions: [{ id: uuid(), type: 'cardinality', leftOperand: 'post.tags.count', operator: '<', rightOperand: '10' }], action: { type: 'THROW_ERROR', errorMessage: 'A post cannot have more than 10 tags' } },
          { id: uuid(), name: 'Auto-Increment Post Count', trigger: 'AFTER_CREATE', scope: 'both', enabled: true, conditions: [], action: { type: 'UPDATE_FIELD', updateField: { entity: 'Tag', field: 'post_count', value: 'post_count + 1' } } },
          { id: uuid(), name: 'Auto-Decrement Post Count', trigger: 'AFTER_DELETE', scope: 'both', enabled: true, conditions: [], action: { type: 'UPDATE_FIELD', updateField: { entity: 'Tag', field: 'post_count', value: 'post_count - 1' } } },
        ],
        constraints: [
          { id: uuid(), name: 'Unique Post-Tag', type: 'unique', enabled: true, uniqueFields: ['post_id', 'tag_id'] },
          { id: uuid(), name: 'Max Tags Per Post', type: 'max_relations', enabled: true, maxRelationsConfig: { entityId: postId, limit: 10 } },
        ],
        isIdentifying: false, isRecursive: false, description: 'Posts are tagged with auto-counting',
      },
      // InCategory (Post → Category, N:1)
      {
        id: uuid(), name: 'InCategory', type: 'one-to-many', position: { x: 500, y: 300 },
        connections: [
          { id: uuid(), entityId: categoryId, fieldId: categoryPk, cardinality: '1', participation: 'partial', role: 'category' },
          { id: uuid(), entityId: postId, fieldId: postPk, cardinality: 'N', participation: 'partial', role: 'post' },
        ],
        attributes: [],
        onDelete: 'SET_NULL', onUpdate: 'CASCADE',
        rules: [
          { id: uuid(), name: 'Published Posts Need Category', description: 'Posts with status=published must have a category', trigger: 'BEFORE_UPDATE', scope: 'both', enabled: true, conditions: [{ id: uuid(), type: 'comparison', leftOperand: 'post.status', operator: '==', rightOperand: 'published' }], action: { type: 'THROW_ERROR', errorMessage: 'Published posts must have a category assigned' } },
        ],
        constraints: [],
        isIdentifying: false, isRecursive: false, description: 'Published posts must belong to a category',
      },
      // HasSubcategory (Category → Category, 1:N recursive)
      {
        id: uuid(), name: 'HasSubcategory', type: 'one-to-many', position: { x: 500, y: 580 },
        connections: [
          { id: uuid(), entityId: categoryId, fieldId: categoryPk, cardinality: '1', participation: 'partial', role: 'parent' },
          { id: uuid(), entityId: categoryId, fieldId: categoryParentFk, cardinality: 'N', participation: 'partial', role: 'child' },
        ],
        attributes: [],
        onDelete: 'CASCADE', onUpdate: 'CASCADE',
        rules: [
          { id: uuid(), name: 'Max 2 Nesting Levels', trigger: 'BEFORE_CREATE', scope: 'both', enabled: true, conditions: [], action: { type: 'THROW_ERROR', errorMessage: 'Categories cannot be nested more than 2 levels deep' } },
        ],
        constraints: [
          { id: uuid(), name: 'No Self-Reference', type: 'check', enabled: true, checkExpression: 'id != parent_id' },
        ],
        isIdentifying: false, isRecursive: true, description: 'Categories can have subcategories (max 2 levels)',
      },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}
