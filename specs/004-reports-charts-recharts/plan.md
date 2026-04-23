# Implementation Plan: Reports Charts with Recharts (MVP 5)

**Branch**: `22-feat-mvp-5-reports-charts-with-recharts` | **Date**: 2026-04-23 | **Spec**: [spec.md](spec.md)
**Issue**: [#22](https://github.com/knnthdmyo/mini-pos/issues/22)

## Summary

Add three interactive Recharts bar charts to the existing Reports page: Sales Over Time (grouped by configurable granularity), Sales By Product, and Peak Times (hourly). All charts share a unified filter bar (date presets + custom range, metric toggle, granularity, product pill chips). Charts are stacked vertically above the existing ProfitSummary and TransactionTable. Profit calculation is updated to use `product_costings.cost_per_item × quantity` for accuracy. No new DB migrations needed — all aggregation runs in TypeScript on the server.

## Technical Context

**Language/Version**: TypeScript 5.x (Next.js 14 App Router)
**Primary Dependencies**: Next.js 14, Supabase JS (@supabase/ssr), Tailwind CSS 3.x, React 18, Recharts (new)
**Testing**: Manual acceptance testing
**Target Platform**: Web — mobile-first tablet (single-device POS)
**Performance Goals**: Charts render within 1s for typical dataset sizes (hundreds of orders)
**Constraints**: Mobile-first (pb-20), Tailwind utility classes only, mutations/queries via Server Actions with `requireAuth()`, no new migrations
**Scale**: Single user per store, data size small enough for TypeScript aggregation on server

## Constitution Check (Pre-Design)

- [x] **I. Speed First** — Charts are read-only analytics; zero impact on POS order creation flow. Existing TransactionTable + ProfitSummary preserved.
- [x] **II. Simplicity Over Completeness** — Only charting, filtering, and profit correction. No drill-down, no real-time, no export changes for MVP.
- [x] **III. Accuracy in Inventory & Profit** — Profit calculation upgraded to use `product_costings.cost_per_item`, which is more accurate than ingredient deduction logs.
- [x] **IV. Human-Error Tolerant** — Filters default to "Today / Sales / Hourly / All products" — immediately useful on page load.
- [x] **V. Single-Device Optimized** — Mobile-first, `ResponsiveContainer`, bottom nav clearance.
- [x] **VI. Scope** — Reports charts explicitly requested in Issue #22.

## Project Structure

### Documentation (this feature)

```text
specs/004-reports-charts-recharts/
├── plan.md              # This file
├── spec.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── server-actions.md
├── checklists/
│   └── requirements.md
└── tasks.md
```

### Source Code Changes

```text
app/
└── (dashboard)/
    └── reports/
        └── page.tsx            # REWRITE — client component with full filter state

components/
└── reports/
    ├── ReportFilters.tsx        # NEW — filter bar (date presets, metric, granularity, product pills)
    ├── SalesOverTimeChart.tsx   # NEW — Chart 1: sales over time bar chart
    ├── SalesByProductChart.tsx  # NEW — Chart 2: sales by product bar chart
    ├── PeakTimesChart.tsx       # NEW — Chart 3: peak times hourly bar chart
    ├── ProfitSummary.tsx        # UNCHANGED
    └── TransactionTable.tsx     # UNCHANGED

lib/
└── actions/
    └── reports.ts               # MODIFY — add getChartData, update getReport signature

app/
└── api/
    └── reports/
        └── export/
            └── route.ts         # MODIFY — update to use new getReport signature

package.json                     # MODIFY — add recharts dependency
```

## Phase 1: Setup & Data Layer

**Purpose**: Install recharts and build the server-side data layer before any UI work.

### Step 1.1 — Install recharts
```bash
npm install recharts
```

### Step 1.2 — Verify product_costings schema
Confirm `product_costings.cost_per_item` column exists and is queryable via Supabase JS — check `018_costing_tables.sql` ✅ (already confirmed).

### Step 1.3 — Add `getChartData` to `lib/actions/reports.ts`

New exported function `getChartData(filters)`. Fetches:
```typescript
supabase
  .from("orders")
  .select(`
    id, completed_at, created_at,
    order_items(
      quantity, unit_price, product_id,
      products(id, name),
      product_costings!inner(cost_per_item)  // LEFT JOIN via separate query or JS join
    )
  `)
  .eq("status", "completed")
  .gte("completed_at", startISO)
  .lte("completed_at", endISO)
```

Note: Supabase JS does not support LEFT JOINs across tables with different FK relations in a single select. Use two queries: one for orders+items+products, one for product_costings by product_id set, then merge in JS.

Aggregation functions:
- `bucketKey(date, granularity)` → string key
- `hourKey(date)` → zero-padded "00"–"23"
- `labelFromKey(key, granularity)` → display string

Returns `ChartData { salesOverTime, salesByProduct, peakTimes }`.

### Step 1.4 — Update `getReport` signature

Change `getReport(period: Period)` → `getReport({ start, end, productIds? })`.
Update cost calculation to use `product_costings.cost_per_item` (LEFT JOIN via two-query pattern).
Keep `ReportResult` shape unchanged to preserve ProfitSummary + TransactionTable contracts.

### Step 1.5 — Update export route

`app/api/reports/export/route.ts` — update `getReport` call to new signature.

### Step 1.6 — Add `listActiveProducts`

Check if exists in `lib/actions/products.ts`. If not, add to `lib/actions/reports.ts`.

---

## Phase 2: Filter Component

**Purpose**: Build the shared filter bar that all charts consume.

### Step 2.1 — Create `ReportFilters.tsx`

Props:
```typescript
interface ReportFiltersProps {
  metric: Metric;
  onMetricChange: (m: Metric) => void;
  datePreset: DatePreset;
  onDatePresetChange: (p: DatePreset) => void;
  customRange: DateRange;
  onCustomRangeChange: (r: DateRange) => void;
  granularity: Granularity;
  onGranularityChange: (g: Granularity) => void;
  selectedProductIds: string[];
  onProductIdsChange: (ids: string[]) => void;
  products: ProductOption[];
}
```

Layout (mobile-first):
- Row 1: Date preset buttons `[Today] [Yesterday] [Month] [Year] [Custom]`
- Row 1b (conditionally shown): two `<input type="date">` for custom range
- Row 2: Metric toggle `[Sales] [Profit] [Quantity]`
- Row 3: Granularity toggle `[Hourly] [Daily] [Weekly] [Monthly]` + label "Group by:"
- Row 4: Product pills — scrollable horizontal row of chips; "All" first

Styling: segmented control buttons using Tailwind (border, bg-white/selected state with bg-indigo-600 text-white).

---

## Phase 3: Chart Components

**Purpose**: Build the three Recharts bar chart components.

### Step 3.1 — `SalesOverTimeChart.tsx`

```typescript
interface SalesOverTimeChartProps {
  data: ChartPoint[];
  metric: Metric;
  loading: boolean;
}
```

- `<ResponsiveContainer width="100%" height={280}>`
- `<BarChart data={data}>`
- `<XAxis dataKey="label" tick={{ fontSize: 11 }} />`
- `<YAxis tickFormatter={(v) => metric === "quantity" ? v : formatCurrency(v)} />`
- `<Bar dataKey="value" fill="#6366f1" radius={[4,4,0,0]} />`
- `<Tooltip formatter={(v) => metric === "quantity" ? v : formatCurrency(v)} />`
- Loading: skeleton div (h-[280px] animate-pulse bg-gray-100 rounded)
- Empty: centered "No data for this period" text

### Step 3.2 — `SalesByProductChart.tsx`

```typescript
interface SalesByProductChartProps {
  data: ChartPoint[];
  metric: Metric;
  loading: boolean;
}
```

- Horizontal layout when `data.length > 6`: `layout="vertical"`, `<XAxis type="number">`, `<YAxis type="category" dataKey="label" width={110}>`
- Vertical layout otherwise: standard `<XAxis dataKey="label" />`
- Same Bar, Tooltip, ResponsiveContainer as Chart 1
- Height: 280px vertical, `Math.max(280, data.length * 36)` horizontal

### Step 3.3 — `PeakTimesChart.tsx`

```typescript
interface PeakTimesChartProps {
  data: ChartPoint[];  // always 24 entries (0–23)
  metric: Metric;
  peakBasis: PeakBasis;
  onPeakBasisChange: (b: PeakBasis) => void;
  loading: boolean;
}
```

- Chart header includes toggle: `[Order Placed] [Order Completed]`
- Always 24 X-axis buckets: `"12am"`, `"1am"`, …, `"11pm"`
- Bar fill with conditional color for current hour highlight
- Same pattern as Chart 1 otherwise

---

## Phase 4: Page Integration

**Purpose**: Wire all components together in the reports page.

### Step 4.1 — Rewrite `app/(dashboard)/reports/page.tsx`

```typescript
"use client";

// State
const [metric, setMetric] = useState<Metric>("sales");
const [datePreset, setDatePreset] = useState<DatePreset>("today");
const [customRange, setCustomRange] = useState<DateRange>({ start: new Date(), end: new Date() });
const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
const [granularity, setGranularity] = useState<Granularity>("hourly");
const [peakBasis, setPeakBasis] = useState<PeakBasis>("completed_at");

const [chartData, setChartData] = useState<ChartData | null>(null);
const [reportData, setReportData] = useState<ReportResult | null>(null);
const [products, setProducts] = useState<ProductOption[]>([]);
const [isPending, startTransition] = useTransition();

// Derive date range from preset
const dateRange = useMemo(() => deriveDateRange(datePreset, customRange), [datePreset, customRange]);

// Fetch products on mount (for filter chips)
useEffect(() => {
  listActiveProducts().then(setProducts);
}, []);

// Fetch chart + report data when filters change
useEffect(() => {
  startTransition(async () => {
    const [charts, report] = await Promise.all([
      getChartData({ ...dateRange, metric, granularity, peakBasis, productIds: selectedProductIds }),
      getReport({ ...dateRange, productIds: selectedProductIds }),
    ]);
    setChartData(charts);
    setReportData(report);
  });
}, [dateRange, metric, granularity, peakBasis, selectedProductIds]);
```

Layout:
```jsx
<div className="p-4 pb-20 space-y-6">
  <h1 className="text-xl font-bold">Reports</h1>
  <ReportFilters {...filterProps} products={products} />
  <SalesOverTimeChart data={chartData?.salesOverTime ?? []} metric={metric} loading={isPending} />
  <SalesByProductChart data={chartData?.salesByProduct ?? []} metric={metric} loading={isPending} />
  <PeakTimesChart data={chartData?.peakTimes ?? []} metric={metric} peakBasis={peakBasis} onPeakBasisChange={setPeakBasis} loading={isPending} />
  {reportData && <ProfitSummary revenue={reportData.revenue} cost={reportData.cost} profit={reportData.profit} />}
  {reportData && <TransactionTable transactions={reportData.transactions} />}
</div>
```

---

## speckit.analyze — Issues Found & Resolutions

### A1: `getReport` Breaking Change — Export Route Must Be Updated

**Issue**: `app/api/reports/export/route.ts` calls `getReport(period)` with the old `Period` string type. Changing the signature will break the export endpoint.

**Resolution**: Update `app/api/reports/export/route.ts` to pass `{ start, end }` using the same `deriveDateRange` helper. Update period extraction from query params to derive a date range. ✅ Covered in Phase 1 Step 1.5.

### A2: Supabase JS Cannot LEFT JOIN `product_costings` in a Single Select

**Issue**: The Supabase JS client resolves joins through FK relationships. `product_costings` has a FK from `product_costings.product_id → products.id` — this is accessible from `order_items` via `products.product_costings`, but only as an `!inner` join by default. Using a regular join would filter out items with no costing record.

**Resolution**: Use two queries: (1) fetch orders + items + product names, (2) fetch `product_costings` for all product IDs found in query 1. Merge in TypeScript: build a `Map<productId, cost_per_item>` and look up during aggregation. ✅ Documented in Plan Step 1.3.

### A3: `peakTimes` Must Always Return All 24 Hours (Zero-Filled)

**Issue**: If hours with no orders are missing from the array, Recharts will render gaps or misalign X-axis ticks.

**Resolution**: Initialize all 24 hour buckets to 0 before aggregating. Always return exactly 24 `ChartPoint` entries for `peakTimes`. ✅ Noted in contracts/server-actions.md.

### A4: `product_costings` is 1:1 with `products` (UNIQUE on `product_id`)

**Issue**: The migration confirms `UNIQUE` on `product_costings.product_id`, so there is exactly one costing record per product. No need to pick the "latest" record — just do a direct lookup by `product_id`.

**Resolution**: No special deduplication needed. Map<productId, cost_per_item> populated directly. ✅ No action needed.

### A5: Old `Period` Type Must Be Preserved for `getReport` or Removed Cleanly

**Issue**: `getReport` exported `Period` type is imported/used in the existing reports `page.tsx`. Removing it could cause unused import warnings or errors if any other file references it.

**Resolution**: Keep `Period` type exported for backward compatibility (it may be used in the export route). Update the export route to no longer use `Period`. After that, `Period` can be removed in a follow-up cleanup. For MVP 5, keep it exported but unused internally. ✅ Safe approach.

### A6: `useTransition` with `async` Functions

**Issue**: React 18's `startTransition` does not natively support async callbacks in all patterns. In Next.js 14, server actions in a `useTransition` callback work, but the `async` callback pattern needs care.

**Resolution**: Use the pattern `startTransition(() => { fetchData().then(setData); })` — the async work happens inside but is not awaited by the transition itself. Or use `React.startTransition` with a wrapper. In Next.js 14 with server actions, the recommended pattern is to call `startTransition` with a synchronous wrapper that kicks off the async work. ✅ Handled in page implementation.

### A7: Mobile X-Axis Tick Overlap

**Issue**: On small screens (375px), hourly or daily labels on the X-axis may overlap if there are many ticks.

**Resolution**: Set `interval="preserveStartEnd"` on `<XAxis>` and `tick={{ fontSize: 10 }}` to reduce overlap. For the hourly chart, show every other tick: `interval={1}`. ✅ Addressed in chart component implementation.
