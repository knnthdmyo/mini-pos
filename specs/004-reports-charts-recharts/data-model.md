# Data Model: Reports Charts with Recharts (MVP 5)

**Feature**: 004-reports-charts-recharts
**Date**: 2026-04-23

## No New Tables Required

This feature adds no new database tables. All data is sourced from existing tables:

| Table | Usage |
|-------|-------|
| `orders` | Filter by `status = 'completed'`, `completed_at`, `created_at` |
| `order_items` | `quantity`, `unit_price`, `product_id`, `variant_id` |
| `products` | `id`, `name` — for chart labels and product filter chips |
| `product_costings` | `product_id`, `cost_per_item` — for profit calculation (LEFT JOIN) |

## TypeScript Data Types

### Filter State (page-level)

```typescript
type Metric = "sales" | "profit" | "quantity";
type DatePreset = "today" | "yesterday" | "month" | "year" | "custom";
type Granularity = "hourly" | "daily" | "weekly" | "monthly";
type PeakBasis = "created_at" | "completed_at";

interface DateRange {
  start: Date;
  end: Date;
}

interface ReportFilters {
  metric: Metric;
  datePreset: DatePreset;
  customRange: DateRange;
  selectedProductIds: string[]; // empty = all products
  granularity: Granularity;
  peakBasis: PeakBasis;
}
```

### Chart Data Types (output of `getChartData`)

```typescript
interface ChartPoint {
  label: string;  // X-axis label (formatted time bucket / product name / hour)
  value: number;  // Y-axis value (sales amount / profit / quantity count)
}

interface ChartData {
  salesOverTime: ChartPoint[];
  salesByProduct: ChartPoint[];
  peakTimes: ChartPoint[];
}
```

### Product List (for filter chips)

```typescript
interface ProductOption {
  id: string;
  name: string;
}
```

## Profit Calculation

Profit is computed per order item and summed:

```
profit_per_item = (unit_price − cost_per_item) × quantity
```

Where:
- `unit_price` comes from `order_items.unit_price`
- `cost_per_item` comes from `product_costings.cost_per_item` LEFT JOIN on `product_id`
- If no `product_costings` row exists for a product → `cost_per_item = 0` (conservative: full revenue counted as profit)

## Time Bucket Keys

For Chart 1 (Sales Over Time), each order item contributes to a time bucket keyed by:

| Granularity | Key Format | Example |
|-------------|-----------|---------|
| Hourly | `"HH"` (zero-padded hour, 00–23) | `"14"` |
| Daily | `"YYYY-MM-DD"` | `"2026-04-01"` |
| Weekly | `"YYYY-WW"` (ISO week number) | `"2026-14"` |
| Monthly | `"YYYY-MM"` | `"2026-04"` |

All timestamps use the browser's local timezone via `Date` methods (consistent with existing `getReport` behavior).

## Hour Bucket Keys

For Chart 3 (Peak Times), keys are `"00"` through `"23"` (zero-padded hour), derived from either `order.created_at` or `order.completed_at` depending on `peakBasis`.

Display labels: `"12am"`, `"1am"`, ..., `"12pm"`, `"1pm"`, ..., `"11pm"`.
