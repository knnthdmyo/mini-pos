# Research: Onboarding & Costing System

**Branch**: `002-onboarding-costing` | **Date**: 2026-04-23

## R1: Reuse Ingredients vs. Separate Materials Table

**Decision**: Reuse the existing `ingredients` table as the materials
source for costing.

**Rationale**:

- The `ingredients` table already has `name`, `unit`, `cost_per_unit`,
  and `stock_qty` — all fields needed for material costing.
- Creating a separate `materials` table would duplicate data and
  require synchronization logic between two cost-per-unit sources.
- The user explicitly requested: "Reuse ingredients table as materials"
  and "Avoid duplicate data models."
- Onboarding (adding first materials) becomes onboarding (adding first
  ingredients), which also initializes inventory tracking.

**Alternatives Considered**:

- **Separate materials table**: Would allow materials that aren't tracked
  in inventory (e.g., packaging). Rejected because MVP2 scope doesn't
  include non-ingredient materials, and the existing ingredients table
  already supports the needed fields.

**Impact on Spec**:

- "Materials" in the spec maps to `ingredients` in the database.
- Onboarding modal adds rows to `ingredients`.
- The "Materials Management Table" (US2) is the existing inventory page
  extended with cost-per-unit editing, or a new dedicated view that
  reads from the same `ingredients` table.

---

## R2: Costing Snapshot Storage Strategy

**Decision**: Create two new tables — `product_costings` (one per
product) and `costing_material_rows` (many per costing) — to store the
full breakdown.

**Rationale**:

- The costing snapshot MUST be persisted independently of live ingredient
  costs so that changing a material's cost_per_unit does not retroactively
  alter saved costings.
- Storing the snapshot in a JSONB column was considered but rejected
  because relational rows enable querying (e.g., "which products use
  ingredient X?"), deletion warnings, and easier editing.
- One costing per product (upsert pattern) keeps the model simple for
  MVP2. Historical costing versions are out of scope (deferred to v3).

**Alternatives Considered**:

- **JSONB on products table**: Simpler schema but loses queryability and
  referential integrity. Rejected.
- **Versioned costings (append-only)**: Adds historical tracking but is
  explicitly excluded from MVP2 scope. Rejected for now.

---

## R3: SRP ↔ Product Price Integration

**Decision**: When the admin saves a costing, the server action updates
`products.price` to the SRP value. POS reads `products.price` as before
— no POS code changes needed for price display.

**Rationale**:

- The existing POS flow reads `products.price` directly. Using this
  same column means zero changes to POS, queue, or order logic.
- `order_items.unit_price` already snapshots the price at order time,
  so future SRP changes cannot alter past orders.
- The `product_costings.srp` column stores the SRP for the costing
  view; `products.price` is the "live" selling price.

**Alternatives Considered**:

- **Separate `srp` column on products**: Would require POS to decide
  between `price` and `srp`. Adds complexity. Rejected.
- **POS reads from product_costings**: Would couple POS to costing
  tables. Violates Separation of Concerns. Rejected.

---

## R4: Onboarding Detection Logic

**Decision**: Detect first-time setup by checking if the `ingredients`
table has zero rows for the current user's account.

**Rationale**:

- Simple query: `select count(*) from ingredients`. If 0, show
  onboarding modal.
- No need for a separate "onboarding_completed" flag — the presence
  of ingredients is the natural indicator.
- After onboarding (at least one ingredient saved), the modal
  won't appear again.

**Alternatives Considered**:

- **User profile flag `has_onboarded`**: Adds a column to users table,
  requires migration, and can get out of sync with actual data state.
  Rejected.

---

## R5: Client-Side Computation Strategy

**Decision**: All costing computations (row totals, subtotals, production
cost, cost_per_item, SRP, profit) happen client-side in React state.
Only the final snapshot is persisted via server action.

**Rationale**:

- User explicitly requested: "Compute everything on client for speed"
  and "Persist final snapshot only."
- Real-time updates (< 200ms) are trivially achieved with local state.
- No round-trips needed during the costing-building process.
- Server action validates and persists the final result.

**Alternatives Considered**:

- **Server-side computation on each change**: Adds latency, server load.
  Rejected.
- **Database-computed columns**: Would require triggers and complicate
  the schema. Rejected.

---

## R6: Navigation Integration

**Decision**: Add two new routes to the dashboard bottom nav:
`/materials` and `/costing`. Since the bottom nav currently has 5 items
(POS, Inventory, Batch Prep, Reports, Sign Out), adding 2 more would
overcrowd it. Instead, add a "Costing" nav item that leads to a costing
hub page with sub-navigation to Materials and the Costing Builder.

**Rationale**:

- Constitution Principle VII (Separation of Concerns) requires costing
  to be separate from POS.
- Bottom nav space is limited (5 items + sign out). A single "Costing"
  entry keeps the nav clean.
- The costing hub can have tabs or a simple list linking to materials
  management and per-product costing.

**Alternatives Considered**:

- **Replace Batch Prep nav item**: Batch Prep is still actively used
  in MVP1. Rejected.
- **Sidebar navigation**: Not suitable for tablet-first layout. Rejected.
- **Two separate nav items (Materials + Costing)**: Overcrowds the
  bottom nav. Rejected.

---

## R7: Material Deletion with Active Costings

**Decision**: When deleting an ingredient that is referenced by a
`costing_material_rows` entry, show a warning listing affected products.
Require confirmation. On deletion, the costing material row retains a
snapshot of the material name and cost (denormalized) so the costing
remains readable.

**Rationale**:

- Constitution Principle IV (Human-Error Tolerant) requires warnings
  before destructive actions.
- Costings should remain viewable even if the source material is removed.
- Denormalizing name + cost_per_unit into `costing_material_rows` at
  save time provides this resilience.

**Alternatives Considered**:

- **Prevent deletion entirely**: Too restrictive; violates Editable
  System principle. Rejected.
- **Cascade delete costing rows**: Loses costing data silently. Rejected.
