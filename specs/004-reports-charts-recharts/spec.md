# Feature Specification: Reports Charts with Recharts (MVP 5)

**Feature Branch**: `22-feat-mvp-5-reports-charts-with-recharts`
**Created**: 2026-04-23
**Status**: Draft
**Input**: GitHub Issue #22 — "feat: MVP 5 — Reports charts with Recharts"

## User Scenarios & Testing _(mandatory)_

### User Story 1 — Sales Over Time Chart (Priority: P1)

A store owner wants to understand when their sales peak across different time frames. They open the Reports page and see a bar chart showing sales (or profit or quantity) grouped by time buckets. They can switch between presets (Today, Yesterday, Month, Year) or pick a custom date range, and toggle the granularity (Hourly, Daily, Weekly, Monthly) to zoom in or out.

**Why this priority**: This is the primary analytical tool. A store owner's core question is "how are my sales trending?" This chart answers it directly and must work end-to-end before any secondary charts matter.

**Independent Test**: Navigate to Reports, select "Today" with hourly granularity, verify bars appear for each hour that had completed orders.

**Acceptance Scenarios**:

1. **Given** the owner selects "Today" with hourly granularity, **When** the chart renders, **Then** X-axis shows hours 12am–11pm with bars only where completed orders exist.
2. **Given** the owner selects "Month" with daily granularity, **When** the chart renders, **Then** X-axis shows each day of the current month with correct daily totals.
3. **Given** the owner selects "Year" with monthly granularity, **When** the chart renders, **Then** X-axis shows Jan–Dec with monthly totals.
4. **Given** the owner selects "Custom" and fills in start/end dates, **When** the inputs are filled, **Then** the chart updates to reflect only orders in that range.
5. **Given** metric is "Profit", **When** the chart renders, **Then** Y-axis reflects `(unit_price − cost_per_item) × quantity`, using `product_costings.cost_per_item` (0 fallback if no record).

---

### User Story 2 — Sales by Product Chart (Priority: P1)

A store owner wants to know which products sell most. A bar chart shows product names on X, selected metric on Y, covering the same date range and filters.

**Why this priority**: "What's my best seller?" is the second most important business question. Shares filter state with US1.

**Independent Test**: Verify correct product names appear on X-axis with correct totals after orders are placed.

**Acceptance Scenarios**:

1. **Given** orders exist for multiple products, **When** the chart renders, **Then** each product with at least one completed order appears as a bar.
2. **Given** more than 6 distinct products appear, **When** the chart renders, **Then** bars are horizontal to keep labels readable.
3. **Given** product chips are selected, **When** the chart renders, **Then** only selected products appear.
4. **Given** "All" chip is active, **When** the chart renders, **Then** all products with data in range appear.

---

### User Story 3 — Peak Times Chart (Priority: P2)

A store owner wants to know which hours of the day are busiest. A chart shows the selected metric per hour of day (0–23), aggregated across the selected date range, with a toggle for created_at vs completed_at.

**Why this priority**: Useful operational insight for staffing/prep but does not block US1 or US2.

**Independent Test**: Place orders at different times, navigate to Reports, verify correct hours show activity.

**Acceptance Scenarios**:

1. **Given** orders exist across various hours, **When** Peak Times renders, **Then** hours 12am–11pm appear on X-axis with correct metric totals.
2. **Given** toggle is "Order Placed" (created_at), **When** chart renders, **Then** hours bucketed by creation time.
3. **Given** toggle is "Order Completed" (completed_at), **When** chart renders, **Then** hours bucketed by completion time.
4. **Given** metric is "Quantity", **When** Peak Times updates, **Then** Y-axis shows total quantity sold per hour.

---

### User Story 4 — Shared Filters & Product Pills (Priority: P1)

All three charts and existing ProfitSummary/TransactionTable share one filter bar. Changing any filter updates everything simultaneously.

**Why this priority**: Divergent chart states produce contradictory data — shared state is required for trust.

**Acceptance Scenarios**:

1. **Given** "Today" is selected, **When** owner switches to "Yesterday", **Then** all three charts and summary totals update simultaneously.
2. **Given** two product chips are selected, **When** charts render, **Then** all three charts show data for only those products.
3. **Given** "All" chip is clicked, **When** charts render, **Then** all product chips are deselected and all products with data appear.
4. **Given** metric changes from "Sales" to "Quantity", **When** charts render, **Then** all three Y-axes update accordingly.
5. **Given** "Custom" is selected and valid start/end dates entered, **When** dates change, **Then** all charts re-fetch for the custom range.

---

## Functional Requirements

| ID | Requirement |
|----|-------------|
| FR-001 | Three Recharts bar charts stacked vertically full-width: Sales Over Time, Sales By Product, Peak Times |
| FR-002 | Shared metric toggle: Sales / Profit / Quantity — affects Y-axis of all 3 charts |
| FR-003 | Date presets: Today, Yesterday, Month, Year — derives `{ start, end }` range |
| FR-004 | Custom date range: two date inputs revealed when "Custom" is active |
| FR-005 | Granularity toggle (Chart 1 only): Hourly / Daily / Weekly / Monthly |
| FR-006 | Product filter: pill/tag chips, multi-select; "All" chip deselects individuals; affects all 3 charts |
| FR-007 | Chart 1: X = time buckets per granularity; Y = metric |
| FR-008 | Chart 2: X = product names; Y = metric; horizontal layout when > 6 products |
| FR-009 | Chart 3: X = hours 0–23 as "12am"–"11pm"; Y = metric; created_at/completed_at toggle in chart header |
| FR-010 | Profit = `(unit_price − cost_per_item) × quantity` via product_costings; fallback 0 if no record |
| FR-011 | Existing ProfitSummary and TransactionTable preserved below charts, updated with same filters |
| FR-012 | All charts responsive via `<ResponsiveContainer width="100%" />` |
| FR-013 | Empty state message shown when no data for selected range/filters |
| FR-014 | Loading skeleton per chart while fetching |

---

## Non-Functional Requirements

| ID | Requirement |
|----|-------------|
| NFR-001 | Mobile-first layout; `pb-20` to clear bottom nav |
| NFR-002 | No new DB migrations — aggregation in TypeScript |
| NFR-003 | All data fetching via Server Actions with `requireAuth()` |
| NFR-004 | No TypeScript build errors |

---

## Out of Scope

- Chart export as image/PDF
- Side-by-side period comparison
- Real-time Realtime subscription updates
- Drill-down from bar to transaction list
- Custom chart color themes

---

## Success Criteria

| ID | Criterion |
|----|-----------|
| SC-001 | All 3 charts render with real DB data for every date preset |
| SC-002 | Switching any filter updates all charts simultaneously |
| SC-003 | Profit figures match `(unit_price − cost_per_item) × quantity` |
| SC-004 | `tsc --noEmit` passes |
| SC-005 | Charts readable on 375px wide mobile viewport |

---

## Assumptions & Dependencies

- `product_costings` table with `cost_per_item` exists (confirmed in `018_costing_tables.sql`)
- `products` table queryable for pill list
- `recharts` not yet installed — must be added to `package.json`
- `order_items` joins `products` and `product_variants` as in existing `getReport`
