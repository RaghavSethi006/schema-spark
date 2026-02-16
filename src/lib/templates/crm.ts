import { ERSchema } from '../schema';
import { v4 as uuid } from 'uuid';

export function createCRMSchema(): ERSchema {
  const contactId = uuid(), companyId = uuid(), dealId = uuid(), activityId = uuid(),
        pipelineId = uuid(), taskId = uuid(), emailTplId = uuid();

  const contactPk = uuid(), companyPk = uuid(), dealPk = uuid(), activityPk = uuid(),
        pipelinePk = uuid(), taskPk = uuid(), emailTplPk = uuid();

  const activityContactFk = uuid(), activityDealFk = uuid(), taskDealFk = uuid();

  return {
    version: '1.0.0', name: 'CRM System',
    entities: [
      {
        id: contactId, name: 'Contact', position: { x: 100, y: 100 },
        fields: [
          { id: contactPk, name: 'id', type: 'uuid', isPrimaryKey: true, isNullable: false, isUnique: true, isForeignKey: false },
          { id: uuid(), name: 'first_name', type: 'string', isPrimaryKey: false, isNullable: false, isUnique: false, isForeignKey: false },
          { id: uuid(), name: 'last_name', type: 'string', isPrimaryKey: false, isNullable: false, isUnique: false, isForeignKey: false },
          { id: uuid(), name: 'email', type: 'string', isPrimaryKey: false, isNullable: false, isUnique: true, isForeignKey: false },
          { id: uuid(), name: 'phone', type: 'string', isPrimaryKey: false, isNullable: true, isUnique: false, isForeignKey: false },
          { id: uuid(), name: 'mobile', type: 'string', isPrimaryKey: false, isNullable: true, isUnique: false, isForeignKey: false },
          { id: uuid(), name: 'job_title', type: 'string', isPrimaryKey: false, isNullable: true, isUnique: false, isForeignKey: false },
          { id: uuid(), name: 'department', type: 'string', isPrimaryKey: false, isNullable: true, isUnique: false, isForeignKey: false },
          { id: uuid(), name: 'lead_source', type: 'string', isPrimaryKey: false, isNullable: true, isUnique: false, isForeignKey: false },
          { id: uuid(), name: 'lifecycle_stage', type: 'string', isPrimaryKey: false, isNullable: false, isUnique: false, isForeignKey: false, defaultValue: 'lead' },
          { id: uuid(), name: 'owner_id', type: 'uuid', isPrimaryKey: false, isNullable: true, isUnique: false, isForeignKey: false },
          { id: uuid(), name: 'last_contacted_at', type: 'datetime', isPrimaryKey: false, isNullable: true, isUnique: false, isForeignKey: false },
          { id: uuid(), name: 'created_at', type: 'datetime', isPrimaryKey: false, isNullable: false, isUnique: false, isForeignKey: false },
          { id: uuid(), name: 'updated_at', type: 'datetime', isPrimaryKey: false, isNullable: false, isUnique: false, isForeignKey: false },
        ],
      },
      {
        id: companyId, name: 'Company', position: { x: 500, y: 100 },
        fields: [
          { id: companyPk, name: 'id', type: 'uuid', isPrimaryKey: true, isNullable: false, isUnique: true, isForeignKey: false },
          { id: uuid(), name: 'name', type: 'string', isPrimaryKey: false, isNullable: false, isUnique: false, isForeignKey: false },
          { id: uuid(), name: 'domain', type: 'string', isPrimaryKey: false, isNullable: true, isUnique: true, isForeignKey: false },
          { id: uuid(), name: 'industry', type: 'string', isPrimaryKey: false, isNullable: true, isUnique: false, isForeignKey: false },
          { id: uuid(), name: 'company_size', type: 'string', isPrimaryKey: false, isNullable: true, isUnique: false, isForeignKey: false },
          { id: uuid(), name: 'annual_revenue', type: 'float', isPrimaryKey: false, isNullable: true, isUnique: false, isForeignKey: false },
          { id: uuid(), name: 'address', type: 'text', isPrimaryKey: false, isNullable: true, isUnique: false, isForeignKey: false },
          { id: uuid(), name: 'city', type: 'string', isPrimaryKey: false, isNullable: true, isUnique: false, isForeignKey: false },
          { id: uuid(), name: 'country', type: 'string', isPrimaryKey: false, isNullable: true, isUnique: false, isForeignKey: false },
          { id: uuid(), name: 'website', type: 'string', isPrimaryKey: false, isNullable: true, isUnique: false, isForeignKey: false },
          { id: uuid(), name: 'linkedin_url', type: 'string', isPrimaryKey: false, isNullable: true, isUnique: false, isForeignKey: false },
          { id: uuid(), name: 'created_at', type: 'datetime', isPrimaryKey: false, isNullable: false, isUnique: false, isForeignKey: false },
        ],
      },
      {
        id: dealId, name: 'Deal', position: { x: 900, y: 100 },
        fields: [
          { id: dealPk, name: 'id', type: 'uuid', isPrimaryKey: true, isNullable: false, isUnique: true, isForeignKey: false },
          { id: uuid(), name: 'title', type: 'string', isPrimaryKey: false, isNullable: false, isUnique: false, isForeignKey: false },
          { id: uuid(), name: 'value', type: 'float', isPrimaryKey: false, isNullable: false, isUnique: false, isForeignKey: false },
          { id: uuid(), name: 'currency', type: 'string', isPrimaryKey: false, isNullable: false, isUnique: false, isForeignKey: false, defaultValue: 'USD' },
          { id: uuid(), name: 'stage', type: 'string', isPrimaryKey: false, isNullable: false, isUnique: false, isForeignKey: false, defaultValue: 'prospecting' },
          { id: uuid(), name: 'probability', type: 'integer', isPrimaryKey: false, isNullable: false, isUnique: false, isForeignKey: false, defaultValue: '10' },
          { id: uuid(), name: 'expected_close_date', type: 'date', isPrimaryKey: false, isNullable: true, isUnique: false, isForeignKey: false },
          { id: uuid(), name: 'actual_close_date', type: 'date', isPrimaryKey: false, isNullable: true, isUnique: false, isForeignKey: false },
          { id: uuid(), name: 'loss_reason', type: 'text', isPrimaryKey: false, isNullable: true, isUnique: false, isForeignKey: false },
          { id: uuid(), name: 'owner_id', type: 'uuid', isPrimaryKey: false, isNullable: true, isUnique: false, isForeignKey: false },
          { id: uuid(), name: 'created_at', type: 'datetime', isPrimaryKey: false, isNullable: false, isUnique: false, isForeignKey: false },
          { id: uuid(), name: 'updated_at', type: 'datetime', isPrimaryKey: false, isNullable: false, isUnique: false, isForeignKey: false },
        ],
      },
      {
        id: activityId, name: 'Activity', position: { x: 100, y: 450 },
        fields: [
          { id: activityPk, name: 'id', type: 'uuid', isPrimaryKey: true, isNullable: false, isUnique: true, isForeignKey: false },
          { id: uuid(), name: 'type', type: 'string', isPrimaryKey: false, isNullable: false, isUnique: false, isForeignKey: false },
          { id: uuid(), name: 'subject', type: 'string', isPrimaryKey: false, isNullable: false, isUnique: false, isForeignKey: false },
          { id: uuid(), name: 'description', type: 'text', isPrimaryKey: false, isNullable: true, isUnique: false, isForeignKey: false },
          { id: uuid(), name: 'duration_minutes', type: 'integer', isPrimaryKey: false, isNullable: true, isUnique: false, isForeignKey: false },
          { id: uuid(), name: 'scheduled_at', type: 'datetime', isPrimaryKey: false, isNullable: true, isUnique: false, isForeignKey: false },
          { id: uuid(), name: 'completed_at', type: 'datetime', isPrimaryKey: false, isNullable: true, isUnique: false, isForeignKey: false },
          { id: uuid(), name: 'outcome', type: 'text', isPrimaryKey: false, isNullable: true, isUnique: false, isForeignKey: false },
          { id: uuid(), name: 'created_by', type: 'uuid', isPrimaryKey: false, isNullable: true, isUnique: false, isForeignKey: false },
          { id: activityContactFk, name: 'contact_id', type: 'uuid', isPrimaryKey: false, isNullable: true, isUnique: false, isForeignKey: true, foreignKeyRef: { entityId: contactId, fieldId: contactPk } },
          { id: activityDealFk, name: 'deal_id', type: 'uuid', isPrimaryKey: false, isNullable: true, isUnique: false, isForeignKey: true, foreignKeyRef: { entityId: dealId, fieldId: dealPk } },
        ],
      },
      {
        id: pipelineId, name: 'Pipeline', position: { x: 500, y: 450 },
        fields: [
          { id: pipelinePk, name: 'id', type: 'uuid', isPrimaryKey: true, isNullable: false, isUnique: true, isForeignKey: false },
          { id: uuid(), name: 'name', type: 'string', isPrimaryKey: false, isNullable: false, isUnique: false, isForeignKey: false },
          { id: uuid(), name: 'description', type: 'text', isPrimaryKey: false, isNullable: true, isUnique: false, isForeignKey: false },
          { id: uuid(), name: 'is_default', type: 'boolean', isPrimaryKey: false, isNullable: false, isUnique: false, isForeignKey: false, defaultValue: 'false' },
          { id: uuid(), name: 'stages', type: 'text', isPrimaryKey: false, isNullable: false, isUnique: false, isForeignKey: false },
          { id: uuid(), name: 'created_at', type: 'datetime', isPrimaryKey: false, isNullable: false, isUnique: false, isForeignKey: false },
        ],
      },
      {
        id: taskId, name: 'Task', position: { x: 900, y: 450 },
        fields: [
          { id: taskPk, name: 'id', type: 'uuid', isPrimaryKey: true, isNullable: false, isUnique: true, isForeignKey: false },
          { id: uuid(), name: 'title', type: 'string', isPrimaryKey: false, isNullable: false, isUnique: false, isForeignKey: false },
          { id: uuid(), name: 'description', type: 'text', isPrimaryKey: false, isNullable: true, isUnique: false, isForeignKey: false },
          { id: uuid(), name: 'priority', type: 'string', isPrimaryKey: false, isNullable: false, isUnique: false, isForeignKey: false, defaultValue: 'medium' },
          { id: uuid(), name: 'status', type: 'string', isPrimaryKey: false, isNullable: false, isUnique: false, isForeignKey: false, defaultValue: 'todo' },
          { id: uuid(), name: 'due_date', type: 'date', isPrimaryKey: false, isNullable: true, isUnique: false, isForeignKey: false },
          { id: uuid(), name: 'assigned_to', type: 'uuid', isPrimaryKey: false, isNullable: true, isUnique: false, isForeignKey: false },
          { id: taskDealFk, name: 'deal_id', type: 'uuid', isPrimaryKey: false, isNullable: true, isUnique: false, isForeignKey: true, foreignKeyRef: { entityId: dealId, fieldId: dealPk } },
          { id: uuid(), name: 'completed_at', type: 'datetime', isPrimaryKey: false, isNullable: true, isUnique: false, isForeignKey: false },
          { id: uuid(), name: 'created_at', type: 'datetime', isPrimaryKey: false, isNullable: false, isUnique: false, isForeignKey: false },
        ],
      },
      {
        id: emailTplId, name: 'EmailTemplate', position: { x: 500, y: 800 },
        fields: [
          { id: emailTplPk, name: 'id', type: 'uuid', isPrimaryKey: true, isNullable: false, isUnique: true, isForeignKey: false },
          { id: uuid(), name: 'name', type: 'string', isPrimaryKey: false, isNullable: false, isUnique: false, isForeignKey: false },
          { id: uuid(), name: 'subject', type: 'string', isPrimaryKey: false, isNullable: false, isUnique: false, isForeignKey: false },
          { id: uuid(), name: 'body_html', type: 'text', isPrimaryKey: false, isNullable: false, isUnique: false, isForeignKey: false },
          { id: uuid(), name: 'body_text', type: 'text', isPrimaryKey: false, isNullable: true, isUnique: false, isForeignKey: false },
          { id: uuid(), name: 'category', type: 'string', isPrimaryKey: false, isNullable: true, isUnique: false, isForeignKey: false },
          { id: uuid(), name: 'usage_count', type: 'integer', isPrimaryKey: false, isNullable: false, isUnique: false, isForeignKey: false, defaultValue: '0' },
          { id: uuid(), name: 'created_by', type: 'uuid', isPrimaryKey: false, isNullable: true, isUnique: false, isForeignKey: false },
          { id: uuid(), name: 'created_at', type: 'datetime', isPrimaryKey: false, isNullable: false, isUnique: false, isForeignKey: false },
        ],
      },
    ],
    relations: [],
    relationships: [
      // WorksAt (Contact → Company, N:1)
      {
        id: uuid(), name: 'WorksAt', type: 'one-to-many', position: { x: 300, y: 50 },
        connections: [
          { id: uuid(), entityId: companyId, fieldId: companyPk, cardinality: '1', participation: 'partial', role: 'company' },
          { id: uuid(), entityId: contactId, fieldId: contactPk, cardinality: 'N', participation: 'partial', role: 'employee' },
        ],
        attributes: [
          { id: uuid(), name: 'start_date', type: 'date', isNullable: true },
          { id: uuid(), name: 'is_primary_contact', type: 'boolean', isNullable: false, defaultValue: 'false' },
        ],
        onDelete: 'SET_NULL', onUpdate: 'CASCADE',
        rules: [
          { id: uuid(), name: 'Max 1 Primary Contact', trigger: 'BEFORE_CREATE', scope: 'both', enabled: true, conditions: [], action: { type: 'THROW_ERROR', errorMessage: 'Company can only have one primary contact' } },
        ],
        constraints: [],
        isIdentifying: false, isRecursive: false, description: 'Contacts work at companies',
      },
      // OwnsDeal (Contact → Deal, 1:N)
      {
        id: uuid(), name: 'OwnsDeal', type: 'one-to-many', position: { x: 500, y: 50 },
        connections: [
          { id: uuid(), entityId: contactId, fieldId: contactPk, cardinality: '1', participation: 'partial', role: 'contact' },
          { id: uuid(), entityId: dealId, fieldId: dealPk, cardinality: 'N', participation: 'total', role: 'deal' },
        ],
        attributes: [
          { id: uuid(), name: 'role', type: 'string', isNullable: false, defaultValue: 'decision_maker' },
        ],
        onDelete: 'RESTRICT', onUpdate: 'CASCADE',
        rules: [
          { id: uuid(), name: 'Deal Value Positive', trigger: 'BEFORE_CREATE', scope: 'database', enabled: true, conditions: [{ id: uuid(), type: 'comparison', leftOperand: 'deal.value', operator: '>', rightOperand: '0' }], action: { type: 'THROW_ERROR', errorMessage: 'Deal value must be positive' } },
          { id: uuid(), name: 'Probability Range', trigger: 'BEFORE_UPDATE', scope: 'database', enabled: true, conditions: [{ id: uuid(), type: 'comparison', leftOperand: 'deal.probability', operator: '>=', rightOperand: '0' }, { id: uuid(), type: 'comparison', leftOperand: 'deal.probability', operator: '<=', rightOperand: '100', logicalOperator: 'AND' }], action: { type: 'THROW_ERROR', errorMessage: 'Probability must be between 0 and 100' } },
        ],
        constraints: [
          { id: uuid(), name: 'Positive Deal Value', type: 'check', enabled: true, checkExpression: 'value > 0' },
          { id: uuid(), name: 'Valid Probability', type: 'check', enabled: true, checkExpression: 'probability >= 0 AND probability <= 100' },
        ],
        isIdentifying: false, isRecursive: false, description: 'Contacts own deals with roles',
      },
      // LogsActivity (Contact → Activity, 1:N)
      {
        id: uuid(), name: 'LogsActivity', type: 'one-to-many', position: { x: 100, y: 280 },
        connections: [
          { id: uuid(), entityId: contactId, fieldId: contactPk, cardinality: '1', participation: 'partial', role: 'contact' },
          { id: uuid(), entityId: activityId, fieldId: activityContactFk, cardinality: 'N', participation: 'total', role: 'activity' },
        ],
        attributes: [],
        onDelete: 'CASCADE', onUpdate: 'CASCADE',
        rules: [
          { id: uuid(), name: 'Auto-Update Last Contacted', trigger: 'AFTER_CREATE', scope: 'both', enabled: true, conditions: [], action: { type: 'UPDATE_FIELD', updateField: { entity: 'Contact', field: 'last_contacted_at', value: 'NOW()' } } },
        ],
        constraints: [],
        isIdentifying: false, isRecursive: false, description: 'Contact activities auto-update last_contacted_at',
      },
      // DealActivity (Deal → Activity, 1:N)
      {
        id: uuid(), name: 'DealActivity', type: 'one-to-many', position: { x: 500, y: 280 },
        connections: [
          { id: uuid(), entityId: dealId, fieldId: dealPk, cardinality: '1', participation: 'partial', role: 'deal' },
          { id: uuid(), entityId: activityId, fieldId: activityDealFk, cardinality: 'N', participation: 'partial', role: 'activity' },
        ],
        attributes: [],
        onDelete: 'CASCADE', onUpdate: 'CASCADE',
        rules: [
          { id: uuid(), name: 'Log Stage Changes', description: 'Automatically log an activity when deal stage changes', trigger: 'AFTER_UPDATE', scope: 'backend', enabled: true, conditions: [], action: { type: 'LOG' } },
        ],
        constraints: [],
        isIdentifying: false, isRecursive: false, description: 'Deal stage changes are logged as activities',
      },
      // HasTask (Deal → Task, 1:N)
      {
        id: uuid(), name: 'HasTask', type: 'one-to-many', position: { x: 900, y: 280 },
        connections: [
          { id: uuid(), entityId: dealId, fieldId: dealPk, cardinality: '1', participation: 'partial', role: 'deal' },
          { id: uuid(), entityId: taskId, fieldId: taskDealFk, cardinality: 'N', participation: 'partial', role: 'task' },
        ],
        attributes: [],
        onDelete: 'CASCADE', onUpdate: 'CASCADE',
        rules: [
          { id: uuid(), name: 'Auto-Create Follow-Up', description: 'Create a follow-up task when deal stage changes', trigger: 'AFTER_UPDATE', scope: 'backend', enabled: true, conditions: [], action: { type: 'CUSTOM', customCode: 'CREATE Task SET title="Follow up on " + deal.title, due_date=NOW()+7d, deal_id=deal.id' } },
        ],
        constraints: [],
        isIdentifying: false, isRecursive: false, description: 'Deals have associated tasks with auto-follow-up',
      },
      // BelongsToPipeline (Deal → Pipeline, N:1)
      {
        id: uuid(), name: 'BelongsToPipeline', type: 'one-to-many', position: { x: 700, y: 450 },
        connections: [
          { id: uuid(), entityId: pipelineId, fieldId: pipelinePk, cardinality: '1', participation: 'partial', role: 'pipeline' },
          { id: uuid(), entityId: dealId, fieldId: dealPk, cardinality: 'N', participation: 'total', role: 'deal' },
        ],
        attributes: [],
        onDelete: 'RESTRICT', onUpdate: 'CASCADE',
        rules: [
          { id: uuid(), name: 'Validate Stage', description: 'Deal stage must be one of the pipeline defined stages', trigger: 'BEFORE_UPDATE', scope: 'both', enabled: true, conditions: [], action: { type: 'THROW_ERROR', errorMessage: 'Deal stage must match pipeline stages' } },
        ],
        constraints: [],
        isIdentifying: false, isRecursive: false, description: 'Deals belong to pipelines with stage validation',
      },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}
