# Research: POS & Inventory System (MVP)

**Branch**: `001-pos-inventory-mvp`  
**Date**: 2026-04-20  
**Status**: Complete — all NEEDS CLARIFICATION resolved

---

## Decision 1: Next.js App Router vs Pages Router

**Decision**: App Router (Next.js 14+)

**Rationale**: App Router enables React Server Components for data-fetching
screens (reports, inventory list) without client-side waterfalls, and Server
Actions for mutations without a separate API layer. This reduces round-trips,
matches the "speed first" principle, and simplifies the codebase.

**Alternatives considered**:

- Pages Router — more familiar but no Server Actions; would require separate API
  routes for every mutation, adding latency and code surface.
- Separate Express/Fastify backend — unnecessary given Supabase handles DB and
  auth; would add infrastructure overhead with no benefit for single-user scale.

---

## Decision 2: Supabase vs alternatives

**Decision**: Supabase (PostgreSQL + Auth + Realtime + Edge Functions)

**Rationale**: Supabase provides four services needed by this MVP in one platform:
relational storage (PostgreSQL), managed auth (JWTs, sessions), real-time
subscriptions (queue live updates), and serverless edge functions (low-stock
email trigger). This eliminates the need to separately manage a DB server, an
auth provider, a websocket layer, and a cron/webhook service.

**Alternatives considered**:

- Firebase — NoSQL; relational joins for cost/profit queries would be complex
  and inaccurate. Not appropriate for inventory + financial data.
- PlanetScale + Clerk — requires two separate managed services; acceptable but
  adds integration surface. No built-in realtime or edge functions.
- Raw PostgreSQL + NextAuth — full control but requires manual DB hosting,
  connection pooling, and auth session management. Overkill for MVP scale.

---

## Decision 3: POS cart state — local React state vs server state

**Decision**: Local React state (component-level) for the active cart

**Rationale**: The cart is transient — it exists only while the staff member
builds the order and is discarded on place or cancel. Persisting it to the server
on every tap would add latency per tap, violating the < 5-second order creation
constraint. Cart is committed to the DB only on "Place Order" as a single atomic
write.

**Alternatives considered**:

- Zustand / Redux global store — useful if cart needed to survive page navigation,
  but the POS is a single screen; local state is sufficient.
- Server-side cart (DB draft orders) — enables resuming interrupted orders, but
  adds a DB write on every product tap. Neither the spec nor constitution requires
  draft persistence.

---

## Decision 4: Order completion atomicity

**Decision**: Supabase PostgreSQL function (`complete_order`) invoked via RPC

**Rationale**: Order completion must atomically: update order status, record
`completed_at`, deduct inventory (prepared or ingredient), log all inventory
changes, and compute revenue. If any step fails, all must roll back. A DB-level
function wrapped in a transaction is the only reliable way to guarantee this
without application-level distributed transactions.

**Alternatives considered**:

- Sequential Server Action mutations — multiple round-trips with no rollback
  guarantee if one step fails mid-way. Violates the data integrity rule ("no
  silent mutations").
- Application-level transaction via Supabase JS `rpc()` — same as above; JS
  cannot atomically compose multiple Supabase writes in a transaction without a
  DB function.

---

## Decision 5: Queue live updates — Supabase Realtime

**Decision**: Supabase Realtime (Postgres Changes subscription on `orders` table)

**Rationale**: The queue MUST reflect new orders within 1 second (SC-002) without
requiring the operator to refresh. Supabase Realtime provides Postgres logical
replication-based subscriptions with no additional infrastructure. The client
subscribes to INSERT/UPDATE events on the `orders` table and updates the queue
in-place.

**Alternatives considered**:

- Polling (setInterval) — simpler but introduces up to N-second lag depending on
  interval. Wastes bandwidth. Not real-time.
- WebSockets (custom socket server) — would require a separate persistent server
  process; Vercel serverless functions do not support persistent WebSocket
  connections natively.

---

## Decision 6: Low stock email — Supabase Edge Function + SendGrid

**Decision**: Supabase Database Webhook → Edge Function → SendGrid API

**Rationale**: Low stock detection must be non-blocking (FR-034). A Supabase
Database Webhook triggers an Edge Function when an `ingredients` row's
`stock_qty` changes to ≤ `low_stock_threshold`. The Edge Function calls
SendGrid's transactional email API. This decouples alert delivery entirely from
the Server Action that triggers the stock deduction — the user's request
completes instantly.

**Alternatives considered**:

- Email inside the Server Action (inline SendGrid call) — blocks the response
  until the email API responds. If SendGrid is slow or down, the order completion
  action would time out. Violates non-blocking requirement.
- Vercel Cron job polling for low stock — adds latency between stock drop and
  alert (up to cron interval). Misses the immediacy needed for a small food stall
  that can sell out quickly.

---

## Decision 7: Testing approach

**Decision**: Vitest for unit/logic tests; Playwright for end-to-end critical paths

**Rationale**: Vitest is the de facto standard for Next.js / TypeScript projects
and works with the App Router without additional configuration. End-to-end tests
with Playwright cover the five critical paths listed in the spec's testing
checklist: create → complete order, prepared stock deduction, ingredient
deduction, batch preparation, and profit accuracy.

**Alternatives considered**:

- Jest — works but requires additional transforms for ESM modules used by Next.js.
  Vitest handles this natively.
- Cypress — heavier than Playwright; Playwright has better Next.js integration
  and is faster in CI.
- No E2E tests — unacceptable given that order completion atomicity and inventory
  accuracy are non-negotiable per the constitution.

---

## Decision 8: Batch prep deduction calculation location

**Decision**: PostgreSQL function (`prepare_batch`) invoked via Supabase RPC

**Rationale**: Batch preparation must atomically deduct multiple ingredients
and increment prepared stock. Same reasoning as order completion atomicity —
application-level sequential mutations have no rollback guarantee. A single DB
function wrapping all writes in a transaction is required.

**Alternatives considered**:

- Server Action with sequential Supabase writes — no atomicity; a crash
  mid-deduction would leave stock in a corrupt state without a recovery path.

---

## Resolved: No NEEDS CLARIFICATION markers remain

All technical decisions are resolved. The plan is ready for Phase 1 design.
