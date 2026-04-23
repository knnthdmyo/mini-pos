# Quickstart: Reports Charts with Recharts (MVP 5)

**Feature**: 004-reports-charts-recharts
**Date**: 2026-04-23

## Prerequisites

- Node.js 18+
- Existing Supabase project (no new migrations needed)
- All prior MVP migrations applied (through latest)

## Setup Steps

### 1. Install recharts

```bash
npm install recharts
```

### 2. No Database Migrations Needed

All required tables already exist:
- `orders`, `order_items`, `products` — from `001_initial_schema.sql`
- `product_costings` — from `018_costing_tables.sql`
- `product_variants` — from `019_product_variants.sql`

### 3. Run Development Server

```bash
npm run dev
```

Navigate to `/reports` to see the updated page.

## Verifying the Feature

1. Go to `/reports`
2. Confirm three bar charts render above ProfitSummary and TransactionTable
3. Select "Today" preset → verify hourly bars appear
4. Switch metric from "Sales" to "Quantity" → verify all 3 charts update
5. Toggle a product chip → verify all 3 charts filter
6. Select "Custom" → enter start/end dates → verify charts update
7. In Peak Times, toggle "Order Placed" / "Order Completed" → verify chart changes
