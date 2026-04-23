# Data Model: POS & Inventory System (MVP)

**Branch**: `001-pos-inventory-mvp`  
**Date**: 2026-04-20  
**Source**: spec.md — Key Entities + Functional Requirements

---

## Entity Overview

```
users
  └── orders (created_by)
        └── order_items (order_id → products)

products
  ├── recipes (product_id → ingredients)
  └── prepared_stock (product_id, 1:1)

ingredients
  └── inventory_logs (ingredient_id)

batch_preparations
  └── inventory_logs (source_type='batch', source_id=batch_id)
```

---

## Table Definitions

### `users`

Managed by Supabase Auth. Metadata row mirrors the auth user.

| Column       | Type          | Constraints               | Notes                  |
| ------------ | ------------- | ------------------------- | ---------------------- |
| `id`         | `uuid`        | PK, references auth.users | Supabase Auth user ID  |
| `email`      | `text`        | NOT NULL, UNIQUE          |                        |
| `role`       | `text`        | NOT NULL, DEFAULT 'staff' | `'admin'` or `'staff'` |
| `created_at` | `timestamptz` | NOT NULL, DEFAULT now()   |                        |

**Validation rules**:

- `role` MUST be one of `'admin'`, `'staff'`
- No role-based access control in MVP (role stored for future use)

---

### `products`

| Column               | Type            | Constraints                   | Notes                                   |
| -------------------- | --------------- | ----------------------------- | --------------------------------------- |
| `id`                 | `uuid`          | PK, DEFAULT gen_random_uuid() |                                         |
| `name`               | `text`          | NOT NULL, UNIQUE              | Display name on POS grid                |
| `price`              | `numeric(10,2)` | NOT NULL, CHECK > 0           | Fixed sale price; no dynamic pricing    |
| `has_prepared_stock` | `boolean`       | NOT NULL, DEFAULT false       | Determines deduction path on completion |
| `is_active`          | `boolean`       | NOT NULL, DEFAULT true        | Inactive products hidden from POS       |
| `created_at`         | `timestamptz`   | NOT NULL, DEFAULT now()       |                                         |

**Validation rules**:

- `price` MUST be > 0
- If `has_prepared_stock = true`, a `prepared_stock` row MUST exist for this product
- Inactive products (`is_active = false`) MUST NOT appear on the POS screen

---

### `ingredients`

| Column                | Type            | Constraints                   | Notes                                  |
| --------------------- | --------------- | ----------------------------- | -------------------------------------- |
| `id`                  | `uuid`          | PK, DEFAULT gen_random_uuid() |                                        |
| `name`                | `text`          | NOT NULL, UNIQUE              |                                        |
| `stock_qty`           | `numeric(12,4)` | NOT NULL, DEFAULT 0           | Allows negative (flagged, not blocked) |
| `cost_per_unit`       | `numeric(10,4)` | NOT NULL, CHECK >= 0          | Cost at time of last update            |
| `low_stock_threshold` | `numeric(12,4)` | NULLABLE                      | NULL = no alert configured             |
| `unit`                | `text`          | NOT NULL                      | e.g. `'g'`, `'ml'`, `'pcs'`            |
| `created_at`          | `timestamptz`   | NOT NULL, DEFAULT now()       |                                        |

**Validation rules**:

- `stock_qty` may go negative; application MUST flag but MUST NOT block operations
- Low stock alert triggers when `stock_qty <= low_stock_threshold` (only if threshold is NOT NULL)
- `cost_per_unit` is point-in-time and does NOT retroactively update historical logs

**State**:

- Highlighted in UI when `stock_qty <= low_stock_threshold`

---

### `recipes`

Defines ingredient quantities required to produce one unit of a product.

| Column              | Type            | Constraints                    | Notes                                   |
| ------------------- | --------------- | ------------------------------ | --------------------------------------- |
| `id`                | `uuid`          | PK, DEFAULT gen_random_uuid()  |                                         |
| `product_id`        | `uuid`          | NOT NULL, FK → products(id)    |                                         |
| `ingredient_id`     | `uuid`          | NOT NULL, FK → ingredients(id) |                                         |
| `quantity_per_unit` | `numeric(12,4)` | NOT NULL, CHECK > 0            | Qty of ingredient per 1 unit of product |
| `created_at`        | `timestamptz`   | NOT NULL, DEFAULT now()        |                                         |

**Constraints**:

- `UNIQUE (product_id, ingredient_id)` — one recipe line per ingredient per product

---

### `prepared_stock`

One row per product that has `has_prepared_stock = true`.

| Column       | Type            | Constraints                         | Notes                  |
| ------------ | --------------- | ----------------------------------- | ---------------------- |
| `id`         | `uuid`          | PK, DEFAULT gen_random_uuid()       |                        |
| `product_id` | `uuid`          | NOT NULL, UNIQUE, FK → products(id) | 1:1 with product       |
| `quantity`   | `numeric(12,4)` | NOT NULL, DEFAULT 0                 | Current pre-made stock |
| `updated_at` | `timestamptz`   | NOT NULL, DEFAULT now()             |                        |

**Validation**:

- `quantity` may go negative (e.g. after order exceeds prepared stock); flagged not blocked

---

### `orders`

| Column         | Type            | Constraints                   | Notes                                          |
| -------------- | --------------- | ----------------------------- | ---------------------------------------------- |
| `id`           | `uuid`          | PK, DEFAULT gen_random_uuid() |                                                |
| `status`       | `text`          | NOT NULL, DEFAULT 'placed'    | `'placed'` or `'completed'`                    |
| `total_price`  | `numeric(10,2)` | NOT NULL                      | Computed at placement; stored for immutability |
| `created_at`   | `timestamptz`   | NOT NULL, DEFAULT now()       |                                                |
| `completed_at` | `timestamptz`   | NULLABLE                      | Set on completion                              |
| `created_by`   | `uuid`          | NULLABLE, FK → users(id)      |                                                |

**State transitions**:

```
placed → completed
```

- No other transitions in MVP
- `completed_at` MUST be set when status transitions to `'completed'`
- `total_price` is locked at placement; editing a completed order recalculates
  and updates both `total_price` and re-runs inventory deduction delta

**Validation**:

- An order MUST have at least one `order_items` row before it can be placed

---

### `order_items`

| Column       | Type            | Constraints                   | Notes                            |
| ------------ | --------------- | ----------------------------- | -------------------------------- |
| `id`         | `uuid`          | PK, DEFAULT gen_random_uuid() |                                  |
| `order_id`   | `uuid`          | NOT NULL, FK → orders(id)     |                                  |
| `product_id` | `uuid`          | NOT NULL, FK → products(id)   |                                  |
| `quantity`   | `integer`       | NOT NULL, CHECK > 0           |                                  |
| `unit_price` | `numeric(10,2)` | NOT NULL                      | Price at time of order placement |

**Constraints**:

- `UNIQUE (order_id, product_id)` — one line per product per order (quantity accumulates)
- `unit_price` is snapshotted at placement so price changes don't affect historical orders

---

### `inventory_logs`

Immutable append-only log of all stock changes.

| Column          | Type            | Constraints                    | Notes                                     |
| --------------- | --------------- | ------------------------------ | ----------------------------------------- |
| `id`            | `uuid`          | PK, DEFAULT gen_random_uuid()  |                                           |
| `ingredient_id` | `uuid`          | NOT NULL, FK → ingredients(id) |                                           |
| `change_qty`    | `numeric(12,4)` | NOT NULL                       | Negative = deduction; positive = addition |
| `source_type`   | `text`          | NOT NULL                       | `'order'`, `'batch'`, `'manual'`          |
| `source_id`     | `uuid`          | NULLABLE                       | FK to order or batch; NULL for manual     |
| `notes`         | `text`          | NULLABLE                       | Human note for manual adjustments         |
| `created_at`    | `timestamptz`   | NOT NULL, DEFAULT now()        |                                           |
| `created_by`    | `uuid`          | NULLABLE, FK → users(id)       |                                           |

**Rules**:

- Rows are NEVER updated or deleted — append-only
- `source_type` MUST be one of `'order'`, `'batch'`, `'manual'`
- `source_id` is the `orders.id` for `'order'`, `batch_preparations.id` for `'batch'`, NULL for `'manual'`

---

### `batch_preparations`

| Column       | Type            | Constraints                   | Notes                        |
| ------------ | --------------- | ----------------------------- | ---------------------------- |
| `id`         | `uuid`          | PK, DEFAULT gen_random_uuid() |                              |
| `product_id` | `uuid`          | NOT NULL, FK → products(id)   |                              |
| `quantity`   | `numeric(12,4)` | NOT NULL, CHECK > 0           | Units prepared in this batch |
| `created_at` | `timestamptz`   | NOT NULL, DEFAULT now()       |                              |
| `created_by` | `uuid`          | NULLABLE, FK → users(id)      |                              |

---

## Key Relationships Summary

| Relationship                            | Type   | Notes                                                 |
| --------------------------------------- | ------ | ----------------------------------------------------- |
| `products` → `recipes`                  | 1:many | One product has many recipe lines                     |
| `recipes` → `ingredients`               | many:1 | Many recipe lines reference one ingredient            |
| `products` → `prepared_stock`           | 1:1    | Only for `has_prepared_stock = true` products         |
| `orders` → `order_items`                | 1:many | One order has many item lines                         |
| `order_items` → `products`              | many:1 | Many items reference one product                      |
| `inventory_logs` → `ingredients`        | many:1 | All stock changes logged per ingredient               |
| `inventory_logs` → `orders`             | many:1 | `source_id` references order when source_type='order' |
| `inventory_logs` → `batch_preparations` | many:1 | `source_id` references batch                          |

---

## Reporting Queries

### Revenue (by period)

```sql
SELECT SUM(total_price)
FROM orders
WHERE status = 'completed'
  AND completed_at BETWEEN :start AND :end;
```

### Cost (by period)

```sql
SELECT SUM(ABS(il.change_qty) * ing.cost_per_unit)
FROM inventory_logs il
JOIN ingredients ing ON ing.id = il.ingredient_id
WHERE il.change_qty < 0
  AND il.created_at BETWEEN :start AND :end;
```

### Profit

```
profit = revenue - cost
```

---

## Low Stock Alert Trigger

The Supabase Edge Function checks after any UPDATE to `ingredients`:

```
IF NEW.stock_qty <= NEW.low_stock_threshold
  AND NEW.low_stock_threshold IS NOT NULL
THEN trigger email alert
```

The Database Webhook fires on `UPDATE` of `ingredients` and calls the Edge Function.
