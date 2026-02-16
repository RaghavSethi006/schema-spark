import { ERSchema } from '../schema';
import { v4 as uuid } from 'uuid';

export function createLMSSchema(): ERSchema {
  const studentId = uuid(), instructorId = uuid(), courseId = uuid(),
        assignmentId = uuid(), submissionId = uuid(), deptId = uuid(), semesterId = uuid();

  const studentPk = uuid(), instructorPk = uuid(), coursePk = uuid(),
        assignmentPk = uuid(), submissionPk = uuid(), deptPk = uuid(), semesterPk = uuid();

  const assignmentCourseFk = uuid(), submissionAssignmentFk = uuid(), submissionStudentFk = uuid(),
        deptHeadFk = uuid();

  return {
    version: '1.0.0', name: 'Learning Management System',
    entities: [
      {
        id: studentId, name: 'Student', position: { x: 100, y: 100 },
        fields: [
          { id: studentPk, name: 'id', type: 'uuid', isPrimaryKey: true, isNullable: false, isUnique: true, isForeignKey: false },
          { id: uuid(), name: 'student_number', type: 'string', isPrimaryKey: false, isNullable: false, isUnique: true, isForeignKey: false },
          { id: uuid(), name: 'first_name', type: 'string', isPrimaryKey: false, isNullable: false, isUnique: false, isForeignKey: false },
          { id: uuid(), name: 'last_name', type: 'string', isPrimaryKey: false, isNullable: false, isUnique: false, isForeignKey: false },
          { id: uuid(), name: 'email', type: 'string', isPrimaryKey: false, isNullable: false, isUnique: true, isForeignKey: false },
          { id: uuid(), name: 'date_of_birth', type: 'date', isPrimaryKey: false, isNullable: true, isUnique: false, isForeignKey: false },
          { id: uuid(), name: 'enrollment_status', type: 'string', isPrimaryKey: false, isNullable: false, isUnique: false, isForeignKey: false, defaultValue: 'active' },
          { id: uuid(), name: 'gpa', type: 'float', isPrimaryKey: false, isNullable: true, isUnique: false, isForeignKey: false },
          { id: uuid(), name: 'enrolled_at', type: 'datetime', isPrimaryKey: false, isNullable: false, isUnique: false, isForeignKey: false },
          { id: uuid(), name: 'created_at', type: 'datetime', isPrimaryKey: false, isNullable: false, isUnique: false, isForeignKey: false },
        ],
      },
      {
        id: instructorId, name: 'Instructor', position: { x: 500, y: 100 },
        fields: [
          { id: instructorPk, name: 'id', type: 'uuid', isPrimaryKey: true, isNullable: false, isUnique: true, isForeignKey: false },
          { id: uuid(), name: 'employee_id', type: 'string', isPrimaryKey: false, isNullable: false, isUnique: true, isForeignKey: false },
          { id: uuid(), name: 'first_name', type: 'string', isPrimaryKey: false, isNullable: false, isUnique: false, isForeignKey: false },
          { id: uuid(), name: 'last_name', type: 'string', isPrimaryKey: false, isNullable: false, isUnique: false, isForeignKey: false },
          { id: uuid(), name: 'email', type: 'string', isPrimaryKey: false, isNullable: false, isUnique: true, isForeignKey: false },
          { id: uuid(), name: 'department', type: 'string', isPrimaryKey: false, isNullable: false, isUnique: false, isForeignKey: false },
          { id: uuid(), name: 'title', type: 'string', isPrimaryKey: false, isNullable: true, isUnique: false, isForeignKey: false },
          { id: uuid(), name: 'hire_date', type: 'date', isPrimaryKey: false, isNullable: false, isUnique: false, isForeignKey: false },
          { id: uuid(), name: 'is_active', type: 'boolean', isPrimaryKey: false, isNullable: false, isUnique: false, isForeignKey: false, defaultValue: 'true' },
        ],
      },
      {
        id: courseId, name: 'Course', position: { x: 900, y: 100 },
        fields: [
          { id: coursePk, name: 'id', type: 'uuid', isPrimaryKey: true, isNullable: false, isUnique: true, isForeignKey: false },
          { id: uuid(), name: 'course_code', type: 'string', isPrimaryKey: false, isNullable: false, isUnique: true, isForeignKey: false },
          { id: uuid(), name: 'title', type: 'string', isPrimaryKey: false, isNullable: false, isUnique: false, isForeignKey: false },
          { id: uuid(), name: 'description', type: 'text', isPrimaryKey: false, isNullable: true, isUnique: false, isForeignKey: false },
          { id: uuid(), name: 'credits', type: 'integer', isPrimaryKey: false, isNullable: false, isUnique: false, isForeignKey: false },
          { id: uuid(), name: 'max_capacity', type: 'integer', isPrimaryKey: false, isNullable: false, isUnique: false, isForeignKey: false, defaultValue: '30' },
          { id: uuid(), name: 'department', type: 'string', isPrimaryKey: false, isNullable: false, isUnique: false, isForeignKey: false },
          { id: uuid(), name: 'semester', type: 'string', isPrimaryKey: false, isNullable: false, isUnique: false, isForeignKey: false },
          { id: uuid(), name: 'year', type: 'integer', isPrimaryKey: false, isNullable: false, isUnique: false, isForeignKey: false },
          { id: uuid(), name: 'is_active', type: 'boolean', isPrimaryKey: false, isNullable: false, isUnique: false, isForeignKey: false, defaultValue: 'true' },
        ],
      },
      {
        id: assignmentId, name: 'Assignment', position: { x: 100, y: 450 },
        fields: [
          { id: assignmentPk, name: 'id', type: 'uuid', isPrimaryKey: true, isNullable: false, isUnique: true, isForeignKey: false },
          { id: assignmentCourseFk, name: 'course_id', type: 'uuid', isPrimaryKey: false, isNullable: false, isUnique: false, isForeignKey: true, foreignKeyRef: { entityId: courseId, fieldId: coursePk } },
          { id: uuid(), name: 'title', type: 'string', isPrimaryKey: false, isNullable: false, isUnique: false, isForeignKey: false },
          { id: uuid(), name: 'description', type: 'text', isPrimaryKey: false, isNullable: true, isUnique: false, isForeignKey: false },
          { id: uuid(), name: 'max_score', type: 'integer', isPrimaryKey: false, isNullable: false, isUnique: false, isForeignKey: false, defaultValue: '100' },
          { id: uuid(), name: 'due_date', type: 'datetime', isPrimaryKey: false, isNullable: false, isUnique: false, isForeignKey: false },
          { id: uuid(), name: 'weight_percentage', type: 'float', isPrimaryKey: false, isNullable: false, isUnique: false, isForeignKey: false },
          { id: uuid(), name: 'created_at', type: 'datetime', isPrimaryKey: false, isNullable: false, isUnique: false, isForeignKey: false },
        ],
      },
      {
        id: submissionId, name: 'Submission', position: { x: 500, y: 450 },
        fields: [
          { id: submissionPk, name: 'id', type: 'uuid', isPrimaryKey: true, isNullable: false, isUnique: true, isForeignKey: false },
          { id: submissionAssignmentFk, name: 'assignment_id', type: 'uuid', isPrimaryKey: false, isNullable: false, isUnique: false, isForeignKey: true, foreignKeyRef: { entityId: assignmentId, fieldId: assignmentPk } },
          { id: submissionStudentFk, name: 'student_id', type: 'uuid', isPrimaryKey: false, isNullable: false, isUnique: false, isForeignKey: true, foreignKeyRef: { entityId: studentId, fieldId: studentPk } },
          { id: uuid(), name: 'content', type: 'text', isPrimaryKey: false, isNullable: true, isUnique: false, isForeignKey: false },
          { id: uuid(), name: 'submitted_at', type: 'datetime', isPrimaryKey: false, isNullable: false, isUnique: false, isForeignKey: false },
          { id: uuid(), name: 'score', type: 'float', isPrimaryKey: false, isNullable: true, isUnique: false, isForeignKey: false },
          { id: uuid(), name: 'feedback', type: 'text', isPrimaryKey: false, isNullable: true, isUnique: false, isForeignKey: false },
          { id: uuid(), name: 'graded_at', type: 'datetime', isPrimaryKey: false, isNullable: true, isUnique: false, isForeignKey: false },
          { id: uuid(), name: 'graded_by', type: 'uuid', isPrimaryKey: false, isNullable: true, isUnique: false, isForeignKey: false },
        ],
      },
      {
        id: deptId, name: 'Department', position: { x: 900, y: 450 },
        fields: [
          { id: deptPk, name: 'id', type: 'uuid', isPrimaryKey: true, isNullable: false, isUnique: true, isForeignKey: false },
          { id: uuid(), name: 'name', type: 'string', isPrimaryKey: false, isNullable: false, isUnique: false, isForeignKey: false },
          { id: uuid(), name: 'code', type: 'string', isPrimaryKey: false, isNullable: false, isUnique: true, isForeignKey: false },
          { id: deptHeadFk, name: 'head_instructor_id', type: 'uuid', isPrimaryKey: false, isNullable: true, isUnique: false, isForeignKey: true, foreignKeyRef: { entityId: instructorId, fieldId: instructorPk } },
          { id: uuid(), name: 'budget', type: 'float', isPrimaryKey: false, isNullable: true, isUnique: false, isForeignKey: false },
        ],
      },
      {
        id: semesterId, name: 'Semester', position: { x: 500, y: 800 },
        fields: [
          { id: semesterPk, name: 'id', type: 'uuid', isPrimaryKey: true, isNullable: false, isUnique: true, isForeignKey: false },
          { id: uuid(), name: 'name', type: 'string', isPrimaryKey: false, isNullable: false, isUnique: false, isForeignKey: false },
          { id: uuid(), name: 'start_date', type: 'date', isPrimaryKey: false, isNullable: false, isUnique: false, isForeignKey: false },
          { id: uuid(), name: 'end_date', type: 'date', isPrimaryKey: false, isNullable: false, isUnique: false, isForeignKey: false },
          { id: uuid(), name: 'registration_deadline', type: 'date', isPrimaryKey: false, isNullable: false, isUnique: false, isForeignKey: false },
          { id: uuid(), name: 'is_current', type: 'boolean', isPrimaryKey: false, isNullable: false, isUnique: false, isForeignKey: false, defaultValue: 'false' },
        ],
      },
    ],
    relations: [],
    relationships: [
      // Enrolls (Student ↔ Course, M:N)
      {
        id: uuid(), name: 'Enrolls', type: 'many-to-many', position: { x: 500, y: 50 },
        connections: [
          { id: uuid(), entityId: studentId, fieldId: studentPk, cardinality: 'N', participation: 'partial', role: 'student' },
          { id: uuid(), entityId: courseId, fieldId: coursePk, cardinality: 'M', participation: 'partial', role: 'course' },
        ],
        attributes: [
          { id: uuid(), name: 'enrollment_date', type: 'datetime', isNullable: false },
          { id: uuid(), name: 'grade', type: 'float', isNullable: true, checkConstraint: 'grade BETWEEN 0 AND 100' },
          { id: uuid(), name: 'status', type: 'string', isNullable: false, defaultValue: 'enrolled' },
          { id: uuid(), name: 'attendance_percentage', type: 'float', isNullable: true, checkConstraint: 'attendance_percentage BETWEEN 0 AND 100' },
        ],
        onDelete: 'CASCADE', onUpdate: 'CASCADE',
        rules: [
          { id: uuid(), name: 'Max 6 Courses Per Semester', trigger: 'BEFORE_CREATE', scope: 'both', enabled: true, conditions: [{ id: uuid(), type: 'cardinality', leftOperand: 'student.enrollments.current_semester.count', operator: '<', rightOperand: '6' }], action: { type: 'THROW_ERROR', errorMessage: 'Student cannot enroll in more than 6 courses per semester' } },
          { id: uuid(), name: 'Grade Range Validation', trigger: 'BEFORE_UPDATE', scope: 'database', enabled: true, conditions: [{ id: uuid(), type: 'comparison', leftOperand: 'enrollment.grade', operator: '>=', rightOperand: '0' }, { id: uuid(), type: 'comparison', leftOperand: 'enrollment.grade', operator: '<=', rightOperand: '100', logicalOperator: 'AND' }], action: { type: 'THROW_ERROR', errorMessage: 'Grade must be between 0 and 100' } },
          { id: uuid(), name: 'Block Suspended Students', trigger: 'BEFORE_CREATE', scope: 'both', enabled: true, conditions: [{ id: uuid(), type: 'comparison', leftOperand: 'student.enrollment_status', operator: '!=', rightOperand: 'suspended' }], action: { type: 'THROW_ERROR', errorMessage: 'Suspended students cannot enroll' } },
          { id: uuid(), name: 'Capacity Check', trigger: 'BEFORE_CREATE', scope: 'both', enabled: true, conditions: [{ id: uuid(), type: 'cardinality', leftOperand: 'course.enrollments.count', operator: '<', rightOperand: 'course.max_capacity' }], action: { type: 'THROW_ERROR', errorMessage: 'Course has reached maximum capacity' } },
        ],
        constraints: [
          { id: uuid(), name: 'Unique Student-Course', type: 'unique', enabled: true, uniqueFields: ['student_id', 'course_id', 'semester'] },
          { id: uuid(), name: 'Grade Range', type: 'check', enabled: true, checkExpression: 'grade IS NULL OR (grade >= 0 AND grade <= 100)' },
          { id: uuid(), name: 'Max Enrollments', type: 'max_relations', enabled: true, maxRelationsConfig: { entityId: studentId, limit: 6 } },
        ],
        isIdentifying: false, isRecursive: false, description: 'Students enroll in courses with grades and attendance tracking',
      },
      // Teaches (Instructor → Course, 1:N)
      {
        id: uuid(), name: 'Teaches', type: 'one-to-many', position: { x: 700, y: 150 },
        connections: [
          { id: uuid(), entityId: instructorId, fieldId: instructorPk, cardinality: '1', participation: 'partial', role: 'instructor' },
          { id: uuid(), entityId: courseId, fieldId: coursePk, cardinality: 'N', participation: 'total', role: 'course' },
        ],
        attributes: [
          { id: uuid(), name: 'assigned_at', type: 'datetime', isNullable: false },
          { id: uuid(), name: 'is_primary', type: 'boolean', isNullable: false, defaultValue: 'true' },
        ],
        onDelete: 'RESTRICT', onUpdate: 'CASCADE',
        rules: [
          { id: uuid(), name: 'Instructor Must Be Active', trigger: 'BEFORE_CREATE', scope: 'both', enabled: true, conditions: [{ id: uuid(), type: 'comparison', leftOperand: 'instructor.is_active', operator: '==', rightOperand: 'true' }], action: { type: 'THROW_ERROR', errorMessage: 'Only active instructors can teach' } },
          { id: uuid(), name: 'Max 4 Courses Per Semester', trigger: 'BEFORE_CREATE', scope: 'both', enabled: true, conditions: [{ id: uuid(), type: 'cardinality', leftOperand: 'instructor.courses.current_semester.count', operator: '<', rightOperand: '4' }], action: { type: 'THROW_ERROR', errorMessage: 'Instructor cannot teach more than 4 courses per semester' } },
        ],
        constraints: [],
        isIdentifying: false, isRecursive: false, description: 'Instructors teach courses',
      },
      // Submits (Student → Submission via Assignment, 1:N)
      {
        id: uuid(), name: 'Submits', type: 'one-to-many', position: { x: 300, y: 450 },
        connections: [
          { id: uuid(), entityId: studentId, fieldId: studentPk, cardinality: '1', participation: 'partial', role: 'student' },
          { id: uuid(), entityId: submissionId, fieldId: submissionStudentFk, cardinality: 'N', participation: 'total', role: 'submission' },
        ],
        attributes: [
          { id: uuid(), name: 'is_late', type: 'boolean', isNullable: false, defaultValue: 'false' },
        ],
        onDelete: 'CASCADE', onUpdate: 'CASCADE',
        rules: [
          { id: uuid(), name: 'Score Cannot Exceed Max', trigger: 'BEFORE_UPDATE', scope: 'database', enabled: true, conditions: [{ id: uuid(), type: 'comparison', leftOperand: 'submission.score', operator: '<=', rightOperand: 'assignment.max_score' }], action: { type: 'THROW_ERROR', errorMessage: 'Score cannot exceed assignment max score' } },
          { id: uuid(), name: 'Late Submission Detection', trigger: 'BEFORE_CREATE', scope: 'backend', enabled: true, conditions: [{ id: uuid(), type: 'comparison', leftOperand: 'submission.submitted_at', operator: '>', rightOperand: 'assignment.due_date' }], action: { type: 'UPDATE_FIELD', updateField: { entity: 'Submission', field: 'is_late', value: 'true' } } },
        ],
        constraints: [
          { id: uuid(), name: 'Score Range', type: 'check', enabled: true, checkExpression: 'score IS NULL OR score >= 0' },
        ],
        isIdentifying: false, isRecursive: false, description: 'Students submit assignments',
      },
      // BelongsTo (Course → Department, N:1)
      {
        id: uuid(), name: 'BelongsToDept', type: 'one-to-many', position: { x: 900, y: 280 },
        connections: [
          { id: uuid(), entityId: deptId, fieldId: deptPk, cardinality: '1', participation: 'partial', role: 'department' },
          { id: uuid(), entityId: courseId, fieldId: coursePk, cardinality: 'N', participation: 'total', role: 'course' },
        ],
        attributes: [],
        onDelete: 'RESTRICT', onUpdate: 'CASCADE',
        rules: [
          { id: uuid(), name: 'Course Code Matches Dept', description: 'Course code prefix must match department code', trigger: 'BEFORE_CREATE', scope: 'backend', enabled: true, conditions: [], action: { type: 'THROW_ERROR', errorMessage: 'Course code must start with department code prefix' } },
        ],
        constraints: [],
        isIdentifying: false, isRecursive: false, description: 'Courses belong to departments',
      },
      // Prerequisite (Course ↔ Course, M:N recursive)
      {
        id: uuid(), name: 'Prerequisite', type: 'many-to-many', position: { x: 900, y: -50 },
        connections: [
          { id: uuid(), entityId: courseId, fieldId: coursePk, cardinality: 'N', participation: 'partial', role: 'course' },
          { id: uuid(), entityId: courseId, fieldId: coursePk, cardinality: 'M', participation: 'partial', role: 'prerequisite' },
        ],
        attributes: [
          { id: uuid(), name: 'min_grade_required', type: 'float', isNullable: false, defaultValue: '50', checkConstraint: 'min_grade_required BETWEEN 0 AND 100' },
        ],
        onDelete: 'CASCADE', onUpdate: 'CASCADE',
        rules: [
          { id: uuid(), name: 'Prevent Circular Prerequisites', trigger: 'BEFORE_CREATE', scope: 'both', enabled: true, conditions: [], action: { type: 'THROW_ERROR', errorMessage: 'Circular prerequisite chain detected' } },
        ],
        constraints: [
          { id: uuid(), name: 'No Self-Prerequisite', type: 'check', enabled: true, checkExpression: 'course_id != prerequisite_id' },
          { id: uuid(), name: 'Unique Prerequisite Pair', type: 'unique', enabled: true, uniqueFields: ['course_id', 'prerequisite_id'] },
        ],
        isIdentifying: false, isRecursive: true, description: 'Courses can require prerequisite courses',
      },
      // Advises (Instructor → Student, 1:N)
      {
        id: uuid(), name: 'Advises', type: 'one-to-many', position: { x: 300, y: 150 },
        connections: [
          { id: uuid(), entityId: instructorId, fieldId: instructorPk, cardinality: '1', participation: 'partial', role: 'advisor' },
          { id: uuid(), entityId: studentId, fieldId: studentPk, cardinality: 'N', participation: 'partial', role: 'advisee' },
        ],
        attributes: [
          { id: uuid(), name: 'assigned_at', type: 'datetime', isNullable: false },
        ],
        onDelete: 'SET_NULL', onUpdate: 'CASCADE',
        rules: [
          { id: uuid(), name: 'Max 25 Advisees', trigger: 'BEFORE_CREATE', scope: 'both', enabled: true, conditions: [{ id: uuid(), type: 'cardinality', leftOperand: 'instructor.advisees.count', operator: '<', rightOperand: '25' }], action: { type: 'THROW_ERROR', errorMessage: 'Instructor cannot advise more than 25 students' } },
        ],
        constraints: [
          { id: uuid(), name: 'Max Advisees', type: 'max_relations', enabled: true, maxRelationsConfig: { entityId: instructorId, limit: 25 } },
        ],
        isIdentifying: false, isRecursive: false, description: 'Instructors advise students',
      },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}
