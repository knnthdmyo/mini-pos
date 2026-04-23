# Tasks: Reports Charts with Recharts (MVP 5)

**Input**: Design documents from `/specs/004-reports-charts-recharts/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/server-actions.md, quickstart.md
**Tests**: Not requested — manual acceptance testing only.
**Organization**: Tasks grouped by phase. [P] = can run in parallel.

## Format: `[ID] [P?] [Story] Description`

---

## Phase 1: Setup & Data Layer

**Purpose**: Install recharts and build the server-side data functions before any UI.

- [ ] T001 Install `recharts` package — run `npm install recharts` and verify in `package.json`
- [ ] T002 [P] Add helper functions in `lib/actions/reports.ts`:
  - `deriveDateRange(preset, customRange)` → `{ start: Date, end: Date }`
  - `bucketKey(date, granularity)` → string key
  - `labelFromKey(key, granularity)` → human-readable string
  - `hourLabel(hour)` → "12am", "1am", ..., "11pm"
- [ ] T003 [P] Add exported types to `lib/actions/reports.ts`:
  - `Metric`, `DatePreset`, `Granularity`, `PeakBasis`, `DateRange`, `ChartPoint`, `ChartData`, `ProductOption`, `ReportFilters`
- [ ] T004 Add `getChartData(filters)` server action to `lib/actions/reports.ts` (depends on T002, T003):
  - Query 1: fetch completed orders + order_items + products in date range (with optional productIds filter)
  - Query 2: fetch `product_costings` for all product IDs from Query 1
  - Merge: build `Map<productId, cost_per_item>`, aggregate `salesOverTime`, `salesByProduct`, `peakTimes`
  - `peakTimes` always returns 24 entries (zero-filled)
  - Return `ChartData`
- [ ] T005 Update `getReport` signature in `lib/actions/reports.ts` from `getReport(period: Period)` to `getReport({ start, end, productIds? })` (depends on T002, T003):
  - Update cost calculation to use `product_costings.cost_per_item` via two-query pattern
  - Keep `ReportResult` shape unchanged
- [ ] T006 [P] Check `lib/actions/products.ts` for existing `listActiveProducts` or similar — add `listActiveProducts(): Promise<ProductOption[]>` to `lib/actions/reports.ts` if not already available
- [ ] T007 Update `app/api/reports/export/route.ts` — update `getReport` call to new `{ start, end }` signature using `deriveDateRange` helper (depends on T005)

---

## Phase 2: Filter Component

**Purpose**: Build the shared filter bar.

- [ ] T008 Create `components/reports/ReportFilters.tsx` (depends on T003):
  - Props: metric, onMetricChange, datePreset, onDatePresetChange, customRange, onCustomRangeChange, granularity, onGranularityChange, selectedProductIds, onProductIdsChange, products
  - Row 1: date preset buttons (Today / Yesterday / Month / Year / Custom)
  - Row 1b: conditional two `<input type="date">` fields when preset is "custom"
  - Row 2: metric toggle (Sales / Profit / Quantity)
  - Row 3: granularity toggle labeled "Group by:" (Hourly / Daily / Weekly / Monthly)
  - Row 4: horizontally scrollable product pill chips; "All" chip first
  - Active state: `bg-indigo-600 text-white`, inactive: `bg-white border border-gray-300 text-gray-700`

---

## Phase 3: Chart Components

**Purpose**: Build the three chart components. All can be built in parallel.

- [ ] T009 [P] Create `components/reports/SalesOverTimeChart.tsx` (depends on T003):
  - Props: `data: ChartPoint[]`, `metric: Metric`, `loading: boolean`
  - `<ResponsiveContainer width="100%" height={280}>`
  - `<BarChart>` with `<Bar fill="#6366f1" radius={[4,4,0,0]}>`, `<XAxis interval={1} tick={{ fontSize: 10 }}>`, `<YAxis tickFormatter>`, `<CartesianGrid strokeDasharray="3 3">`, `<Tooltip>`
  - Loading: `<div className="h-[280px] animate-pulse bg-gray-100 rounded-lg" />`
  - Empty: `<div className="h-[280px] flex items-center justify-center text-gray-400 text-sm">No data for this period</div>`
  - Section heading: "Sales Over Time"

- [ ] T010 [P] Create `components/reports/SalesByProductChart.tsx` (depends on T003):
  - Props: `data: ChartPoint[]`, `metric: Metric`, `loading: boolean`
  - Vertical layout (default): `<XAxis dataKey="label" tick={{ fontSize: 10 }}>`, height 280
  - Horizontal layout when `data.length > 6`: `layout="vertical"`, `<YAxis type="category" dataKey="label" width={110}>`, `<XAxis type="number">`, height `Math.max(280, data.length * 36)`
  - Same loading/empty states as T009
  - Section heading: "Sales by Product"

- [ ] T011 [P] Create `components/reports/PeakTimesChart.tsx` (depends on T003):
  - Props: `data: ChartPoint[]`, `metric: Metric`, `peakBasis: PeakBasis`, `onPeakBasisChange`, `loading: boolean`
  - Chart header includes toggle: `[Order Placed] [Order Completed]` (passes `peakBasis` + handler up)
  - Always 24 bars (hours "12am"–"11pm")
  - `interval={1}` on XAxis to show alternate ticks and avoid overlap
  - Same bar style, loading/empty states as T009
  - Section heading: "Peak Times"

---

## Phase 4: Page Integration

**Purpose**: Wire all components together. Depends on all of Phase 1–3.

- [ ] T012 Rewrite `app/(dashboard)/reports/page.tsx` (depends on T004–T011):
  - `"use client"` directive
  - State: `metric`, `datePreset`, `customRange`, `selectedProductIds`, `granularity`, `peakBasis`, `chartData`, `reportData`, `products`
  - `useTransition` for loading state
  - `useEffect` on mount: call `listActiveProducts()` → set `products`
  - `useEffect` on filter change: call `getChartData` + `getReport` in parallel → set state
  - `deriveDateRange` used to compute `dateRange` from `datePreset` + `customRange`
  - Layout (full page, `p-4 pb-20 space-y-6`):
    ```
    <h1>Reports</h1>
    <ReportFilters />
    <SalesOverTimeChart />
    <SalesByProductChart />
    <PeakTimesChart />
    <ProfitSummary /> (when reportData ready)
    <TransactionTable /> (when reportData ready)
    ```
  - Remove old period selector and export button from top of page (export button can remain if wired to updated export route)

---

## Phase 5: Verification

- [ ] T013 Run `npx tsc --noEmit` — fix any TypeScript errors (depends on T012)
- [ ] T014 Manual test: navigate to /reports, verify all 3 charts render with "Today" preset
- [ ] T015 Manual test: switch metric → verify all 3 charts update
- [ ] T016 Manual test: select product chips → verify filtering
- [ ] T017 Manual test: switch granularity → verify Chart 1 X-axis changes
- [ ] T018 Manual test: toggle Peak Times basis → verify Chart 3 changes
- [ ] T019 Manual test: select Custom date range → verify all charts update
- [ ] T020 Manual test: verify ProfitSummary + TransactionTable still work correctly
