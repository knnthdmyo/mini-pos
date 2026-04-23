---
description: "Task list template for feature implementation"
---

# Tasks: POS & Inventory System (MVP)

**Input**: Design documents from `/specs/001-pos-inventory-mvp/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/ ✅

**Tests**: Not requested — test tasks omitted from this list.

**Organization**: Tasks are grouped by user story to enable independent
implementation and testing of each story.

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1–US7)

---

## Phase 1: Setup

**Purpose**: Initialize the Next.js project and configure tooling

- [x] T001 Initialize Next.js 14 project with App Router and TypeScript in repository root (`npx create-next-app@latest . --typescript --tailwind --app --no-src-dir`)
- [x] T002 [P] Install Supabase JS v2 (`npm install @supabase/supabase-js @supabase/ssr`)
- [x] T003 [P] Create `.env.local` from `.env.local.example` with `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- [x] T004 [P] Configure `tailwind.config.ts` — extend base config for tablet-friendly tap targets (min touch target 48px)
- [x] T005 [P] Create Supabase browser client in `lib/supabase/client.ts`
- [x] T006 [P] Create Supabase server client (for Server Actions) in `lib/supabase/server.ts`
- [x] T007 [P] Create shared `requireAuth()` helper in `lib/supabase/server.ts` — throws `'UNAUTHORIZED'` if no valid session
- [x] T008 Create `app/layout.tsx` with global CSS import and `globals.css`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Database schema and core UI primitives — MUST be complete before any user story

**⚠️ CRITICAL**: No user story work can start until this phase is complete

- [x] T009 Install Supabase CLI and link project (`supabase login && supabase link --project-ref <ref>`)
- [x] T010 Create migration: `supabase/migrations/001_initial_schema.sql` — `users`, `products`, `ingredients`, `recipes`, `prepared_stock`, `orders`, `order_items`, `inventory_logs`, `batch_preparations` tables with constraints and indexes as specified in `data-model.md`
- [x] T011 Create migration: `supabase/migrations/002_db_functions.sql` — `complete_order(order_id uuid)` PostgreSQL function (atomic: status update, inventory deduction, logging) per `contracts/server-actions.md`
- [x] T012 Create migration: `supabase/migrations/003_prepare_batch.sql` — `prepare_batch(product_id uuid, quantity numeric)` PostgreSQL function (atomic: ingredient deduction, prepared stock increment, logging) per `contracts/server-actions.md`
- [x] T013 Push migrations to Supabase (`supabase db push`)
- [x] T014 [P] Create reusable `components/ui/Button.tsx` — large tap-friendly variant (min-h-12, full padding)
- [x] T015 [P] Create reusable `components/ui/Badge.tsx` — used for low-stock indicator and order status

**Checkpoint**: Schema live, DB functions deployed, shared UI components ready — user story work can begin

---

## Phase 3: User Story 7 — Authentication (Priority: P7, but foundational for all screens)

**Goal**: Login screen + protected layout guard — all other screens depend on auth

**Why first despite P7**: Auth is a prerequisite for accessing any screen. Build this before any protected page.

**Independent Test**: Accessing `/pos` without a session redirects to `/login`. Valid credentials grant access to all screens.

- [x] T016 Create `app/(auth)/login/page.tsx` — login form (email + password inputs, submit button)
- [x] T017 Create Server Action `lib/actions/auth.ts` — `login(email, password)` calls `supabase.auth.signInWithPassword`, handles errors, redirects to `/pos` on success
- [x] T018 Create `app/(dashboard)/layout.tsx` — protected layout that calls `requireAuth()` and redirects to `/login` if unauthenticated
- [x] T019 [P] Create `app/(dashboard)/pos/page.tsx` — shell page (empty, placeholder content) to verify protected route works

**Checkpoint**: Login, session guard, and protected layout working end-to-end

---

## Phase 4: User Story 1 — Place and Complete an Order (Priority: P1) 🎯 MVP

**Goal**: Full POS order creation → queue placement → order completion with inventory deduction + revenue recording

**Independent Test**: Create one product with a recipe, place an order, complete the order — confirm inventory decremented and order is `completed` in DB.

### Implementation for User Story 1

- [x] T020 [P] [US1] Create `components/pos/ProductGrid.tsx` — renders all active products as large tap buttons; each tap calls `addToCart(product)` from local cart state
- [x] T021 [P] [US1] Create `components/pos/CartSummary.tsx` — displays current cart lines (product name, quantity, line total) and running total price
- [x] T022 [P] [US1] Create `components/pos/PlaceOrderButton.tsx` — disabled when cart is empty; triggers `placeOrder()` Server Action on tap
- [x] T023 [US1] Build `app/(dashboard)/pos/page.tsx` — fetches active products (server component), renders `ProductGrid` + `CartSummary` + `PlaceOrderButton`; manages cart state as local React state (depends on T020, T021, T022)
- [x] T024 [US1] Create Server Action `lib/actions/orders.ts` — implement `placeOrder(items)` per `contracts/server-actions.md`: compute total, insert `orders` row, insert `order_items` rows with snapshotted `unit_price`, return `orderId`
- [x] T025 [US1] Wire `PlaceOrderButton` to `placeOrder` action — on success, clear cart and show confirmation; on `EMPTY_ORDER` error, show inline message
- [x] T026 [US1] Add `completeOrder(orderId)` to `lib/actions/orders.ts` — calls `supabase.rpc('complete_order', { order_id })` per `contracts/server-actions.md`
- [x] T027 [US1] Create `components/queue/OrderCard.tsx` — displays order items and elapsed time since `created_at`; includes "Complete Order" and "Edit Order" buttons
- [x] T028 [US1] Create `components/queue/QueueList.tsx` — renders list of placed orders using `OrderCard`; subscribes to Supabase Realtime `orders-queue` channel per `contracts/realtime-channels.md` (INSERT adds card, UPDATE to `completed` removes card)
- [x] T029 [US1] Build `app/(dashboard)/queue/page.tsx` — fetches initial placed orders (server component), renders `QueueList` with Realtime subscription (depends on T027, T028)
- [x] T030 [US1] Wire "Complete Order" button in `OrderCard` to `completeOrder` action — optimistic removal from queue on success

**Checkpoint**: Full order loop working — POS → place → queue → complete → inventory deducted

---

## Phase 5: User Story 2 — Manage Order Queue (Priority: P2)

**Goal**: Edit order from the queue (placed or completed)

**Independent Test**: Place an order, edit its items from the queue, save — confirm `order_items` updated and `total_price` recalculated.

- [x] T031 [US2] Add `editOrder(orderId, items)` to `lib/actions/orders.ts` — delete existing `order_items`, insert new ones, recompute `total_price`; if order is `completed`, reverse prior inventory deductions (correcting log entries) and re-run `completeOrder` logic per `contracts/server-actions.md`
- [x] T032 [US2] Create order edit modal/drawer component `components/queue/EditOrderModal.tsx` — shows current items with quantity controls, allows adding/removing products, submit triggers `editOrder` action
- [x] T033 [US2] Wire "Edit Order" button in `OrderCard` to `EditOrderModal` — open modal pre-populated with current order items; on save, update queue UI

**Checkpoint**: Orders editable post-placement and post-completion with correct inventory delta logging

---

## Phase 6: User Story 3 — Track and Adjust Inventory (Priority: P3)

**Goal**: View ingredient stock, see low-stock highlights, make manual adjustments

**Independent Test**: Adjust an ingredient stock manually — confirm new quantity shown, adjustment logged in `inventory_logs`.

- [x] T034 [P] [US3] Create `components/inventory/IngredientRow.tsx` — displays ingredient name, unit, `stock_qty`, `cost_per_unit`, `low_stock_threshold`; highlights row when `stock_qty <= low_stock_threshold`
- [x] T035 [P] [US3] Create `components/inventory/StockAdjustForm.tsx` — inline form with delta input (positive/negative) and optional notes field; submit triggers `adjustStock` action
- [x] T036 [US3] Create Server Action `lib/actions/inventory.ts` — implement `adjustStock(ingredientId, delta, notes?)` per `contracts/server-actions.md`: update `ingredients.stock_qty`, insert `inventory_logs` row with `source_type='manual'`
- [x] T037 [US3] Build `app/(dashboard)/inventory/page.tsx` — fetches all ingredients (server component), renders list of `IngredientRow` with `StockAdjustForm` per row (depends on T034, T035, T036)

**Checkpoint**: Ingredient list with low-stock highlighting and manual adjustment working

---

## Phase 7: User Story 4 — Prepare a Batch (Priority: P4)

**Goal**: Select product + quantity → deduct ingredients → increase prepared stock

**Independent Test**: Execute a batch of N units for a product with a recipe — confirm ingredient quantities decreased by (recipe_qty × N) and `prepared_stock.quantity` increased by N.

- [x] T038 [P] [US4] Create `components/batch/BatchPrepForm.tsx` — product selector dropdown (only products with recipes), quantity input, submit button; calls `prepareBatch` action
- [x] T039 [US4] Create Server Action `lib/actions/batch.ts` — implement `prepareBatch(productId, quantity)` per `contracts/server-actions.md`: calls `supabase.rpc('prepare_batch', { product_id, quantity })`; handles `NO_RECIPE` and `INVALID_QUANTITY` errors
- [x] T040 [US4] Build `app/(dashboard)/batch/page.tsx` — fetches products with recipes (server component), renders `BatchPrepForm` with success/error feedback (depends on T038, T039)

**Checkpoint**: Batch preparation working end-to-end with atomic ingredient deduction

---

## Phase 8: User Story 5 — View Profit Reports (Priority: P5)

**Goal**: Daily / weekly / monthly revenue, cost, and profit display

**Independent Test**: Complete several orders, open daily report — revenue equals sum of those orders' totals; cost derived from inventory logs for the day; profit matches revenue − cost.

- [x] T041 [P] [US5] Create `components/reports/ProfitSummary.tsx` — displays revenue, cost, profit as large readable numbers; receives pre-computed values as props
- [x] T042 [US5] Create Server Action `lib/actions/reports.ts` — implement `getReport(period)` per `contracts/server-actions.md`: compute date range, query revenue from `orders` and cost from `inventory_logs`, return `{ revenue, cost, profit, startDate, endDate }`
- [x] T043 [US5] Build `app/(dashboard)/reports/page.tsx` — period filter tabs (Daily / Weekly / Monthly), fetches report on filter change via Server Action, renders `ProfitSummary` (depends on T041, T042)

**Checkpoint**: Reports page showing correct profit for all three time periods

---

## Phase 9: User Story 6 — Low Stock Alerts (Priority: P6)

**Goal**: Automatic email when ingredient crosses threshold; non-blocking

**Independent Test**: Set ingredient threshold, trigger stock reduction to threshold via order completion, confirm email received (check SendGrid event log).

- [x] T044 [US6] Create Supabase Edge Function `supabase/functions/low-stock-alert/index.ts` — receives `UPDATE` webhook payload for `ingredients` table; if `record.stock_qty <= record.low_stock_threshold` and threshold is not null, calls SendGrid API to send alert email per `contracts/realtime-channels.md`
- [x] T045 [US6] Create Supabase Database Webhook in `supabase/migrations/004_low_stock_webhook.sql` (or via dashboard) — fires on `UPDATE` of `ingredients`, calls `low-stock-alert` Edge Function
- [x] T046 [US6] Deploy Edge Function (`supabase functions deploy low-stock-alert`) and set secrets: `SENDGRID_API_KEY`, `OPERATOR_EMAIL`, `SENDGRID_FROM_EMAIL`

**Checkpoint**: Low stock email fires automatically; order completion and stock adjustment flows unaffected

---

## Phase 10: Polish & Cross-Cutting Concerns

**Purpose**: Navigation, error states, negative stock flagging, empty states

- [x] T047 Create `app/(dashboard)/layout.tsx` — add navigation sidebar/bottom-bar with links to POS, Queue, Inventory, Batch, Reports; all links visible without scrolling (constitution UX rule)
- [x] T048 [P] Add negative stock visual flag to `IngredientRow.tsx` — display warning icon/color when `stock_qty < 0` (distinct from low-stock highlight)
- [x] T049 [P] Add empty state to `QueueList.tsx` — show "No active orders" message when queue is empty
- [x] T050 [P] Add error boundary / toast for Server Action failures across POS, Queue, Inventory, Batch pages
- [x] T051 Create `supabase/migrations/005_seed_data.sql` — sample products, ingredients, and recipes for first-run testing (matches `quickstart.md` smoke test)
- [x] T052 Add `OPERATOR_EMAIL` and `SENDGRID_*` to `.env.local.example` with placeholder values and comments

---

## Dependencies

```
T001–T008 (Setup)
  ↓
T009–T015 (Foundation: DB + UI primitives)
  ↓
T016–T019 (Auth + protected layout) ← required by ALL user story phases
  ↓
T020–T030 (US1: POS + Queue core) ← MVP complete here
  ↓
T031–T033 (US2: Order editing)
T034–T037 (US3: Inventory)         ← US2, US3, US4 parallelizable after US1
T038–T040 (US4: Batch prep)
  ↓
T041–T043 (US5: Reports)           ← depends on orders + inventory logs existing
  ↓
T044–T046 (US6: Low stock alerts)  ← independent, can overlap with US3–US5
  ↓
T047–T052 (Polish)
```

---

## Parallel Execution (per story phase)

| Phase | Parallelizable tasks |
|---|---|
| Phase 1 – Setup | T002, T003, T004, T005, T006, T007 all parallel after T001 |
| Phase 2 – Foundation | T014, T015 parallel; T010–T013 sequential |
| Phase 4 – US1 | T020, T021, T022 parallel; T023 after; T027, T028 parallel |
| Phase 6 – US3 | T034, T035 parallel before T036 |
| Phase 7 – US4 | T038 parallel before T039 |
| Phase 8 – US5 | T041 parallel before T042 |
| Phase 10 – Polish | T048, T049, T050, T052 all parallel |

---

## Implementation Strategy

**MVP scope = Phase 1 + Phase 2 + Phase 3 (Auth) + Phase 4 (US1)**

After Phase 4 (T030), the system can:
- Accept and place orders on the POS
- Show the live queue
- Complete orders with inventory deduction + revenue recording

This is the minimum viable system. Phases 5–9 extend it incrementally without
breaking the core flow.

**Delivery order recommendation**:
1. Phases 1–4 (T001–T030) — launch with this
2. Phase 5 (T031–T033) — order editing
3. Phase 6 (T034–T037) — inventory management
4. Phase 7 (T038–T040) — batch prep
5. Phase 8 (T041–T043) — reports
6. Phase 9 (T044–T046) — low stock alerts
7. Phase 10 (T047–T052) — polish
