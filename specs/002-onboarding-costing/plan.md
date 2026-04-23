# Implementation Plan: Onboarding & Costing System

**Branch**: `002-onboarding-costing` | **Date**: 2026-04-23 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/002-onboarding-costing/spec.md`

## Summary

Enable accurate product costing and pricing by reusing the existing
`ingredients` table as the materials source, adding a costing builder
per product that computes batch cost → per-item cost → SRP, and
integrating the saved SRP into the POS product price. A first-login
onboarding modal guides new admins to enter their first materials. All
computations happen client-side for speed; only the final costing
snapshot is persisted.

## Technical Context

**Language/Version**: TypeScript 5.x (Next.js 14 App Router)
**Primary Dependencies**: Next.js 14, Supabase (Postgres + Auth + SSR),
Tailwind CSS, React 18
**Storage**: Supabase PostgreSQL (existing instance)
**Testing**: Manual testing (no test framework configured in MVP)
**Target Platform**: Web (mobile-first, single-tablet optimized)
**Project Type**: Web application (Next.js full-stack)
**Performance Goals**: All computed values update within 200ms of input
change (client-side computation); server actions complete within 1s
**Constraints**: Single-device; admin-only for costing; POS remains
untouched in speed; no offline support
**Scale/Scope**: Single-user admin, ~10-50 products, ~20-100 materials

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

- [x] **I. Speed First** — Costing is admin-only; POS order creation is
      untouched. Zero extra taps added to POS flow.
- [x] **II. Simplicity Over Completeness** — Feature directly serves Core
      Purpose (accurate profit visibility via costing). Only essential
      costing features included; no supplier management or history.
- [x] **III. Accuracy in Inventory & Profit** — Inventory deduction logic
      is unchanged. Costing adds a structured cost source but does not
      alter the deduction-on-completion flow.
- [x] **IV. Human-Error Tolerant** — All costing values are editable.
      SRP is overridable. Material deletion warns when referenced.
      No blocking on bad state.
- [x] **V. Single-Device Optimized** — Costing is a single-admin
      workflow. No multi-device coordination needed.
- [x] **VI. Accuracy Over Speed (Admin Only)** — All calculations are
      explicit: cost_per_unit = total_cost / quantity, row_total =
      qty × cost_per_unit, etc. No hidden formulas.
- [x] **VII. Separation of Concerns** — Costing lives in separate pages
      (`/materials`, `/costing`). POS only reads the final `price` from
      the products table. No costing logic in POS code paths.
- [x] **VIII. Batch-Based Thinking** — All costing computed at batch
      level with yield. cost_per_item derived from batch total / yield.
- [x] **IX. Editable System** — SRP is a suggestion that can be manually
      overridden. Overhead, labor, and other costs are all editable.
- [x] **X. Transparency** — Costing builder displays full breakdown:
      material rows, overhead, labor, other, total production cost,
      yield, cost per item, margin, SRP, net profit, batch profit.
- [x] **Scope** — All features are in MVP2 Included list: first-login
      onboarding, material cost input, costing builder, SRP suggestion.
      No excluded features (supplier mgmt, multi-location, historical
      price tracking) are being built.
- [x] **Data Integrity** — Material cost_per_unit is source of truth
      for costing. Costing snapshots saved per product. Edits do not
      retroactively affect past orders (order_items.unit_price is the
      historical snapshot).
- [x] **Evolution Rule** — No POS slowdown (separate pages), no extra
      taps in POS, no inventory accuracy regression (deduction logic
      unchanged), costing traceability maintained.

_GATE RESULT: PASS — all checks satisfied. No violations._

## Project Structure

### Documentation (this feature)

```text
specs/002-onboarding-costing/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   ├── server-actions.md
│   └── realtime-channels.md
└── tasks.md             # Phase 2 output (speckit.tasks)
```

### Source Code (repository root)

```text
app/
├── (dashboard)/
│   ├── layout.tsx              # Add /materials and /costing nav items
│   ├── materials/
│   │   └── page.tsx            # Materials management page (server)
│   └── costing/
│       └── page.tsx            # Costing builder page (server)

components/
├── materials/
│   ├── OnboardingModal.tsx     # First-login onboarding flow
│   ├── MaterialForm.tsx        # Add/edit material form
│   └── MaterialsTable.tsx      # Materials list table
├── costing/
│   ├── CostingBuilder.tsx      # Main costing builder (client)
│   ├── MaterialRowEditor.tsx   # Single material row in costing
│   ├── CostSummaryCard.tsx     # Summary cards (totals, SRP, profit)
│   └── ProductCostingList.tsx  # List of products for costing

lib/
├── actions/
│   ├── materials.ts            # Server actions for materials CRUD
│   └── costing.ts              # Server actions for costing CRUD

supabase/
└── migrations/
    └── 018_costing_tables.sql  # New tables: product_costings,
                                # costing_material_rows
```

**Structure Decision**: Next.js App Router with server pages + client
components. Follows existing patterns: server pages fetch data, client
components handle interactivity. New routes under `(dashboard)/` group.
New server actions in `lib/actions/`. New migration for costing tables.

## Complexity Tracking

_No Constitution Check violations. Table not applicable._
