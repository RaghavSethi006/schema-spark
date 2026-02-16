import { ERSchema } from '../schema';
import { v4 as uuid } from 'uuid';

export function createEcommerceSchema(): ERSchema {
  const productId = uuid(), customerId = uuid(), orderId = uuid(), orderItemId = uuid(),
        categoryId = uuid(), reviewId = uuid(), couponId = uuid(), inventoryId = uuid();

  const productPk = uuid(), customerPk = uuid(), orderPk = uuid(), orderItemPk = uuid(),
        categoryPk = uuid(), reviewPk = uuid(), couponPk = uuid(), inventoryPk = uuid();

  const orderCustomerFk = uuid(), orderItemOrderFk = uuid(), orderItemProductFk = uuid(),
        reviewProductFk = uuid(), reviewCustomerFk = uuid(), categoryParentFk = uuid(),
        inventoryProductFk = uuid();

  return {
    version: '1.0.0', name: 'E-Commerce Store',
    entities: [
      {
        id: productId, name: 'Product', position: { x: 100, y: 100 },
        fields: [
          { id: productPk, name: 'id', type: 'uuid', isPrimaryKey: true, isNullable: false, isUnique: true, isForeignKey: false },
          { id: uuid(), name: 'sku', type: 'string', isPrimaryKey: false, isNullable: false, isUnique: true, isForeignKey: false },
          { id: uuid(), name: 'name', type: 'string', isPrimaryKey: false, isNullable: false, isUnique: false, isForeignKey: false },
          { id: uuid(), name: 'description', type: 'text', isPrimaryKey: false, isNullable: true, isUnique: false, isForeignKey: false },
          { id: uuid(), name: 'base_price', type: 'float', isPrimaryKey: false, isNullable: false, isUnique: false, isForeignKey: false },
          { id: uuid(), name: 'cost_price', type: 'float', isPrimaryKey: false, isNullable: true, isUnique: false, isForeignKey: false },
          { id: uuid(), name: 'stock_quantity', type: 'integer', isPrimaryKey: false, isNullable: false, isUnique: false, isForeignKey: false, defaultValue: '0' },
          { id: uuid(), name: 'min_stock_threshold', type: 'integer', isPrimaryKey: false, isNullable: false, isUnique: false, isForeignKey: false, defaultValue: '10' },
          { id: uuid(), name: 'weight', type: 'float', isPrimaryKey: false, isNullable: true, isUnique: false, isForeignKey: false },
          { id: uuid(), name: 'is_active', type: 'boolean', isPrimaryKey: false, isNullable: false, isUnique: false, isForeignKey: false, defaultValue: 'true' },
          { id: uuid(), name: 'created_at', type: 'datetime', isPrimaryKey: false, isNullable: false, isUnique: false, isForeignKey: false },
          { id: uuid(), name: 'updated_at', type: 'datetime', isPrimaryKey: false, isNullable: false, isUnique: false, isForeignKey: false },
        ],
      },
      {
        id: customerId, name: 'Customer', position: { x: 500, y: 100 },
        fields: [
          { id: customerPk, name: 'id', type: 'uuid', isPrimaryKey: true, isNullable: false, isUnique: true, isForeignKey: false },
          { id: uuid(), name: 'email', type: 'string', isPrimaryKey: false, isNullable: false, isUnique: true, isForeignKey: false },
          { id: uuid(), name: 'first_name', type: 'string', isPrimaryKey: false, isNullable: false, isUnique: false, isForeignKey: false },
          { id: uuid(), name: 'last_name', type: 'string', isPrimaryKey: false, isNullable: false, isUnique: false, isForeignKey: false },
          { id: uuid(), name: 'phone', type: 'string', isPrimaryKey: false, isNullable: true, isUnique: false, isForeignKey: false },
          { id: uuid(), name: 'shipping_address', type: 'text', isPrimaryKey: false, isNullable: true, isUnique: false, isForeignKey: false },
          { id: uuid(), name: 'billing_address', type: 'text', isPrimaryKey: false, isNullable: true, isUnique: false, isForeignKey: false },
          { id: uuid(), name: 'loyalty_points', type: 'integer', isPrimaryKey: false, isNullable: false, isUnique: false, isForeignKey: false, defaultValue: '0' },
          { id: uuid(), name: 'tier', type: 'string', isPrimaryKey: false, isNullable: false, isUnique: false, isForeignKey: false, defaultValue: 'bronze' },
          { id: uuid(), name: 'created_at', type: 'datetime', isPrimaryKey: false, isNullable: false, isUnique: false, isForeignKey: false },
        ],
      },
      {
        id: orderId, name: 'Order', position: { x: 900, y: 100 },
        fields: [
          { id: orderPk, name: 'id', type: 'uuid', isPrimaryKey: true, isNullable: false, isUnique: true, isForeignKey: false },
          { id: orderCustomerFk, name: 'customer_id', type: 'uuid', isPrimaryKey: false, isNullable: false, isUnique: false, isForeignKey: true, foreignKeyRef: { entityId: customerId, fieldId: customerPk } },
          { id: uuid(), name: 'order_number', type: 'string', isPrimaryKey: false, isNullable: false, isUnique: true, isForeignKey: false },
          { id: uuid(), name: 'subtotal', type: 'float', isPrimaryKey: false, isNullable: false, isUnique: false, isForeignKey: false },
          { id: uuid(), name: 'tax_amount', type: 'float', isPrimaryKey: false, isNullable: false, isUnique: false, isForeignKey: false, defaultValue: '0' },
          { id: uuid(), name: 'shipping_cost', type: 'float', isPrimaryKey: false, isNullable: false, isUnique: false, isForeignKey: false, defaultValue: '0' },
          { id: uuid(), name: 'discount_amount', type: 'float', isPrimaryKey: false, isNullable: false, isUnique: false, isForeignKey: false, defaultValue: '0' },
          { id: uuid(), name: 'total', type: 'float', isPrimaryKey: false, isNullable: false, isUnique: false, isForeignKey: false },
          { id: uuid(), name: 'status', type: 'string', isPrimaryKey: false, isNullable: false, isUnique: false, isForeignKey: false, defaultValue: 'pending' },
          { id: uuid(), name: 'payment_method', type: 'string', isPrimaryKey: false, isNullable: true, isUnique: false, isForeignKey: false },
          { id: uuid(), name: 'payment_status', type: 'string', isPrimaryKey: false, isNullable: false, isUnique: false, isForeignKey: false, defaultValue: 'unpaid' },
          { id: uuid(), name: 'shipping_address', type: 'text', isPrimaryKey: false, isNullable: true, isUnique: false, isForeignKey: false },
          { id: uuid(), name: 'tracking_number', type: 'string', isPrimaryKey: false, isNullable: true, isUnique: false, isForeignKey: false },
          { id: uuid(), name: 'notes', type: 'text', isPrimaryKey: false, isNullable: true, isUnique: false, isForeignKey: false },
          { id: uuid(), name: 'ordered_at', type: 'datetime', isPrimaryKey: false, isNullable: false, isUnique: false, isForeignKey: false },
          { id: uuid(), name: 'shipped_at', type: 'datetime', isPrimaryKey: false, isNullable: true, isUnique: false, isForeignKey: false },
          { id: uuid(), name: 'delivered_at', type: 'datetime', isPrimaryKey: false, isNullable: true, isUnique: false, isForeignKey: false },
        ],
      },
      {
        id: orderItemId, name: 'OrderItem', position: { x: 500, y: 450 },
        fields: [
          { id: orderItemPk, name: 'id', type: 'uuid', isPrimaryKey: true, isNullable: false, isUnique: true, isForeignKey: false },
          { id: orderItemOrderFk, name: 'order_id', type: 'uuid', isPrimaryKey: false, isNullable: false, isUnique: false, isForeignKey: true, foreignKeyRef: { entityId: orderId, fieldId: orderPk } },
          { id: orderItemProductFk, name: 'product_id', type: 'uuid', isPrimaryKey: false, isNullable: false, isUnique: false, isForeignKey: true, foreignKeyRef: { entityId: productId, fieldId: productPk } },
          { id: uuid(), name: 'quantity', type: 'integer', isPrimaryKey: false, isNullable: false, isUnique: false, isForeignKey: false },
          { id: uuid(), name: 'unit_price', type: 'float', isPrimaryKey: false, isNullable: false, isUnique: false, isForeignKey: false },
          { id: uuid(), name: 'discount_percent', type: 'float', isPrimaryKey: false, isNullable: false, isUnique: false, isForeignKey: false, defaultValue: '0' },
          { id: uuid(), name: 'line_total', type: 'float', isPrimaryKey: false, isNullable: false, isUnique: false, isForeignKey: false },
        ],
      },
      {
        id: categoryId, name: 'Category', position: { x: 100, y: 450 },
        fields: [
          { id: categoryPk, name: 'id', type: 'uuid', isPrimaryKey: true, isNullable: false, isUnique: true, isForeignKey: false },
          { id: uuid(), name: 'name', type: 'string', isPrimaryKey: false, isNullable: false, isUnique: false, isForeignKey: false },
          { id: uuid(), name: 'slug', type: 'string', isPrimaryKey: false, isNullable: false, isUnique: true, isForeignKey: false },
          { id: categoryParentFk, name: 'parent_category_id', type: 'uuid', isPrimaryKey: false, isNullable: true, isUnique: false, isForeignKey: true, foreignKeyRef: { entityId: categoryId, fieldId: categoryPk } },
          { id: uuid(), name: 'description', type: 'text', isPrimaryKey: false, isNullable: true, isUnique: false, isForeignKey: false },
          { id: uuid(), name: 'sort_order', type: 'integer', isPrimaryKey: false, isNullable: false, isUnique: false, isForeignKey: false, defaultValue: '0' },
          { id: uuid(), name: 'is_active', type: 'boolean', isPrimaryKey: false, isNullable: false, isUnique: false, isForeignKey: false, defaultValue: 'true' },
        ],
      },
      {
        id: reviewId, name: 'Review', position: { x: 900, y: 450 },
        fields: [
          { id: reviewPk, name: 'id', type: 'uuid', isPrimaryKey: true, isNullable: false, isUnique: true, isForeignKey: false },
          { id: reviewProductFk, name: 'product_id', type: 'uuid', isPrimaryKey: false, isNullable: false, isUnique: false, isForeignKey: true, foreignKeyRef: { entityId: productId, fieldId: productPk } },
          { id: reviewCustomerFk, name: 'customer_id', type: 'uuid', isPrimaryKey: false, isNullable: false, isUnique: false, isForeignKey: true, foreignKeyRef: { entityId: customerId, fieldId: customerPk } },
          { id: uuid(), name: 'rating', type: 'integer', isPrimaryKey: false, isNullable: false, isUnique: false, isForeignKey: false },
          { id: uuid(), name: 'title', type: 'string', isPrimaryKey: false, isNullable: true, isUnique: false, isForeignKey: false },
          { id: uuid(), name: 'body', type: 'text', isPrimaryKey: false, isNullable: true, isUnique: false, isForeignKey: false },
          { id: uuid(), name: 'is_verified_purchase', type: 'boolean', isPrimaryKey: false, isNullable: false, isUnique: false, isForeignKey: false, defaultValue: 'false' },
          { id: uuid(), name: 'created_at', type: 'datetime', isPrimaryKey: false, isNullable: false, isUnique: false, isForeignKey: false },
        ],
      },
      {
        id: couponId, name: 'Coupon', position: { x: 100, y: 800 },
        fields: [
          { id: couponPk, name: 'id', type: 'uuid', isPrimaryKey: true, isNullable: false, isUnique: true, isForeignKey: false },
          { id: uuid(), name: 'code', type: 'string', isPrimaryKey: false, isNullable: false, isUnique: true, isForeignKey: false },
          { id: uuid(), name: 'discount_type', type: 'string', isPrimaryKey: false, isNullable: false, isUnique: false, isForeignKey: false },
          { id: uuid(), name: 'discount_value', type: 'float', isPrimaryKey: false, isNullable: false, isUnique: false, isForeignKey: false },
          { id: uuid(), name: 'min_order_amount', type: 'float', isPrimaryKey: false, isNullable: true, isUnique: false, isForeignKey: false },
          { id: uuid(), name: 'max_uses', type: 'integer', isPrimaryKey: false, isNullable: true, isUnique: false, isForeignKey: false },
          { id: uuid(), name: 'current_uses', type: 'integer', isPrimaryKey: false, isNullable: false, isUnique: false, isForeignKey: false, defaultValue: '0' },
          { id: uuid(), name: 'valid_from', type: 'datetime', isPrimaryKey: false, isNullable: false, isUnique: false, isForeignKey: false },
          { id: uuid(), name: 'valid_until', type: 'datetime', isPrimaryKey: false, isNullable: false, isUnique: false, isForeignKey: false },
          { id: uuid(), name: 'is_active', type: 'boolean', isPrimaryKey: false, isNullable: false, isUnique: false, isForeignKey: false, defaultValue: 'true' },
        ],
      },
      {
        id: inventoryId, name: 'Inventory', position: { x: 500, y: 800 },
        fields: [
          { id: inventoryPk, name: 'id', type: 'uuid', isPrimaryKey: true, isNullable: false, isUnique: true, isForeignKey: false },
          { id: inventoryProductFk, name: 'product_id', type: 'uuid', isPrimaryKey: false, isNullable: false, isUnique: false, isForeignKey: true, foreignKeyRef: { entityId: productId, fieldId: productPk } },
          { id: uuid(), name: 'warehouse_location', type: 'string', isPrimaryKey: false, isNullable: false, isUnique: false, isForeignKey: false },
          { id: uuid(), name: 'quantity_on_hand', type: 'integer', isPrimaryKey: false, isNullable: false, isUnique: false, isForeignKey: false, defaultValue: '0' },
          { id: uuid(), name: 'quantity_reserved', type: 'integer', isPrimaryKey: false, isNullable: false, isUnique: false, isForeignKey: false, defaultValue: '0' },
          { id: uuid(), name: 'last_restocked_at', type: 'datetime', isPrimaryKey: false, isNullable: true, isUnique: false, isForeignKey: false },
        ],
      },
    ],
    relations: [],
    relationships: [
      // Places (Customer → Order, 1:N)
      {
        id: uuid(), name: 'Places', type: 'one-to-many', position: { x: 700, y: 50 },
        connections: [
          { id: uuid(), entityId: customerId, fieldId: customerPk, cardinality: '1', participation: 'partial', role: 'customer' },
          { id: uuid(), entityId: orderId, fieldId: orderCustomerFk, cardinality: 'N', participation: 'total', role: 'order' },
        ],
        attributes: [],
        onDelete: 'RESTRICT', onUpdate: 'CASCADE',
        rules: [
          { id: uuid(), name: 'Block If Unpaid Order', trigger: 'BEFORE_CREATE', scope: 'both', enabled: true, conditions: [{ id: uuid(), type: 'comparison', leftOperand: 'customer.orders.unpaid.count', operator: '==', rightOperand: '0' }], action: { type: 'THROW_ERROR', errorMessage: 'Cannot place order while previous order is unpaid' } },
        ],
        constraints: [],
        isIdentifying: false, isRecursive: false, description: 'Customer places orders',
      },
      // Contains (Order ↔ Product via OrderItem, M:N)
      {
        id: uuid(), name: 'Contains', type: 'many-to-many', position: { x: 500, y: 280 },
        connections: [
          { id: uuid(), entityId: orderId, fieldId: orderPk, cardinality: 'N', participation: 'total', role: 'order' },
          { id: uuid(), entityId: productId, fieldId: productPk, cardinality: 'M', participation: 'partial', role: 'product' },
        ],
        attributes: [
          { id: uuid(), name: 'quantity', type: 'integer', isNullable: false, checkConstraint: 'quantity > 0' },
          { id: uuid(), name: 'unit_price', type: 'float', isNullable: false, checkConstraint: 'unit_price >= 0' },
          { id: uuid(), name: 'discount_percent', type: 'float', isNullable: false, defaultValue: '0', checkConstraint: 'discount_percent >= 0 AND discount_percent <= 100' },
        ],
        onDelete: 'CASCADE', onUpdate: 'CASCADE',
        rules: [
          { id: uuid(), name: 'Quantity Must Be Positive', trigger: 'BEFORE_CREATE', scope: 'database', enabled: true, conditions: [{ id: uuid(), type: 'comparison', leftOperand: 'order_item.quantity', operator: '>', rightOperand: '0' }], action: { type: 'THROW_ERROR', errorMessage: 'Quantity must be greater than 0' } },
          { id: uuid(), name: 'Stock Check', trigger: 'BEFORE_CREATE', scope: 'both', enabled: true, conditions: [{ id: uuid(), type: 'comparison', leftOperand: 'product.stock_quantity', operator: '>=', rightOperand: 'order_item.quantity' }], action: { type: 'THROW_ERROR', errorMessage: 'Insufficient stock' } },
          { id: uuid(), name: 'Auto-Decrement Stock', trigger: 'AFTER_CREATE', scope: 'both', enabled: true, conditions: [], action: { type: 'UPDATE_FIELD', updateField: { entity: 'Product', field: 'stock_quantity', value: 'stock_quantity - quantity' } } },
        ],
        constraints: [
          { id: uuid(), name: 'Positive Quantity', type: 'check', enabled: true, checkExpression: 'quantity > 0' },
          { id: uuid(), name: 'Valid Discount', type: 'check', enabled: true, checkExpression: 'discount_percent >= 0 AND discount_percent <= 100' },
        ],
        isIdentifying: false, isRecursive: false, description: 'Orders contain products via line items',
      },
      // BelongsToCategory (Product → Category, N:1)
      {
        id: uuid(), name: 'BelongsToCategory', type: 'one-to-many', position: { x: 100, y: 280 },
        connections: [
          { id: uuid(), entityId: categoryId, fieldId: categoryPk, cardinality: '1', participation: 'partial', role: 'category' },
          { id: uuid(), entityId: productId, fieldId: productPk, cardinality: 'N', participation: 'partial', role: 'product' },
        ],
        attributes: [],
        onDelete: 'SET_NULL', onUpdate: 'CASCADE',
        rules: [],
        constraints: [],
        isIdentifying: false, isRecursive: false, description: 'Products belong to categories',
      },
      // Reviews (Customer ↔ Product, M:N)
      {
        id: uuid(), name: 'Reviews', type: 'many-to-many', position: { x: 700, y: 450 },
        connections: [
          { id: uuid(), entityId: customerId, fieldId: customerPk, cardinality: 'N', participation: 'partial', role: 'reviewer' },
          { id: uuid(), entityId: productId, fieldId: productPk, cardinality: 'M', participation: 'partial', role: 'product' },
        ],
        attributes: [
          { id: uuid(), name: 'rating', type: 'integer', isNullable: false, checkConstraint: 'rating BETWEEN 1 AND 5' },
          { id: uuid(), name: 'created_at', type: 'datetime', isNullable: false },
        ],
        onDelete: 'CASCADE', onUpdate: 'CASCADE',
        rules: [
          { id: uuid(), name: 'Verified Purchase Only', trigger: 'BEFORE_CREATE', scope: 'both', enabled: true, conditions: [], action: { type: 'THROW_ERROR', errorMessage: 'Customer must have purchased the product to leave a review' } },
          { id: uuid(), name: 'One Review Per Product', trigger: 'BEFORE_CREATE', scope: 'database', enabled: true, conditions: [], action: { type: 'THROW_ERROR', errorMessage: 'Customer can only review a product once' } },
          { id: uuid(), name: 'Rating Range', trigger: 'BEFORE_CREATE', scope: 'database', enabled: true, conditions: [{ id: uuid(), type: 'comparison', leftOperand: 'review.rating', operator: '>=', rightOperand: '1' }, { id: uuid(), type: 'comparison', leftOperand: 'review.rating', operator: '<=', rightOperand: '5', logicalOperator: 'AND' }], action: { type: 'THROW_ERROR', errorMessage: 'Rating must be between 1 and 5' } },
        ],
        constraints: [
          { id: uuid(), name: 'Unique Customer-Product Review', type: 'unique', enabled: true, uniqueFields: ['customer_id', 'product_id'] },
          { id: uuid(), name: 'Rating Range', type: 'check', enabled: true, checkExpression: 'rating >= 1 AND rating <= 5' },
        ],
        isIdentifying: false, isRecursive: false, description: 'Customers review purchased products',
      },
      // AppliesCoupon (Coupon → Order, 1:N)
      {
        id: uuid(), name: 'AppliesCoupon', type: 'one-to-many', position: { x: 500, y: 680 },
        connections: [
          { id: uuid(), entityId: couponId, fieldId: couponPk, cardinality: '1', participation: 'partial', role: 'coupon' },
          { id: uuid(), entityId: orderId, fieldId: orderPk, cardinality: 'N', participation: 'partial', role: 'order' },
        ],
        attributes: [],
        onDelete: 'SET_NULL', onUpdate: 'CASCADE',
        rules: [
          { id: uuid(), name: 'Check Coupon Validity', trigger: 'BEFORE_CREATE', scope: 'both', enabled: true, conditions: [{ id: uuid(), type: 'comparison', leftOperand: 'coupon.valid_from', operator: '<=', rightOperand: 'NOW()' }, { id: uuid(), type: 'comparison', leftOperand: 'coupon.valid_until', operator: '>=', rightOperand: 'NOW()', logicalOperator: 'AND' }], action: { type: 'THROW_ERROR', errorMessage: 'Coupon is not valid at this time' } },
          { id: uuid(), name: 'Check Min Order Amount', trigger: 'BEFORE_CREATE', scope: 'both', enabled: true, conditions: [{ id: uuid(), type: 'comparison', leftOperand: 'order.subtotal', operator: '>=', rightOperand: 'coupon.min_order_amount' }], action: { type: 'THROW_ERROR', errorMessage: 'Order does not meet minimum amount for this coupon' } },
          { id: uuid(), name: 'Check Max Uses', trigger: 'BEFORE_CREATE', scope: 'both', enabled: true, conditions: [{ id: uuid(), type: 'comparison', leftOperand: 'coupon.current_uses', operator: '<', rightOperand: 'coupon.max_uses' }], action: { type: 'THROW_ERROR', errorMessage: 'Coupon usage limit reached' } },
          { id: uuid(), name: 'Increment Usage Count', trigger: 'AFTER_CREATE', scope: 'both', enabled: true, conditions: [], action: { type: 'UPDATE_FIELD', updateField: { entity: 'Coupon', field: 'current_uses', value: 'current_uses + 1' } } },
        ],
        constraints: [],
        isIdentifying: false, isRecursive: false, description: 'Coupons are applied to orders for discounts',
      },
      // TracksInventory (Product → Inventory, 1:N)
      {
        id: uuid(), name: 'TracksInventory', type: 'one-to-many', position: { x: 300, y: 680 },
        connections: [
          { id: uuid(), entityId: productId, fieldId: productPk, cardinality: '1', participation: 'partial', role: 'product' },
          { id: uuid(), entityId: inventoryId, fieldId: inventoryProductFk, cardinality: 'N', participation: 'total', role: 'inventory' },
        ],
        attributes: [],
        onDelete: 'CASCADE', onUpdate: 'CASCADE',
        rules: [
          { id: uuid(), name: 'Low Stock Alert', trigger: 'AFTER_UPDATE', scope: 'backend', enabled: true, conditions: [{ id: uuid(), type: 'comparison', leftOperand: 'inventory.quantity_on_hand', operator: '<', rightOperand: 'product.min_stock_threshold' }], action: { type: 'LOG' } },
        ],
        constraints: [
          { id: uuid(), name: 'Non-Negative Quantity', type: 'check', enabled: true, checkExpression: 'quantity_on_hand >= 0 AND quantity_reserved >= 0' },
        ],
        isIdentifying: false, isRecursive: false, description: 'Product inventory tracked across warehouses',
      },
      // HasSubcategory (Category → Category, 1:N recursive)
      {
        id: uuid(), name: 'HasSubcategory', type: 'one-to-many', position: { x: 100, y: 600 },
        connections: [
          { id: uuid(), entityId: categoryId, fieldId: categoryPk, cardinality: '1', participation: 'partial', role: 'parent' },
          { id: uuid(), entityId: categoryId, fieldId: categoryParentFk, cardinality: 'N', participation: 'partial', role: 'child' },
        ],
        attributes: [],
        onDelete: 'CASCADE', onUpdate: 'CASCADE',
        rules: [
          { id: uuid(), name: 'Max 3 Nesting Levels', trigger: 'BEFORE_CREATE', scope: 'both', enabled: true, conditions: [], action: { type: 'THROW_ERROR', errorMessage: 'Categories cannot be nested more than 3 levels deep' } },
        ],
        constraints: [
          { id: uuid(), name: 'No Self-Reference', type: 'check', enabled: true, checkExpression: 'id != parent_category_id' },
        ],
        isIdentifying: false, isRecursive: true, description: 'Categories can have subcategories up to 3 levels deep',
      },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}
