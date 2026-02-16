

# Production-Grade Template Overhaul

## Problem
Every template today is just 3 entities with basic fields -- no relationships, no attributes, no business rules, no constraints. They look like toy demos, not real-world schemas.

## What Changes

### File: `src/lib/projectStore.ts`
Complete rewrite of all 4 template builder functions + add 1 new Blog template. Every template will become a fully wired production schema.

---

### Authentication System (6 entities, 4 relationships, 8+ rules)

**Entities:**
- **User** -- id, username, email, password_hash, first_name, last_name, is_active, is_verified, last_login, created_at, updated_at
- **Role** -- id, name, description, is_system_role, priority, created_at
- **Permission** -- id, name, resource, action (CRUD enum), description
- **Session** -- id, user_id (FK), token_hash, ip_address, user_agent, expires_at, created_at, revoked_at
- **AuditLog** -- id, user_id (FK), action, resource, resource_id, ip_address, metadata (json), created_at
- **PasswordReset** -- id, user_id (FK), token_hash, expires_at, used_at, created_at

**Relationships:**
- `HasRole` (User - Role, M:N) -- attributes: assigned_at, assigned_by, expires_at; rule: max 10 roles per user
- `GrantsPermission` (Role - Permission, M:N) -- attribute: granted_at; constraint: unique(role_id, permission_id)
- `OwnsSession` (User - Session, 1:N) -- rule: max 5 active sessions, auto-revoke oldest on overflow; constraint: check expires_at > created_at
- `LogsAction` (User - AuditLog, 1:N) -- attribute: severity_level

**Rules:** Session expiry validation, password reset token TTL (24h), inactive user login block, duplicate role assignment prevention

---

### Learning Management System (7 entities, 6 relationships, 10+ rules)

**Entities:**
- **Student** -- id, student_number (unique), first_name, last_name, email, date_of_birth, enrollment_status (active/suspended/graduated), gpa, enrolled_at, created_at
- **Instructor** -- id, employee_id (unique), first_name, last_name, email, department, title, hire_date, is_active
- **Course** -- id, course_code (unique), title, description, credits (1-6), max_capacity, department, semester, year, is_active
- **Assignment** -- id, course_id (FK), title, description, max_score, due_date, weight_percentage, created_at
- **Submission** -- id, assignment_id (FK), student_id (FK), content, submitted_at, score, feedback, graded_at, graded_by
- **Department** -- id, name, code (unique), head_instructor_id (FK), budget
- **Semester** -- id, name, start_date, end_date, registration_deadline, is_current

**Relationships:**
- `Enrolls` (Student - Course, M:N) -- attributes: enrollment_date, grade, status (enrolled/dropped/completed), attendance_percentage; rules: max 6 courses per semester, grade 0-100, cannot enroll if suspended, check prerequisite completion
- `Teaches` (Instructor - Course, 1:N) -- attributes: assigned_at, is_primary; rule: instructor must be active, max 4 courses per semester
- `Submits` (Student - Submission, 1:N via Assignment) -- attributes: submitted_at, is_late; rules: cannot submit after due_date unless extension granted, score <= max_score
- `BelongsTo` (Course - Department, N:1) -- rule: course code must match department prefix
- `Prerequisite` (Course - Course, M:N, recursive) -- attributes: min_grade_required; rule: prevent circular prerequisites
- `Advises` (Instructor - Student, 1:N) -- attributes: assigned_at; rule: max 25 advisees per instructor

---

### E-Commerce Store (8 entities, 7 relationships, 12+ rules)

**Entities:**
- **Product** -- id, sku (unique), name, description, base_price, cost_price, stock_quantity, min_stock_threshold, weight, is_active, created_at, updated_at
- **Customer** -- id, email (unique), first_name, last_name, phone, shipping_address, billing_address, loyalty_points, tier (bronze/silver/gold/platinum), created_at
- **Order** -- id, customer_id (FK), order_number (unique), subtotal, tax_amount, shipping_cost, discount_amount, total, status (pending/confirmed/processing/shipped/delivered/cancelled/refunded), payment_method, payment_status, shipping_address, tracking_number, notes, ordered_at, shipped_at, delivered_at
- **OrderItem** -- id, order_id (FK), product_id (FK), quantity, unit_price, discount_percent, line_total
- **Category** -- id, name, slug (unique), parent_category_id (FK, self-ref), description, sort_order, is_active
- **Review** -- id, product_id (FK), customer_id (FK), rating (1-5), title, body, is_verified_purchase, created_at
- **Coupon** -- id, code (unique), discount_type (percentage/fixed), discount_value, min_order_amount, max_uses, current_uses, valid_from, valid_until, is_active
- **Inventory** -- id, product_id (FK), warehouse_location, quantity_on_hand, quantity_reserved, last_restocked_at

**Relationships:**
- `Places` (Customer - Order, 1:N) -- rule: cannot place order if previous order unpaid
- `Contains` (Order - Product, M:N via OrderItem) -- attributes: quantity, unit_price, discount_percent; rules: quantity > 0, stock check before confirmation, auto-decrement stock on confirmation
- `BelongsToCategory` (Product - Category, N:1)
- `Reviews` (Customer - Product, M:N) -- attributes: rating, created_at; rules: must have purchased product, one review per product per customer, rating 1-5
- `AppliesCoupon` (Coupon - Order, 1:N) -- rules: check coupon validity dates, check min_order_amount, increment current_uses, check max_uses
- `TracksInventory` (Product - Inventory, 1:N) -- rule: alert when quantity_on_hand < min_stock_threshold
- `HasSubcategory` (Category - Category, 1:N, recursive) -- rule: max 3 nesting levels

---

### CRM System (7 entities, 6 relationships, 10+ rules)

**Entities:**
- **Contact** -- id, first_name, last_name, email (unique), phone, mobile, job_title, department, lead_source (website/referral/cold_call/event/other), lifecycle_stage (lead/mql/sql/opportunity/customer), owner_id, last_contacted_at, created_at, updated_at
- **Company** -- id, name, domain (unique), industry, company_size (startup/smb/mid/enterprise), annual_revenue, address, city, country, website, linkedin_url, created_at
- **Deal** -- id, title, value, currency, stage (prospecting/qualification/proposal/negotiation/closed_won/closed_lost), probability, expected_close_date, actual_close_date, loss_reason, owner_id, created_at, updated_at
- **Activity** -- id, type (call/email/meeting/note/task), subject, description, duration_minutes, scheduled_at, completed_at, outcome, created_by
- **Pipeline** -- id, name, description, is_default, stages (json), created_at
- **Task** -- id, title, description, priority (low/medium/high/urgent), status (todo/in_progress/done/cancelled), due_date, assigned_to, completed_at, created_at
- **EmailTemplate** -- id, name, subject, body_html, body_text, category, usage_count, created_by, created_at

**Relationships:**
- `WorksAt` (Contact - Company, N:1) -- attributes: start_date, is_primary_contact; rule: max 1 primary contact per company
- `OwnsDeal` (Contact - Deal, 1:N) -- attributes: role (decision_maker/influencer/champion/blocker); rule: deal value > 0, probability 0-100
- `LogsActivity` (Contact - Activity, 1:N) -- rule: auto-update last_contacted_at on contact
- `DealActivity` (Deal - Activity, 1:N) -- rule: log stage changes as activities
- `HasTask` (Deal - Task, 1:N) -- rule: auto-create follow-up task on stage change
- `BelongsToPipeline` (Deal - Pipeline, N:1) -- rule: validate deal stage matches pipeline stages

---

### Blog Platform (NEW -- 6 entities, 5 relationships, 8+ rules)

**Entities:**
- **User** -- id, username (unique), email (unique), display_name, bio, avatar_url, role (admin/editor/author/subscriber), is_active, last_login, created_at
- **Post** -- id, author_id (FK), title, slug (unique), excerpt, content, status (draft/review/published/archived), featured_image_url, is_featured, view_count, published_at, created_at, updated_at
- **Comment** -- id, post_id (FK), author_id (FK), parent_comment_id (FK, self-ref), content, status (pending/approved/spam/deleted), ip_address, created_at
- **Tag** -- id, name (unique), slug (unique), description, post_count, created_at
- **Category** -- id, name (unique), slug (unique), description, parent_id (FK, self-ref), sort_order
- **Media** -- id, uploaded_by (FK), filename, mime_type, file_size, url, alt_text, created_at

**Relationships:**
- `Authors` (User - Post, 1:N) -- rule: only users with role author/editor/admin can publish
- `CommentsOn` (User - Post via Comment, M:N) -- attributes: content, status; rules: cannot comment on own post (optional toggle), max 3 nesting levels for replies, auto-moderate spam
- `TaggedWith` (Post - Tag, M:N) -- attributes: tagged_at; rules: max 10 tags per post, auto-increment post_count on tag
- `InCategory` (Post - Category, N:1) -- rule: published posts must have a category
- `HasSubcategory` (Category - Category, 1:N, recursive) -- rule: max 2 nesting levels

---

### File: `src/components/home/HomeScreen.tsx`
- Add `blog` icon mapping using a `PenTool` or `BookOpen` icon from lucide
- Update template descriptions to reflect the production-grade content (e.g., "6 entities, 4 relationships, RBAC, sessions, audit logging")
- Add entity/relationship count badges on template cards

### Canvas Layout Strategy
Entities placed on a wide grid (columns at x=100, 500, 900 and rows at y=100, 450, 800) so relationship diamonds fit cleanly between them without overlap.

### Technical Notes
- All entity field IDs stored in variables so relationships can reference them via `connections[].entityId` and `connections[].fieldId`
- Relationship attributes use proper `RelationshipAttribute[]` with check constraints where applicable
- Rules use structured `RuleCondition[]` with proper triggers (BEFORE_CREATE, AFTER_UPDATE, etc.)
- Constraints use `RelationshipConstraint[]` with max_relations, unique, and check types
- Every relationship gets proper `onDelete`/`onUpdate` actions (CASCADE, RESTRICT, SET_NULL as appropriate)

