# Feature Specification: Onboarding & Costing System

**Feature Branch**: `002-onboarding-costing`
**Created**: 2026-04-23
**Status**: Draft
**Input**: User description: "First login onboarding, materials management, costing builder per product, SRP suggestion system for MVP2"

## User Scenarios & Testing _(mandatory)_

### User Story 1 — First Login Onboarding & Materials Setup (Priority: P1)

As a first-time admin, I log in and the system detects I have no materials yet.
A modal-based onboarding flow guides me to add my first materials — entering
the name, unit of measure, quantity purchased, and total cost paid. The system
computes the cost per unit automatically. I can add multiple materials before
dismissing the onboarding flow.

**Why this priority**: Without materials, no costing can happen. This is the
foundational data-entry step that unblocks every other feature in MVP2.

**Independent Test**: Can be fully tested by logging in with a fresh account
that has zero materials. The onboarding modal appears, materials are saved,
and the materials table is populated.

**Acceptance Scenarios**:

1. **Given** a logged-in admin with zero materials, **When** the dashboard
   loads, **Then** the onboarding modal is displayed automatically.
2. **Given** the onboarding modal is open, **When** the admin enters name
   "Sugar", unit "kg", quantity 25, total_cost 500, **Then** cost_per_unit
   is computed as 20 and displayed in real-time.
3. **Given** the onboarding modal is open, **When** the admin saves a
   material, **Then** it appears in the materials table and the admin can
   add another material or dismiss the modal.
4. **Given** the admin has at least one material saved, **When** the admin
   dismisses the onboarding modal, **Then** the modal does not reappear
   on subsequent logins.

---

### User Story 2 — Materials Management Table (Priority: P1)

As an admin, I can view, add, edit, and delete materials from a dedicated
materials table. Each row shows the material name, unit, and cost per unit.
I can update material costs at any time; changes apply only to future
costing calculations.

**Why this priority**: Materials are the source of truth for all costing.
The admin needs a persistent way to manage them beyond the initial onboarding.

**Independent Test**: Navigate to the materials page, add/edit/delete
materials, and verify the table reflects changes correctly.

**Acceptance Scenarios**:

1. **Given** the materials page is open, **When** the admin clicks "Add
   Material", **Then** a form appears with fields: name, unit, quantity,
   total_cost, and optional notes.
2. **Given** a material "Flour" exists, **When** the admin edits its
   total_cost from 200 to 250 (quantity 10kg), **Then** cost_per_unit
   updates to 25.
3. **Given** a material is used in a product costing, **When** the admin
   deletes that material, **Then** the system warns that it is referenced
   by existing product costings before confirming deletion.
4. **Given** the materials table has entries, **When** the admin views
   it, **Then** columns displayed are: name, unit, cost per unit, and
   action buttons.

---

### User Story 3 — Costing Builder per Product (Priority: P1)

As an admin, I open the costing builder for a product and see a table of
material rows. For each row I select a material (dropdown), the unit and
cost per unit auto-fill, I enter the quantity used, and the row total
computes automatically. Below the material table I enter overhead cost,
labor cost, and optional other costs. The system computes the total
production cost in real-time.

**Why this priority**: This is the core value proposition of MVP2 — turning
raw material costs into a per-product production cost.

**Independent Test**: Open costing builder for any product, add material
rows, enter overhead/labor, and verify all computed totals match expected
math.

**Acceptance Scenarios**:

1. **Given** the costing builder is open for product "Candy Bar", **When**
   the admin selects material "Sugar" (cost_per_unit=20/kg) and enters
   quantity 0.5kg, **Then** the row total shows 10.
2. **Given** two material rows with totals 10 and 15, **When** the admin
   views the subtotal, **Then** total material cost shows 25.
3. **Given** total material cost is 25, overhead is 5, labor is 10, other
   is 2, **When** all fields are filled, **Then** total production cost
   shows 42 in real-time.
4. **Given** the costing builder is open, **When** the admin removes a
   material row, **Then** all totals recompute immediately.

---

### User Story 4 — Yield & Per-Item Cost (Priority: P2)

As an admin, I enter the yield quantity (number of items produced per batch).
The system divides total production cost by yield to compute cost per item.

**Why this priority**: Yield converts batch-level costs into per-item costs,
which is required before pricing can be set.

**Independent Test**: Enter a yield quantity in the costing builder and
verify cost_per_item equals total_production_cost divided by yield.

**Acceptance Scenarios**:

1. **Given** total production cost is 42 and yield is 150, **When** the
   admin enters yield, **Then** cost_per_item displays 0.28.
2. **Given** yield is set, **When** the admin changes total production
   cost (e.g., adds a material row), **Then** cost_per_item recomputes.
3. **Given** yield field is empty or zero, **When** the admin views
   cost_per_item, **Then** it shows a placeholder (e.g., "—") instead
   of dividing by zero.

---

### User Story 5 — Profit Margin & SRP Suggestion (Priority: P2)

As an admin, I enter a desired profit margin percentage. The system computes
a suggested selling price (SRP = cost_per_item × (1 + margin%)). I can
accept the suggestion or manually override the SRP. The system shows net
profit per item and total profit per batch.

**Why this priority**: SRP is the final output of the costing flow and
directly feeds into POS pricing.

**Independent Test**: Set a margin, verify the SRP calculation, override
it manually, and confirm profit figures update correctly.

**Acceptance Scenarios**:

1. **Given** cost_per_item is 0.28 and margin is 50%, **When** the admin
   views SRP, **Then** suggested_selling_price shows 0.42.
2. **Given** SRP is 0.42, **When** the admin manually overrides SRP to
   0.50, **Then** net profit per item shows 0.22 and total profit per
   batch shows 33 (0.22 × 150).
3. **Given** SRP is manually overridden, **When** the admin clears the
   override, **Then** SRP reverts to the system-computed suggestion.

---

### User Story 6 — Save & Persist Costing Snapshot (Priority: P2)

As an admin, I save the costing for a product. The system persists the
full breakdown: material rows, overhead, labor, other costs, yield,
cost per item, and SRP. This snapshot is used by POS for pricing and
by reports for profit calculation.

**Why this priority**: Without persistence, costing data is lost and
cannot integrate with POS or reports.

**Independent Test**: Save a costing, reload the page, and verify all
values are restored. Confirm POS shows the saved SRP as the product price.

**Acceptance Scenarios**:

1. **Given** a fully filled costing builder, **When** the admin clicks
   "Save Costing", **Then** all fields (materials, overhead, labor,
   yield, cost_per_item, SRP) are persisted.
2. **Given** a saved costing exists, **When** the admin reopens the
   costing builder for that product, **Then** all saved values are
   pre-populated.
3. **Given** a saved costing with SRP of 0.50, **When** the admin
   views the product in POS, **Then** the product price reflects 0.50.
4. **Given** a saved costing exists, **When** the admin edits and
   re-saves, **Then** only future orders use the updated pricing —
   past orders are unaffected.

---

### User Story 7 — POS Integration (Priority: P3)

As a cashier using POS, product prices reflect the SRP set by the costing
system. When an order is completed, profit calculations use the cost per
item from the costing snapshot. No costing details are visible in the POS
interface — only the final price.

**Why this priority**: This connects costing output to the existing POS
system. It depends on US6 (saved costing) being complete.

**Independent Test**: Save a costing with a specific SRP, create an order
in POS, and verify the price matches and profit reports are accurate.

**Acceptance Scenarios**:

1. **Given** product "Candy Bar" has a saved SRP of 0.50, **When** the
   cashier views POS, **Then** "Candy Bar" shows price 0.50.
2. **Given** an order with "Candy Bar" is completed, **When** the admin
   views reports, **Then** profit is calculated as (SRP − cost_per_item)
   × quantity sold.
3. **Given** the admin updates the costing for "Candy Bar" to SRP 0.60,
   **When** a new order is created, **Then** the new price is 0.60 but
   previously completed orders still reflect 0.50.

---

### Edge Cases

- What happens when a material used in a costing is deleted? The system
  MUST warn the admin and require confirmation. Existing saved costings
  retain the material data as a snapshot.
- What happens when yield is set to zero? The system MUST prevent
  division by zero and show a validation message.
- What happens when total_cost or quantity is zero during material entry?
  Cost per unit shows 0 and a warning is displayed.
- What happens when no profit margin is set? SRP defaults to cost_per_item
  (0% margin) and the admin is prompted to set a margin.
- What happens when a product has no saved costing? POS uses the existing
  manually-set price. No costing data appears in reports for that product.
- What happens when the admin enters a negative margin? The system MUST
  reject negative margins with a validation error.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: System MUST detect first-time login (zero materials) and
  display an onboarding modal automatically.
- **FR-002**: Onboarding modal MUST allow adding materials with fields:
  name, unit (g, kg, pc, ml, L), quantity, total_cost, and optional notes.
- **FR-003**: System MUST compute cost_per_unit as total_cost ÷ quantity
  in real-time as the admin types.
- **FR-004**: System MUST provide a materials management page with add,
  edit, and delete operations.
- **FR-005**: System MUST warn before deleting a material that is
  referenced by any product costing.
- **FR-006**: Costing builder MUST allow selecting materials from a
  dropdown populated by the materials table.
- **FR-007**: Costing builder MUST auto-fill unit and cost_per_unit when
  a material is selected.
- **FR-008**: Costing builder MUST compute row total (quantity_used ×
  cost_per_unit) in real-time.
- **FR-009**: Costing builder MUST compute total material cost as the sum
  of all row totals in real-time.
- **FR-010**: System MUST accept overhead_cost, labor_cost, and optional
  other_cost inputs.
- **FR-011**: System MUST compute total_production_cost as material_cost +
  overhead + labor + other in real-time.
- **FR-012**: System MUST accept yield_quantity and compute cost_per_item
  as total_production_cost ÷ yield_quantity.
- **FR-013**: System MUST prevent division by zero when yield is 0 or empty.
- **FR-014**: System MUST compute suggested_selling_price as cost_per_item ×
  (1 + profit_margin / 100).
- **FR-015**: SRP MUST be editable — the admin can override the computed
  value with a manual price.
- **FR-016**: System MUST display net_profit_per_item (SRP − cost_per_item)
  and total_profit_per_batch (net_profit × yield).
- **FR-017**: System MUST save the full costing snapshot per product
  (material breakdown, overhead, labor, other, yield, cost_per_item, SRP).
- **FR-018**: Editing a costing MUST NOT retroactively affect past orders
  or historical records.
- **FR-019**: POS MUST use the saved SRP as the product selling price.
- **FR-020**: Profit reports MUST use cost_per_item from the costing
  snapshot for profit calculations.
- **FR-021**: System MUST reject negative profit margins with a validation
  error.
- **FR-022**: All computed values MUST show their derivation — no
  black-box formulas.

### Key Entities

- **Material**: A raw ingredient or supply item with a name, unit of
  measure, and cost per unit. Source of truth for costing calculations.
- **Product Costing**: A snapshot linking a product to its material
  breakdown, overhead/labor costs, yield, cost per item, and SRP.
  One costing per product; updated in-place with forward-only effect.
- **Costing Material Row**: A line item within a product costing that
  references a material, specifies quantity used, and computes row cost.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: First-time admin can complete onboarding (add at least one
  material) in under 2 minutes.
- **SC-002**: Admin can build a full product costing (materials + overhead
  - yield + SRP) in under 5 minutes.
- **SC-003**: All computed values (cost per unit, row totals, production
  cost, cost per item, SRP, profit) update within 200ms of input change
  (perceived real-time).
- **SC-004**: 100% of saved costings correctly propagate SRP to POS
  product pricing without manual intervention.
- **SC-005**: Editing a costing never alters historical order data —
  verified by comparing order records before and after costing edits.
- **SC-006**: Admin can trace any SRP back to its component costs
  (materials, overhead, labor, yield, margin) in a single view.

## Assumptions

- The existing authentication system (Supabase Auth) is reused; no new
  auth flow is needed.
- Only admin users access costing features; POS cashiers see only
  product prices (SRP).
- The materials table is a new entity — not the same as the existing
  ingredients/inventory tables used for stock management.
- Products already exist in the system from MVP1. Costing is added as
  a layer on top of existing products.
- Currency is a single denomination (no multi-currency support).
- All costing is per-batch, per-product. Multi-product batches (shared
  ingredients across products in a single batch run) are out of scope.
- The onboarding flow is triggered only once per account (when zero
  materials exist). Subsequent material management uses the materials page.
