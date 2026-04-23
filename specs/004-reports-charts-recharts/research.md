# Research: Reports Charts with Recharts (MVP 5)

**Feature**: 004-reports-charts-recharts
**Date**: 2026-04-23

## R1: Recharts for React Bar Charts

**Decision**: Use Recharts as the charting library.

**Rationale**: Recharts is a React-native charting library built on D3, designed for declarative composition. It works naturally in Next.js App Router client components, is tree-shakeable, and its `<ResponsiveContainer>` handles mobile-first layouts out of the box. No additional polyfills or wrappers needed.

**Key components used**:
- `<BarChart>` / `<Bar>` — vertical and horizontal bar charts
- `<ResponsiveContainer width="100%" height={300}>` — responsive wrapper
- `<XAxis>`, `<YAxis>`, `<CartesianGrid>`, `<Tooltip>`, `<Legend>` — standard decorators
- `layout="vertical"` on `<BarChart>` for horizontal bar display (> 6 products)

**Alternatives considered**:
- **Chart.js + react-chartjs-2**: Imperative API, less idiomatic in React. Requires canvas refs. Heavier setup.
- **Victory**: Less maintained, smaller community.
- **Tremor**: Pre-styled charts with Tailwind, but opinionated design conflicts with project's custom Tailwind config.

## R2: Data Aggregation in TypeScript vs SQL Functions

**Decision**: Aggregate all chart data in TypeScript (Server Action), not in new SQL functions.

**Rationale**: The dataset size for a single-store POS is small (hundreds to low thousands of orders). TypeScript aggregation avoids new DB migrations (a project constraint — NFR-002). Server Actions run on the server, so aggregation doesn't add client-side compute. The existing `getReport` action already fetches order + item data — the new `getChartData` action follows the same pattern.

**Aggregation approach**:
- Fetch all completed orders + order_items + products + product_costings in the date range (with optional product filter)
- Group in TypeScript using `Map<string, number>` keyed by time bucket / product name / hour
- For Chart 1 granularity: use `Date.getHours()`, `toLocaleDateString()`, `getWeek()` helpers
- For Chart 3 peak times: group by `new Date(timestamp).getHours()`

## R3: Profit Calculation via product_costings

**Decision**: Use `product_costings.cost_per_item` for profit per order item.

**Rationale**: The `product_costings` table (migration `018_costing_tables.sql`) stores a computed `cost_per_item` per product, derived from ingredients + overhead + labor. This is more reliable than summing raw ingredient deductions (which only applies to recipe-based products and can be incomplete). Formula: `profit = (unit_price − cost_per_item) × quantity` per item. If no costing record exists (product was never costed), `cost_per_item` defaults to 0 — the system does not block reporting.

**Join pattern**: LEFT JOIN `product_costings` on `product_id` — keeps all order items even if no costing record.

## R4: Shared Filter State in a Client Component

**Decision**: Lift all filter state (metric, datePreset, customRange, selectedProductIds, granularity, peakBasis) to the reports page client component and pass down as props.

**Rationale**: Next.js App Router allows pages to be client components when they manage UI state. The reports page already imports client components (ProfitSummary is likely a client component). Lifting state to the page avoids prop drilling through a context — the filter state changes frequently (on every interaction) and is consumed by all children simultaneously. A React context would add unnecessary complexity for a single page.

**Data flow**:
- Page state → `getChartData(filters)` + `getReport(filters)` on state change
- Server Actions called inside `useTransition` to avoid blocking the UI
- `isPending` from `useTransition` drives per-chart loading states

## R5: X-Axis Label Formatting per Granularity

**Decision**: Format X-axis tick labels in the chart component based on the active granularity.

| Granularity | Key format | Display example |
|-------------|-----------|-----------------|
| Hourly      | `"HH"` (0-pad hour) | "2am", "3pm" |
| Daily       | `"YYYY-MM-DD"` | "Apr 1" |
| Weekly      | `"YYYY-WW"` (ISO week) | "Week 14" |
| Monthly     | `"YYYY-MM"` | "Apr 2026" |

All formatting done with plain `Date` methods (no date library) to avoid adding dependencies.

## R6: Horizontal Bar Chart for Many Products

**Decision**: Switch Chart 2 to `layout="vertical"` (horizontal bars) when > 6 products.

**Rationale**: When product names are long and there are many of them, vertical bars with names on the X-axis become unreadable on mobile. Recharts' `layout="vertical"` with `<XAxis type="number">` and `<YAxis type="category" dataKey="name" width={100}>` produces horizontal bars with names on the left.
