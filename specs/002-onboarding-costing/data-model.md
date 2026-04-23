# Data Model: Onboarding & Costing System

**Branch**: `002-onboarding-costing` | **Date**: 2026-04-23

## Existing Tables (Modified)

### ingredients (reused as "Materials")

No schema changes needed. The existing table already has all required
fields for material costing:

| Column              | Type          | Notes                       |
| ------------------- | ------------- | --------------------------- |
| id                  | uuid (PK)     | Existing                    |
| name                | text (unique) | Material name               |
| unit                | text          | g, kg, pc, ml, L            |
| cost_per_unit       | numeric(10,4) | Source of truth for costing |
| stock_qty           | numeric(12,4) | Inventory tracking (MVP1)   |
| low_stock_threshold | numeric(12,4) | Alert threshold (MVP1)      |
| created_at          | timestamptz   | Existing                    |

**Onboarding note**: When the admin adds a "material" during onboarding,
a row is inserted into `ingredients`. The `cost_per_unit` is computed as
`total_cost / quantity` on the client and sent to the server. `stock_qty`
is set to the quantity entered (the admin is also recording initial stock).

### products (updated by costing save)

No schema changes needed. The existing `price` column is updated when
the admin saves a costing with an SRP:

| Column             | Type          | Notes                          |
| ------------------ | ------------- | ------------------------------ |
| id                 | uuid (PK)     | Existing                       |
| name               | text (unique) | Existing                       |
| price              | numeric(10,2) | Updated to SRP on costing save |
| has_prepared_stock | boolean       | Existing (MVP1)                |
| is_active          | boolean       | Existing                       |
| created_at         | timestamptz   | Existing                       |

---

## New Tables

### product_costings

Stores the full costing snapshot for a product. One row per product
(upsert pattern — insert on first save, update on re-save).

| Column                | Type          | Constraints               |
| --------------------- | ------------- | ------------------------- |
| id                    | uuid (PK)     | default gen_random_uuid() |
| product_id            | uuid (unique) | FK → products, not null   |
| overhead_cost         | numeric(10,2) | default 0, check >= 0     |
| labor_cost            | numeric(10,2) | default 0, check >= 0     |
| other_cost            | numeric(10,2) | default 0, check >= 0     |
| yield_quantity        | numeric(12,4) | not null, check > 0       |
| total_material_cost   | numeric(10,2) | not null, check >= 0      |
| total_production_cost | numeric(10,2) | not null, check >= 0      |
| cost_per_item         | numeric(10,4) | not null, check >= 0      |
| profit_margin         | numeric(5,2)  | default 0, check >= 0     |
| srp                   | numeric(10,2) | not null, check > 0       |
| srp_override          | boolean       | default false             |
| created_at            | timestamptz   | default now()             |
| updated_at            | timestamptz   | default now()             |

**Relationships**:

- `product_id` → `products.id` (unique, one costing per product)
- Has many `costing_material_rows`

**Notes**:

- `total_material_cost`, `total_production_cost`, `cost_per_item` are
  computed client-side and persisted as a snapshot.
- `srp_override` indicates whether the admin manually set the SRP
  (true) or accepted the computed suggestion (false).
- `profit_margin` is stored as a percentage (e.g., 50 for 50%).

### costing_material_rows

Line items within a product costing. Each row references an ingredient
and records the quantity used and computed cost.

| Column        | Type          | Constraints                     |
| ------------- | ------------- | ------------------------------- |
| id            | uuid (PK)     | default gen_random_uuid()       |
| costing_id    | uuid          | FK → product_costings, not null |
| ingredient_id | uuid          | FK → ingredients, nullable      |
| material_name | text          | not null (denormalized)         |
| unit          | text          | not null (denormalized)         |
| cost_per_unit | numeric(10,4) | not null, check >= 0            |
| quantity_used | numeric(12,4) | not null, check > 0             |
| row_total     | numeric(10,2) | not null, check >= 0            |
| created_at    | timestamptz   | default now()                   |

**Relationships**:

- `costing_id` → `product_costings.id` (cascade delete)
- `ingredient_id` → `ingredients.id` (set null on delete)

**Notes**:

- `material_name`, `unit`, `cost_per_unit` are denormalized at save time
  so the costing remains readable even if the ingredient is later deleted
  or its cost changes.
- `ingredient_id` is nullable — becomes null if the ingredient is deleted
  (set null on delete). The denormalized fields preserve the data.
- `row_total` = `quantity_used × cost_per_unit` (computed client-side,
  stored as snapshot).

---

## Entity Relationship Diagram

```
products ──────────── product_costings ──── costing_material_rows
   │    1:0..1              │    1:many          │
   │                        │                    │
   │                        │                    ▼
   │                        │              ingredients
   │                        │              (set null on delete)
   ▼                        │
order_items                 │
(unit_price snapshot)       │
                            ▼
                    POS reads products.price
                    (updated to SRP on save)
```

---

## Migration: 018_costing_tables.sql

```sql
-- product_costings: one costing snapshot per product
create table product_costings (
  id uuid primary key default gen_random_uuid(),
  product_id uuid unique not null
    references products(id) on delete cascade,
  overhead_cost numeric(10,2) not null default 0
    check (overhead_cost >= 0),
  labor_cost numeric(10,2) not null default 0
    check (labor_cost >= 0),
  other_cost numeric(10,2) not null default 0
    check (other_cost >= 0),
  yield_quantity numeric(12,4) not null
    check (yield_quantity > 0),
  total_material_cost numeric(10,2) not null
    check (total_material_cost >= 0),
  total_production_cost numeric(10,2) not null
    check (total_production_cost >= 0),
  cost_per_item numeric(10,4) not null
    check (cost_per_item >= 0),
  profit_margin numeric(5,2) not null default 0
    check (profit_margin >= 0),
  srp numeric(10,2) not null
    check (srp > 0),
  srp_override boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- costing_material_rows: material breakdown per costing
create table costing_material_rows (
  id uuid primary key default gen_random_uuid(),
  costing_id uuid not null
    references product_costings(id) on delete cascade,
  ingredient_id uuid
    references ingredients(id) on delete set null,
  material_name text not null,
  unit text not null,
  cost_per_unit numeric(10,4) not null
    check (cost_per_unit >= 0),
  quantity_used numeric(12,4) not null
    check (quantity_used > 0),
  row_total numeric(10,2) not null
    check (row_total >= 0),
  created_at timestamptz not null default now()
);

-- Index for looking up costings by product
create index idx_costing_material_rows_costing
  on costing_material_rows(costing_id);

-- RLS policies
alter table product_costings enable row level security;
alter table costing_material_rows enable row level security;

create policy "Authenticated users can read product_costings"
  on product_costings for select
  to authenticated using (true);

create policy "Authenticated users can insert product_costings"
  on product_costings for insert
  to authenticated with check (true);

create policy "Authenticated users can update product_costings"
  on product_costings for update
  to authenticated using (true);

create policy "Authenticated users can delete product_costings"
  on product_costings for delete
  to authenticated using (true);

create policy "Authenticated users can read costing_material_rows"
  on costing_material_rows for select
  to authenticated using (true);

create policy "Authenticated users can insert costing_material_rows"
  on costing_material_rows for insert
  to authenticated with check (true);

create policy "Authenticated users can delete costing_material_rows"
  on costing_material_rows for delete
  to authenticated using (true);
```

---

## State Transitions

### Costing Lifecycle

```
[No Costing] → Save Costing → [Costing Exists]
                                     │
                                     ├── Edit & Re-Save → [Costing Updated]
                                     │                     (products.price updated)
                                     │
                                     └── Delete Costing → [No Costing]
                                                          (products.price unchanged)
```

### Onboarding Flow

```
[First Login] → Check ingredients count
                     │
                     ├── count = 0 → Show Onboarding Modal
                     │                    │
                     │                    └── Add Ingredients → [Modal Dismissable]
                     │
                     └── count > 0 → Skip Onboarding → Dashboard
```
