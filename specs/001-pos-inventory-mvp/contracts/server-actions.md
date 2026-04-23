# Contracts: Server Actions

**Branch**: `001-pos-inventory-mvp`  
**Date**: 2026-04-20  
**Location**: `lib/actions/`

All mutations use Next.js Server Actions (App Router). All actions require an
authenticated Supabase session (enforced server-side). No REST API layer exists —
Server Actions are the contract boundary between the UI and the database.

---

## `placeOrder(items)`

**File**: `lib/actions/orders.ts`  
**Trigger**: User taps "Place Order" on POS screen

**Input**:

```ts
placeOrder(items: Array<{ productId: string; quantity: number }>): Promise<{ orderId: string }>
```

**Preconditions**:

- `items.length >= 1` — empty orders are rejected
- All `productId` values MUST reference active products

**Behavior**:

1. Compute `total_price` by summing `product.price × quantity` for each item
2. Insert one `orders` row with `status = 'placed'` and `total_price`
3. Insert `order_items` rows (one per item), snapshotting `unit_price` from product
4. Return the new `orderId`

**Error cases**:

- Empty cart → throw `'EMPTY_ORDER'`
- Unknown product → throw `'INVALID_PRODUCT'`

---

## `completeOrder(orderId)`

**File**: `lib/actions/orders.ts`  
**Trigger**: Staff taps "Complete Order" on queue card  
**Implementation**: Supabase RPC → PostgreSQL function `complete_order(order_id)`

**Input**:

```ts
completeOrder(orderId: string): Promise<void>
```

**Behavior (atomic, within a DB transaction)**:

1. Verify order exists and has `status = 'placed'`
2. For each `order_item`:
   - If product `has_prepared_stock = true`:
     - Deduct `quantity` from `prepared_stock.quantity`
   - Else:
     - For each recipe line: deduct `recipe.quantity_per_unit × order_item.quantity` from `ingredient.stock_qty`
3. Insert `inventory_logs` rows for every deduction (source_type = `'order'`, source_id = orderId)
4. Set `orders.status = 'completed'` and `orders.completed_at = now()`

**Guarantees**:

- Entire operation is one DB transaction — all steps succeed or all roll back
- Negative stock is permitted — operation never fails due to insufficient stock

**Error cases**:

- Order not found or already completed → throw `'INVALID_ORDER'`

---

## `editOrder(orderId, items)`

**File**: `lib/actions/orders.ts`  
**Trigger**: Staff taps "Edit Order" on queue or completed order

**Input**:

```ts
editOrder(
  orderId: string,
  items: Array<{ productId: string; quantity: number }>
): Promise<void>
```

**Behavior**:

1. Delete existing `order_items` for this order
2. Insert new `order_items` rows
3. Recompute and update `orders.total_price`
4. If order is `'completed'`:
   - Reverse previous inventory deductions (insert correcting `inventory_logs` rows)
   - Re-run inventory deduction for new items (same logic as `completeOrder`)

**Preconditions**:

- `items.length >= 1`

**Error cases**:

- Order not found → throw `'INVALID_ORDER'`
- Empty item list → throw `'EMPTY_ORDER'`

---

## `adjustStock(ingredientId, delta, notes?)`

**File**: `lib/actions/inventory.ts`  
**Trigger**: Staff submits manual stock adjustment form

**Input**:

```ts
adjustStock(
  ingredientId: string,
  delta: number,       // positive = add, negative = remove
  notes?: string
): Promise<void>
```

**Behavior**:

1. Update `ingredients.stock_qty` by adding `delta`
2. Insert an `inventory_logs` row:
   - `change_qty = delta`
   - `source_type = 'manual'`
   - `source_id = null`
   - `notes = notes`

**Guarantees**:

- Negative resulting stock is allowed (logged, not blocked)

---

## `prepareBatch(productId, quantity)`

**File**: `lib/actions/batch.ts`  
**Trigger**: Staff submits batch prep form  
**Implementation**: Supabase RPC → PostgreSQL function `prepare_batch(product_id, quantity)`

**Input**:

```ts
prepareBatch(productId: string, quantity: number): Promise<void>
```

**Behavior (atomic, within a DB transaction)**:

1. Insert a `batch_preparations` row
2. For each recipe line of the product:
   - Deduct `recipe.quantity_per_unit × quantity` from `ingredient.stock_qty`
3. Insert `inventory_logs` rows for every deduction (source_type = `'batch'`, source_id = batchId)
4. Increment `prepared_stock.quantity` by `quantity`

**Preconditions**:

- `quantity > 0`
- Product MUST have at least one recipe line

**Error cases**:

- Product not found → throw `'INVALID_PRODUCT'`
- Product has no recipe → throw `'NO_RECIPE'`
- `quantity <= 0` → throw `'INVALID_QUANTITY'`

---

## `getReport(period)`

**File**: `lib/actions/reports.ts`  
**Trigger**: Staff opens reports page or changes filter

**Input**:

```ts
getReport(period: 'daily' | 'weekly' | 'monthly'): Promise<{
  revenue: number;
  cost: number;
  profit: number;
  startDate: string;
  endDate: string;
}>
```

**Behavior**:

1. Compute date range from `period` (relative to current date at call time)
2. Query revenue: `SUM(orders.total_price)` for `completed` orders in range
3. Query cost: `SUM(ABS(inventory_logs.change_qty) × ingredients.cost_per_unit)`
   for negative `change_qty` entries in range
4. Return `{ revenue, cost, profit: revenue - cost, startDate, endDate }`

---

## Authentication Guard

All Server Actions MUST call `supabase.auth.getUser()` and throw `'UNAUTHORIZED'`
if no valid session exists. This is enforced in `lib/supabase/server.ts` via a
shared `requireAuth()` helper, not repeated per action.
