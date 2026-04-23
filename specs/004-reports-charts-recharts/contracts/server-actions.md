# Server Action Contracts: Reports Charts with Recharts (MVP 5)

**Feature**: 004-reports-charts-recharts
**File**: `lib/actions/reports.ts`
**Date**: 2026-04-23

All actions follow project convention: `"use server"` directive, `requireAuth()` as first call, Supabase server client for DB operations.

---

## `getChartData`

Fetch and aggregate data for all three charts.

**Signature**:

```typescript
export async function getChartData(filters: {
  start: Date;
  end: Date;
  metric: "sales" | "profit" | "quantity";
  granularity: "hourly" | "daily" | "weekly" | "monthly";
  peakBasis: "created_at" | "completed_at";
  productIds?: string[]; // undefined or empty = all products
}): Promise<ChartData>;
```

**Return type**:

```typescript
interface ChartPoint {
  label: string;
  value: number;
}

interface ChartData {
  salesOverTime: ChartPoint[];
  salesByProduct: ChartPoint[];
  peakTimes: ChartPoint[];
}
```

**Behavior**:

1. Call `requireAuth()`
2. Query `orders` with `status = 'completed'`, `completed_at BETWEEN start AND end`
3. For each order, join `order_items → products, product_costings` (LEFT JOIN)
4. If `productIds` non-empty, filter `order_items` to only matching `product_id`
5. For each order item, compute `itemValue`:
   - `"sales"`: `unit_price × quantity`
   - `"profit"`: `(unit_price − costing?.cost_per_item ?? 0) × quantity`
   - `"quantity"`: `quantity`
6. Aggregate `salesOverTime`: group by time bucket key derived from `order.completed_at` + `granularity`
7. Aggregate `salesByProduct`: group by `product.name`
8. Aggregate `peakTimes`: group by hour of `order[peakBasis]` (0–23)
9. Return sorted arrays with human-readable labels

**Errors**:

| Error | Condition |
|-------|-----------|
| `UNAUTHORIZED` | No valid session |

**Notes**:
- `salesOverTime` sorted by chronological bucket key
- `salesByProduct` sorted descending by `value`
- `peakTimes` is always all 24 hours (0–23), zero-filled for hours with no data

---

## `getReport` (updated signature)

Fetch summary totals and transaction list for a date range. **Signature updated** from `period: Period` to `{ start, end, productIds? }` to align with chart filter state.

**Signature**:

```typescript
export async function getReport(filters: {
  start: Date;
  end: Date;
  productIds?: string[];
}): Promise<ReportResult>;
```

**Return type** (unchanged):

```typescript
interface ReportResult {
  revenue: number;
  cost: number;
  profit: number;
  startDate: string;
  endDate: string;
  transactions: TransactionRow[];
}
```

**Behavior** (updated):

1. Call `requireAuth()`
2. Query `orders` with `status = 'completed'`, `completed_at BETWEEN start AND end`
3. If `productIds` non-empty: filter to orders that contain at least one matching order_item
4. **Cost calculation updated**: `cost = SUM((cost_per_item ?? 0) × quantity)` per order item via LEFT JOIN on `product_costings` — replaces the old ingredient deduction log approach
5. All other behavior unchanged (transactions list, order numbering, etc.)

**Breaking change notice**: The old `period: Period` parameter is removed. Callers (`app/(dashboard)/reports/page.tsx`, `app/api/reports/export/route.ts`) must be updated.

---

## `listActiveProducts`

Fetch all active products for the product filter pill chips.

**Signature**:

```typescript
export async function listActiveProducts(): Promise<ProductOption[]>;
```

**Return type**:

```typescript
interface ProductOption {
  id: string;
  name: string;
}
```

**Behavior**:

1. Call `requireAuth()`
2. Query `products` where `is_active = true`, ordered by `name ASC`
3. Return `{ id, name }` array

**Notes**: This action may already exist in `lib/actions/products.ts` — reuse if available, otherwise add to `lib/actions/reports.ts`.
