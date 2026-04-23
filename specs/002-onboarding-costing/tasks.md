# Tasks: Onboarding & Costing System

**Input**: Design documents from `/specs/002-onboarding-costing/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/server-actions.md

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Pages**: `app/(dashboard)/` at repository root
- **Components**: `components/` at repository root
- **Server actions**: `lib/actions/` at repository root
- **Migrations**: `supabase/migrations/` at repository root

---

## Phase 1: Setup

**Purpose**: Database schema and shared infrastructure

- [x] T001 Create migration file `supabase/migrations/018_costing_tables.sql` with `product_costings` and `costing_material_rows` tables, indexes, and RLS policies per data-model.md
- [x] T002 Apply migration locally via `supabase db push` or `supabase migration up` and verify tables exist

**Checkpoint**: New tables available in the database

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Server actions that ALL user stories depend on

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T003 Implement `getMaterialsCount()` server action in `lib/actions/materials.ts` — returns `{ count: number }` from `ingredients` table. Call `requireAuth()`. Used for onboarding detection.
- [x] T004 [P] Implement `getMaterials()` server action in `lib/actions/materials.ts` — returns all ingredients sorted by name. Call `requireAuth()`.
- [x] T005 [P] Implement `addMaterial(data)` server action in `lib/actions/materials.ts` — compute `cost_per_unit = totalCost / quantity`, insert into `ingredients` with `stock_qty = quantity`, revalidate `/materials`, `/inventory`, `/costing`. Call `requireAuth()`.
- [x] T006 Implement `updateMaterial(id, data)` server action in `lib/actions/materials.ts` — compute `cost_per_unit`, update `ingredients` row, revalidate paths. Call `requireAuth()`. Depends on T005 pattern.
- [x] T007 Implement `deleteMaterial(id, confirm?)` server action in `lib/actions/materials.ts` — check `costing_material_rows` for references, return warning with affected product names if referenced (join through `product_costings` to `products`), delete only if not referenced or `confirm = true`, revalidate paths. Call `requireAuth()`.
- [x] T008 [P] Implement `getProductsWithCostingStatus()` server action in `lib/actions/costing.ts` — select all active products left-joined with `product_costings`, return `{ id, name, price, hasCosting, costPerItem, srp }[]`. Call `requireAuth()`.
- [x] T009 [P] Implement `getCosting(productId)` server action in `lib/actions/costing.ts` — fetch `product_costings` row with nested `costing_material_rows`, return full snapshot or `null`. Call `requireAuth()`.
- [x] T010 Implement `saveCosting(data)` server action in `lib/actions/costing.ts` — validate all numeric constraints (yield > 0, margin >= 0, srp > 0), upsert `product_costings` by `product_id`, delete + re-insert `costing_material_rows`, update `products.price` to `srp`, revalidate `/costing`, `/pos`, `/reports`. Call `requireAuth()`.
- [x] T011 [P] Implement `deleteCosting(productId)` server action in `lib/actions/costing.ts` — delete `product_costings` row (cascades to material rows), do NOT change `products.price`, revalidate `/costing`. Call `requireAuth()`.

**Checkpoint**: All server actions ready — user story UI work can begin

---

## Phase 3: User Story 1 — First Login Onboarding (Priority: P1) 🎯 MVP

**Goal**: First-time admin sees onboarding modal, adds materials, modal dismisses

**Independent Test**: Log in with zero ingredients in DB → modal appears → add a material → modal is dismissable → reload page → modal does not reappear

### Implementation for User Story 1

- [x] T012 [US1] Create `components/materials/MaterialForm.tsx` — client component with fields: name (text), unit (select: g, kg, pc, ml, L), quantity (number), totalCost (number), notes (textarea, optional). Compute and display `cost_per_unit = totalCost / quantity` in real-time. Show "—" when quantity is 0. Submit calls `addMaterial()` server action. Use Tailwind utility classes.
- [x] T013 [US1] Create `components/materials/OnboardingModal.tsx` — client component. Receives `showOnboarding: boolean` prop. Renders a centered modal overlay with title "Welcome! Add your first materials". Embeds `<MaterialForm />`. On successful save, show success toast and allow adding another or dismissing. Modal dismisses when admin clicks "Done" (only enabled if at least 1 material exists). Uses existing `components/ui/Button.tsx` and `components/ui/Toast.tsx`.
- [x] T014 [US1] Integrate onboarding into `app/(dashboard)/layout.tsx` — in the server component, call `getMaterialsCount()`. Pass `showOnboarding={count === 0}` to a new client wrapper that renders `<OnboardingModal />` conditionally. Do NOT modify existing nav structure.

**Checkpoint**: Onboarding flow works end-to-end for first-time admin

---

## Phase 4: User Story 2 — Materials Management Table (Priority: P1)

**Goal**: Admin can view, add, edit, and delete materials from a dedicated page

**Independent Test**: Navigate to `/materials` → see table of materials → add/edit/delete → verify table updates

### Implementation for User Story 2

- [x] T015 [US2] Create `components/materials/MaterialsTable.tsx` — client component. Receives `materials[]` prop. Renders a table with columns: Name, Unit, Cost/Unit (₱X.XXXX), Actions (Edit, Delete buttons). Edit button opens inline edit or `<MaterialForm />` in edit mode. Delete button calls `deleteMaterial()` — if warning returned, show confirmation dialog with affected product names before re-calling with `confirm: true`.
- [x] T016 [US2] Create `app/(dashboard)/materials/page.tsx` — server component. Call `getMaterials()` to fetch data. Render page title "Materials" and `<MaterialsTable />`. Include an "Add Material" button that opens `<MaterialForm />` (reuse from US1).
- [x] T017 [US2] Add "Costing" navigation item to `app/(dashboard)/layout.tsx` bottom nav — links to `/materials` initially. Use an icon consistent with existing nav style (e.g., calculator or dollar sign). Keep existing 5 nav items; add as 6th before Sign Out.

**Checkpoint**: Materials page fully functional with CRUD operations

---

## Phase 5: User Story 3 — Costing Builder (Priority: P1)

**Goal**: Admin selects a product, adds material rows, enters overhead/labor, sees total production cost in real-time

**Independent Test**: Navigate to `/costing` → select a product → add material rows → enter overhead/labor → verify totals compute correctly in real-time

### Implementation for User Story 3

- [x] T018 [US3] Create `components/costing/MaterialRowEditor.tsx` — client component. Single row in the costing table: material dropdown (populated from `materials[]` prop), auto-filled unit and cost_per_unit on selection, quantity_used input (number), computed row_total displayed. Includes a remove button. Emits `onChange` and `onRemove` callbacks.
- [x] T019 [US3] Create `components/costing/CostingBuilder.tsx` — client component. Manages local state for an array of material rows, overhead_cost, labor_cost, other_cost. Renders a list of `<MaterialRowEditor />` components with an "Add Row" button. Computes in real-time: `totalMaterialCost` (sum of row totals), `totalProductionCost` (material + overhead + labor + other). Displays all subtotals. Receives `materials[]` and `productId` props.
- [x] T020 [US3] Create `components/costing/ProductCostingList.tsx` — client component. Receives `products[]` prop (from `getProductsWithCostingStatus()`). Renders a list/grid of product cards showing name, current price, and costing status badge (✓ Costed / ⚠ No Costing). Clicking a product navigates to or opens the costing builder for that product.
- [x] T021 [US3] Create `app/(dashboard)/costing/page.tsx` — server component. Call `getProductsWithCostingStatus()` and `getMaterials()`. Render `<ProductCostingList />` and `<CostingBuilder />`. When a product is selected, load its existing costing via `getCosting(productId)` and pre-populate the builder. If no costing exists, show empty builder.

**Checkpoint**: Costing builder computes material + overhead/labor totals correctly

---

## Phase 6: User Story 4 — Yield & Per-Item Cost (Priority: P2)

**Goal**: Admin enters yield, system computes cost_per_item = total_production_cost / yield

**Independent Test**: In costing builder, set production cost and yield → verify cost_per_item updates in real-time → set yield to 0 → verify "—" placeholder shown

### Implementation for User Story 4

- [x] T022 [US4] Extend `components/costing/CostingBuilder.tsx` — add `yieldQuantity` input field (number, > 0). Compute `costPerItem = totalProductionCost / yieldQuantity` in real-time. Show "—" when yield is 0 or empty. Display cost_per_item with 4 decimal places (₱X.XXXX). Add zero-division guard.

**Checkpoint**: Cost per item computes correctly from batch yield

---

## Phase 7: User Story 5 — Profit Margin & SRP Suggestion (Priority: P2)

**Goal**: Admin enters margin %, system suggests SRP, admin can override; profit figures displayed

**Independent Test**: Set margin → verify SRP = cost_per_item × (1 + margin/100) → override SRP manually → verify profit figures update → clear override → verify SRP reverts

### Implementation for User Story 5

- [x] T023 [US5] Create `components/costing/CostSummaryCard.tsx` — client component. Receives computed values as props: `costPerItem`, `profitMargin`, `srp`, `srpOverride`, `yieldQuantity`. Displays a summary card grid: Total Cost card, Cost/Item card, SRP card (editable input), Profit/Item card, Profit/Batch card. SRP input defaults to computed value; when admin types a custom value, sets `srpOverride = true`. A "Reset to suggested" link clears the override. Validate: reject negative margin (show error). Emit `onMarginChange`, `onSrpOverride` callbacks.
- [x] T024 [US5] Extend `components/costing/CostingBuilder.tsx` — add `profitMargin` input (percentage, >= 0). Compute `suggestedSrp = costPerItem * (1 + profitMargin / 100)`. Track `srpOverride` boolean and `manualSrp` value. Compute `netProfitPerItem = srp - costPerItem` and `totalProfitPerBatch = netProfitPerItem * yieldQuantity`. Integrate `<CostSummaryCard />` below the cost inputs. Reject negative margin input with validation error.

**Checkpoint**: Full pricing flow works: cost → margin → SRP → profit

---

## Phase 8: User Story 6 — Save & Persist Costing (Priority: P2)

**Goal**: Admin saves costing, data persists, POS price updates

**Independent Test**: Fill costing builder → save → reload page → verify all values restored → check POS product price matches SRP

### Implementation for User Story 6

- [x] T025 [US6] Add "Save Costing" button to `components/costing/CostingBuilder.tsx` — on click, collect all state (material rows with denormalized name/unit/cost, overhead, labor, other, yield, totals, margin, srp, srpOverride) and call `saveCosting()` server action. Show success toast on save. Show validation errors if any field is invalid (yield 0, no material rows, etc.). Disable button while saving.
- [x] T026 [US6] Add pre-population logic to `app/(dashboard)/costing/page.tsx` — when a product is selected, call `getCosting(productId)`. If costing exists, pass saved values as `initialData` prop to `<CostingBuilder />`. The builder initializes its local state from `initialData` when present. Include `updated_at` display showing when costing was last saved.

**Checkpoint**: Costings persist and restore correctly; products.price updated

---

## Phase 9: User Story 7 — POS Integration (Priority: P3)

**Goal**: POS shows SRP as product price; profit reports use cost_per_item

**Independent Test**: Save costing with SRP → verify POS shows correct price → complete an order → verify profit report accuracy

### Implementation for User Story 7

- [x] T027 [US7] Verify POS integration in `app/(dashboard)/pos/page.tsx` — no code changes expected since POS already reads `products.price` and `saveCosting()` updates that column. Manually verify: save a costing → check POS product grid shows updated price. Document any issues found.
- [x] T028 [US7] Verify reports integration in `lib/actions/reports.ts` — the existing `getReport()` computes cost from `inventory_logs` joined with `ingredients.cost_per_unit`. Since we reuse the `ingredients` table and update `cost_per_unit` via materials management, profit calculations automatically use current material costs. Manually verify: complete an order after saving costing → check report shows accurate profit. Document any issues found.

**Checkpoint**: End-to-end flow works: costing → SRP → POS → order → profit report

---

## Phase 10: Polish & Cross-Cutting Concerns

**Purpose**: UX improvements and edge case handling

- [x] T029 [P] Update bottom nav in `app/(dashboard)/layout.tsx` — ensure "Costing" link navigates to `/costing` (hub page listing products). If previously linked to `/materials`, update to `/costing` and add a link to `/materials` within the costing page as a sub-nav or tab.
- [x] T030 [P] Add summary cards to `app/(dashboard)/costing/page.tsx` — at the top of the page, show aggregate stats: total products, products with costing, products without costing. Use card layout consistent with existing `ProfitSummary.tsx` style.
- [x] T031 [P] Add real-time validation UX to `components/costing/CostingBuilder.tsx` — inline error messages for: yield = 0, negative margin, no material rows, empty required fields. Use red text below inputs, consistent with existing form patterns.
- [x] T032 Run `quickstart.md` validation checklist end-to-end. Verify all 11 items pass. Document results.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Phase 1 (tables must exist)
- **User Stories (Phase 3–9)**: All depend on Phase 2 (server actions must exist)
  - US1 (Phase 3): No dependency on other stories
  - US2 (Phase 4): Reuses `MaterialForm` from US1 (depends on T012)
  - US3 (Phase 5): No dependency on US1/US2 (uses server actions directly)
  - US4 (Phase 6): Extends `CostingBuilder` from US3 (depends on T019)
  - US5 (Phase 7): Extends `CostingBuilder` from US4 (depends on T022)
  - US6 (Phase 8): Extends `CostingBuilder` from US5 (depends on T024)
  - US7 (Phase 9): Depends on US6 (needs saved costings to verify)
- **Polish (Phase 10)**: Depends on all user stories complete

### Recommended Execution Order

```
Phase 1 (T001–T002)
  → Phase 2 (T003–T011)
    → Phase 3/US1 (T012–T014) ←── can run in parallel with ──→ Phase 5/US3 (T018–T021)
      → Phase 4/US2 (T015–T017)                                   → Phase 6/US4 (T022)
                                                                     → Phase 7/US5 (T023–T024)
                                                                       → Phase 8/US6 (T025–T026)
                                                                         → Phase 9/US7 (T027–T028)
                                                                           → Phase 10 (T029–T032)
```

### Parallel Opportunities

- **Phase 2**: T003, T004, T005, T008, T009, T011 can run in parallel (different files/functions)
- **Phase 3 + Phase 5**: US1 (onboarding) and US3 (costing builder) can be built in parallel since they use different components and share only server actions
- **Phase 10**: T029, T030, T031 can run in parallel (different files)

---

## Implementation Strategy

### MVP First (Minimum Viable)

**Just US1 + US2 + US3**: Delivers material entry and cost computation.
Admin can see what their products cost even without SRP/save features.

### Incremental Delivery

1. **Increment 1** (US1 + US2): Materials management — onboarding + CRUD
2. **Increment 2** (US3): Costing builder — material rows + overhead
3. **Increment 3** (US4 + US5): Yield + pricing — cost per item + SRP
4. **Increment 4** (US6): Persistence — save/restore costing snapshots
5. **Increment 5** (US7): Integration — verify POS + reports work
6. **Increment 6**: Polish — nav, cards, validation UX
