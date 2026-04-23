# Implementation Plan: POS & Inventory System (MVP)

**Branch**: `001-pos-inventory-mvp` | **Date**: 2026-04-20 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/001-pos-inventory-mvp/spec.md`

## Summary

A single-tablet POS and inventory management system for a candy/shake business.
Staff can create and place orders in under 5 seconds using a product tap grid.
Completed orders drive inventory deduction (prepared stock or ingredient recipe)
and revenue recording. A live queue prevents missed orders. Batch preparation
restocks prepared items by deducting ingredients. Daily/weekly/monthly reports
surface profit. Low stock email alerts notify the operator before stockouts.

**Tech approach**: Next.js App Router with Supabase (PostgreSQL + Auth + Realtime),
deployed on Vercel. Mutations use Next.js Server Actions. The queue uses Supabase
Realtime for instant updates without polling.

## Technical Context

**Language/Version**: TypeScript 5.x / Node.js 20 LTS (via Next.js runtime)
**Primary Dependencies**: Next.js 14 (App Router), Supabase JS v2, Tailwind CSS v3,
SendGrid (transactional email for low stock alerts)
**Storage**: Supabase — PostgreSQL 15 (primary data store), Supabase Auth (sessions),
Supabase Realtime (queue live updates)
**Testing**: Vitest (unit/logic), Playwright (end-to-end critical flows)
**Target Platform**: Tablet web browser (Chrome/Safari); hosted on Vercel
**Project Type**: Web application (single Next.js project)
**Performance Goals**: Order creation < 5 seconds (SC-001); queue update < 1 second
after order placement (SC-002)
**Constraints**: Single device, single concurrent user, internet-required,
no offline support in MVP
**Scale/Scope**: 1 operator, ~10–50 products, ~50–200 orders/day typical

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

Validate the feature against each principle from `.specify/memory/constitution.md`:

- [x] **I. Speed First** — POS is a product tap grid + cart + single Place Order
      button. No multi-step flows. Server Actions execute mutations server-side
      without round-trip latency. Order creation target: < 5 seconds.
- [x] **II. Simplicity Over Completeness** — All 8 features (POS, Queue, Inventory,
      Batch Prep, Reporting, Alerts, Auth, Error Handling) map directly to the three
      Core Purpose goals. No features outside MVP scope are included.
- [x] **III. Accuracy in Inventory & Profit** — Inventory deduction is triggered
      exclusively on order completion via an atomic DB operation. Cost is read from
      `inventory_logs` valued at `cost_per_unit` at time of deduction. Revenue is
      sourced from completed orders only.
- [x] **IV. Human-Error Tolerant** — Completed orders remain editable; delta
      recomputation is re-logged. Negative stock is permitted and flagged but never
      blocks operations. Manual stock adjustments are always available.
- [x] **V. Single-Device Optimized** — Supabase Realtime updates the queue on the
      same device without requiring multi-user sync. No multi-device coordination
      dependency exists in the design.
- [x] **Scope** — All planned features are in the MVP Included list. SendGrid for
      alerts is an integration detail, not a new feature. Vercel deployment is
      infrastructure, not scope expansion.
- [x] **Data Integrity** — All inventory deductions are written to `inventory_logs`
      with source type and source ID. All manual adjustments are logged. Order
      completion is atomic (single DB transaction).
- [x] **Evolution Rule** — Future features (multi-payment, discounts, multi-device)
      are explicitly excluded and can be added without modifying the POS tap flow or
      the inventory deduction logic.

## Project Structure

### Documentation (this feature)

```text
specs/001-pos-inventory-mvp/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
│   ├── server-actions.md
│   └── realtime-channels.md
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

```text
app/
├── (auth)/
│   └── login/
│       └── page.tsx
├── (dashboard)/
│   ├── layout.tsx          # Protected layout — auth guard
│   ├── pos/
│   │   └── page.tsx        # POS screen (product grid + cart)
│   ├── queue/
│   │   └── page.tsx        # Live order queue
│   ├── inventory/
│   │   └── page.tsx        # Ingredient list + manual adjustment
│   ├── batch/
│   │   └── page.tsx        # Batch preparation UI
│   └── reports/
│       └── page.tsx        # Revenue / cost / profit reports
├── layout.tsx
└── globals.css

components/
├── pos/
│   ├── ProductGrid.tsx
│   ├── CartSummary.tsx
│   └── PlaceOrderButton.tsx
├── queue/
│   ├── OrderCard.tsx
│   └── QueueList.tsx
├── inventory/
│   ├── IngredientRow.tsx
│   └── StockAdjustForm.tsx
├── batch/
│   └── BatchPrepForm.tsx
├── reports/
│   └── ProfitSummary.tsx
└── ui/
    ├── Button.tsx
    └── Badge.tsx

lib/
├── supabase/
│   ├── client.ts           # Browser Supabase client
│   └── server.ts           # Server Supabase client (for Server Actions)
├── actions/
│   ├── orders.ts           # placeOrder, completeOrder, editOrder
│   ├── inventory.ts        # adjustStock
│   ├── batch.ts            # prepareBatch
│   └── reports.ts          # getReport
└── utils/
    └── inventory.ts        # deduction logic helpers

supabase/
├── migrations/             # SQL migration files
└── functions/              # Edge Functions (low-stock email trigger)
```

**Structure Decision**: Single Next.js project (App Router). No separate backend
service — Server Actions handle all mutations. Supabase handles DB, Auth, and
Realtime. Supabase Edge Function handles SendGrid email trigger on low-stock
changes to decouple alert delivery from the request/response cycle.

## Complexity Tracking

> No Constitution Check violations. No complexity exceptions required.
