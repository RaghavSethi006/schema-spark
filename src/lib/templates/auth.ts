import { ERSchema } from '../schema';
import { v4 as uuid } from 'uuid';

export function createAuthSchema(): ERSchema {
  // ── Entity IDs ──
  const userId = uuid(), roleId = uuid(), permId = uuid(),
        sessionId = uuid(), auditId = uuid(), resetId = uuid();

  // ── Field IDs (for FK / relationship wiring) ──
  const userPk = uuid(), rolePk = uuid(), permPk = uuid(),
        sessionPk = uuid(), auditPk = uuid(), resetPk = uuid();
  const sessionUserFk = uuid(), auditUserFk = uuid(), resetUserFk = uuid();

  return {
    version: '1.0.0',
    name: 'Authentication System',
    entities: [
      {
        id: userId, name: 'User', position: { x: 100, y: 100 },
        fields: [
          { id: userPk, name: 'id', type: 'uuid', isPrimaryKey: true, isNullable: false, isUnique: true, isForeignKey: false },
          { id: uuid(), name: 'username', type: 'string', isPrimaryKey: false, isNullable: false, isUnique: true, isForeignKey: false },
          { id: uuid(), name: 'email', type: 'string', isPrimaryKey: false, isNullable: false, isUnique: true, isForeignKey: false },
          { id: uuid(), name: 'password_hash', type: 'string', isPrimaryKey: false, isNullable: false, isUnique: false, isForeignKey: false },
          { id: uuid(), name: 'first_name', type: 'string', isPrimaryKey: false, isNullable: true, isUnique: false, isForeignKey: false },
          { id: uuid(), name: 'last_name', type: 'string', isPrimaryKey: false, isNullable: true, isUnique: false, isForeignKey: false },
          { id: uuid(), name: 'is_active', type: 'boolean', isPrimaryKey: false, isNullable: false, isUnique: false, isForeignKey: false, defaultValue: 'true' },
          { id: uuid(), name: 'is_verified', type: 'boolean', isPrimaryKey: false, isNullable: false, isUnique: false, isForeignKey: false, defaultValue: 'false' },
          { id: uuid(), name: 'last_login', type: 'datetime', isPrimaryKey: false, isNullable: true, isUnique: false, isForeignKey: false },
          { id: uuid(), name: 'created_at', type: 'datetime', isPrimaryKey: false, isNullable: false, isUnique: false, isForeignKey: false },
          { id: uuid(), name: 'updated_at', type: 'datetime', isPrimaryKey: false, isNullable: false, isUnique: false, isForeignKey: false },
        ],
      },
      {
        id: roleId, name: 'Role', position: { x: 500, y: 100 },
        fields: [
          { id: rolePk, name: 'id', type: 'uuid', isPrimaryKey: true, isNullable: false, isUnique: true, isForeignKey: false },
          { id: uuid(), name: 'name', type: 'string', isPrimaryKey: false, isNullable: false, isUnique: true, isForeignKey: false },
          { id: uuid(), name: 'description', type: 'text', isPrimaryKey: false, isNullable: true, isUnique: false, isForeignKey: false },
          { id: uuid(), name: 'is_system_role', type: 'boolean', isPrimaryKey: false, isNullable: false, isUnique: false, isForeignKey: false, defaultValue: 'false' },
          { id: uuid(), name: 'priority', type: 'integer', isPrimaryKey: false, isNullable: false, isUnique: false, isForeignKey: false, defaultValue: '0' },
          { id: uuid(), name: 'created_at', type: 'datetime', isPrimaryKey: false, isNullable: false, isUnique: false, isForeignKey: false },
        ],
      },
      {
        id: permId, name: 'Permission', position: { x: 900, y: 100 },
        fields: [
          { id: permPk, name: 'id', type: 'uuid', isPrimaryKey: true, isNullable: false, isUnique: true, isForeignKey: false },
          { id: uuid(), name: 'name', type: 'string', isPrimaryKey: false, isNullable: false, isUnique: true, isForeignKey: false },
          { id: uuid(), name: 'resource', type: 'string', isPrimaryKey: false, isNullable: false, isUnique: false, isForeignKey: false },
          { id: uuid(), name: 'action', type: 'string', isPrimaryKey: false, isNullable: false, isUnique: false, isForeignKey: false },
          { id: uuid(), name: 'description', type: 'text', isPrimaryKey: false, isNullable: true, isUnique: false, isForeignKey: false },
        ],
      },
      {
        id: sessionId, name: 'Session', position: { x: 100, y: 450 },
        fields: [
          { id: sessionPk, name: 'id', type: 'uuid', isPrimaryKey: true, isNullable: false, isUnique: true, isForeignKey: false },
          { id: sessionUserFk, name: 'user_id', type: 'uuid', isPrimaryKey: false, isNullable: false, isUnique: false, isForeignKey: true, foreignKeyRef: { entityId: userId, fieldId: userPk } },
          { id: uuid(), name: 'token_hash', type: 'string', isPrimaryKey: false, isNullable: false, isUnique: true, isForeignKey: false },
          { id: uuid(), name: 'ip_address', type: 'string', isPrimaryKey: false, isNullable: true, isUnique: false, isForeignKey: false },
          { id: uuid(), name: 'user_agent', type: 'text', isPrimaryKey: false, isNullable: true, isUnique: false, isForeignKey: false },
          { id: uuid(), name: 'expires_at', type: 'datetime', isPrimaryKey: false, isNullable: false, isUnique: false, isForeignKey: false },
          { id: uuid(), name: 'created_at', type: 'datetime', isPrimaryKey: false, isNullable: false, isUnique: false, isForeignKey: false },
          { id: uuid(), name: 'revoked_at', type: 'datetime', isPrimaryKey: false, isNullable: true, isUnique: false, isForeignKey: false },
        ],
      },
      {
        id: auditId, name: 'AuditLog', position: { x: 500, y: 450 },
        fields: [
          { id: auditPk, name: 'id', type: 'uuid', isPrimaryKey: true, isNullable: false, isUnique: true, isForeignKey: false },
          { id: auditUserFk, name: 'user_id', type: 'uuid', isPrimaryKey: false, isNullable: false, isUnique: false, isForeignKey: true, foreignKeyRef: { entityId: userId, fieldId: userPk } },
          { id: uuid(), name: 'action', type: 'string', isPrimaryKey: false, isNullable: false, isUnique: false, isForeignKey: false },
          { id: uuid(), name: 'resource', type: 'string', isPrimaryKey: false, isNullable: false, isUnique: false, isForeignKey: false },
          { id: uuid(), name: 'resource_id', type: 'string', isPrimaryKey: false, isNullable: true, isUnique: false, isForeignKey: false },
          { id: uuid(), name: 'ip_address', type: 'string', isPrimaryKey: false, isNullable: true, isUnique: false, isForeignKey: false },
          { id: uuid(), name: 'metadata', type: 'text', isPrimaryKey: false, isNullable: true, isUnique: false, isForeignKey: false },
          { id: uuid(), name: 'created_at', type: 'datetime', isPrimaryKey: false, isNullable: false, isUnique: false, isForeignKey: false },
        ],
      },
      {
        id: resetId, name: 'PasswordReset', position: { x: 900, y: 450 },
        fields: [
          { id: resetPk, name: 'id', type: 'uuid', isPrimaryKey: true, isNullable: false, isUnique: true, isForeignKey: false },
          { id: resetUserFk, name: 'user_id', type: 'uuid', isPrimaryKey: false, isNullable: false, isUnique: false, isForeignKey: true, foreignKeyRef: { entityId: userId, fieldId: userPk } },
          { id: uuid(), name: 'token_hash', type: 'string', isPrimaryKey: false, isNullable: false, isUnique: true, isForeignKey: false },
          { id: uuid(), name: 'expires_at', type: 'datetime', isPrimaryKey: false, isNullable: false, isUnique: false, isForeignKey: false },
          { id: uuid(), name: 'used_at', type: 'datetime', isPrimaryKey: false, isNullable: true, isUnique: false, isForeignKey: false },
          { id: uuid(), name: 'created_at', type: 'datetime', isPrimaryKey: false, isNullable: false, isUnique: false, isForeignKey: false },
        ],
      },
    ],
    relations: [],
    relationships: [
      // HasRole (User ↔ Role, M:N)
      {
        id: uuid(), name: 'HasRole', type: 'many-to-many',
        position: { x: 300, y: 50 },
        connections: [
          { id: uuid(), entityId: userId, fieldId: userPk, cardinality: 'N', participation: 'partial', role: 'user' },
          { id: uuid(), entityId: roleId, fieldId: rolePk, cardinality: 'M', participation: 'partial', role: 'role' },
        ],
        attributes: [
          { id: uuid(), name: 'assigned_at', type: 'datetime', isNullable: false },
          { id: uuid(), name: 'assigned_by', type: 'uuid', isNullable: true },
          { id: uuid(), name: 'expires_at', type: 'datetime', isNullable: true },
        ],
        onDelete: 'CASCADE', onUpdate: 'CASCADE',
        rules: [
          {
            id: uuid(), name: 'Max 10 Roles Per User', description: 'A user cannot have more than 10 roles assigned', trigger: 'BEFORE_CREATE', scope: 'both', enabled: true,
            conditions: [{ id: uuid(), type: 'cardinality', leftOperand: 'user.roles.count', operator: '<', rightOperand: '10' }],
            action: { type: 'THROW_ERROR', errorMessage: 'User cannot have more than 10 roles' },
          },
          {
            id: uuid(), name: 'Prevent Duplicate Assignment', description: 'Same role cannot be assigned twice to same user', trigger: 'BEFORE_CREATE', scope: 'database', enabled: true,
            conditions: [],
            action: { type: 'THROW_ERROR', errorMessage: 'Role already assigned to this user' },
          },
        ],
        constraints: [
          { id: uuid(), name: 'Unique User-Role Pair', type: 'unique', enabled: true, uniqueFields: ['user_id', 'role_id'] },
          { id: uuid(), name: 'Max Roles Per User', type: 'max_relations', enabled: true, maxRelationsConfig: { entityId: userId, limit: 10 } },
        ],
        isIdentifying: false, isRecursive: false, description: 'Users are assigned roles for RBAC',
      },
      // GrantsPermission (Role ↔ Permission, M:N)
      {
        id: uuid(), name: 'GrantsPermission', type: 'many-to-many',
        position: { x: 700, y: 50 },
        connections: [
          { id: uuid(), entityId: roleId, fieldId: rolePk, cardinality: 'N', participation: 'partial', role: 'role' },
          { id: uuid(), entityId: permId, fieldId: permPk, cardinality: 'M', participation: 'partial', role: 'permission' },
        ],
        attributes: [
          { id: uuid(), name: 'granted_at', type: 'datetime', isNullable: false },
        ],
        onDelete: 'CASCADE', onUpdate: 'CASCADE',
        rules: [],
        constraints: [
          { id: uuid(), name: 'Unique Role-Permission', type: 'unique', enabled: true, uniqueFields: ['role_id', 'permission_id'] },
        ],
        isIdentifying: false, isRecursive: false, description: 'Roles grant permissions to resources',
      },
      // OwnsSession (User → Session, 1:N)
      {
        id: uuid(), name: 'OwnsSession', type: 'one-to-many',
        position: { x: 100, y: 280 },
        connections: [
          { id: uuid(), entityId: userId, fieldId: userPk, cardinality: '1', participation: 'partial', role: 'user' },
          { id: uuid(), entityId: sessionId, fieldId: sessionUserFk, cardinality: 'N', participation: 'total', role: 'session' },
        ],
        attributes: [],
        onDelete: 'CASCADE', onUpdate: 'CASCADE',
        rules: [
          {
            id: uuid(), name: 'Max 5 Active Sessions', description: 'Auto-revoke oldest session when limit exceeded', trigger: 'AFTER_CREATE', scope: 'both', enabled: true,
            conditions: [{ id: uuid(), type: 'cardinality', leftOperand: 'user.sessions.active.count', operator: '>', rightOperand: '5' }],
            action: { type: 'UPDATE_FIELD', updateField: { entity: 'Session', field: 'revoked_at', value: 'NOW()' } },
          },
          {
            id: uuid(), name: 'Session Expiry Validation', description: 'expires_at must be after created_at', trigger: 'BEFORE_CREATE', scope: 'database', enabled: true,
            conditions: [{ id: uuid(), type: 'comparison', leftOperand: 'session.expires_at', operator: '>', rightOperand: 'session.created_at' }],
            action: { type: 'THROW_ERROR', errorMessage: 'Session expiry must be after creation time' },
          },
          {
            id: uuid(), name: 'Block Inactive User Login', description: 'Inactive users cannot create sessions', trigger: 'BEFORE_CREATE', scope: 'both', enabled: true,
            conditions: [{ id: uuid(), type: 'comparison', leftOperand: 'user.is_active', operator: '==', rightOperand: 'true' }],
            action: { type: 'THROW_ERROR', errorMessage: 'Inactive users cannot log in' },
          },
        ],
        constraints: [
          { id: uuid(), name: 'Session Expiry Check', type: 'check', enabled: true, checkExpression: 'expires_at > created_at' },
          { id: uuid(), name: 'Max Active Sessions', type: 'max_relations', enabled: true, maxRelationsConfig: { entityId: userId, limit: 5 } },
        ],
        isIdentifying: false, isRecursive: false, description: 'User owns multiple sessions',
      },
      // LogsAction (User → AuditLog, 1:N)
      {
        id: uuid(), name: 'LogsAction', type: 'one-to-many',
        position: { x: 300, y: 400 },
        connections: [
          { id: uuid(), entityId: userId, fieldId: userPk, cardinality: '1', participation: 'partial', role: 'actor' },
          { id: uuid(), entityId: auditId, fieldId: auditUserFk, cardinality: 'N', participation: 'total', role: 'log_entry' },
        ],
        attributes: [
          { id: uuid(), name: 'severity_level', type: 'string', isNullable: false, defaultValue: 'info' },
        ],
        onDelete: 'SET_NULL', onUpdate: 'CASCADE',
        rules: [
          {
            id: uuid(), name: 'Auto-Log on Session Create', description: 'Create audit log entry when user creates a session', trigger: 'AFTER_CREATE', scope: 'backend', enabled: true,
            conditions: [],
            action: { type: 'LOG' },
          },
        ],
        constraints: [],
        isIdentifying: false, isRecursive: false, description: 'User actions are recorded in the audit log',
      },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}
