# Quickstart: Onboarding & Costing System

**Branch**: `002-onboarding-costing` | **Date**: 2026-04-23

## Prerequisites

- Node.js 18+
- Supabase CLI installed (`supabase` command available)
- Local Supabase instance running (`supabase start`)
- Existing MVP1 tables seeded (products, ingredients, recipes, etc.)

## Setup Steps

### 1. Apply the costing migration

```bash
supabase db push
# Or apply manually:
supabase migration up
```

This creates:
- `product_costings` table
- `costing_material_rows` table
- RLS policies for authenticated users
- Index on `costing_material_rows.costing_id`

### 2. Verify tables exist

```bash
supabase db inspect
# Or connect to the database and check:
# \dt product_costings
# \dt costing_material_rows
```

### 3. Start the dev server

```bash
npm run dev
```

### 4. Test the onboarding flow

1. Clear all ingredients from the database (to simulate first login):
   ```sql
   delete from ingredients;
   ```
2. Log in to the dashboard
3. The onboarding modal should appear automatically
4. Add a material (e.g., Sugar, kg, 25, ₱500)
5. Verify it appears in the ingredients/materials table

### 5. Test the costing builder

1. Ensure at least one product exists (from seed data)
2. Navigate to `/costing`
3. Select a product
4. Add material rows, set overhead/labor/yield
5. Verify all computed values update in real-time
6. Save the costing
7. Verify `products.price` was updated to the SRP
8. Navigate to `/pos` and confirm the product shows the new price

## Validation Checklist

- [ ] Onboarding modal appears when no ingredients exist
- [ ] Materials can be added, edited, and deleted
- [ ] Costing builder computes row totals correctly
- [ ] Total production cost = material + overhead + labor + other
- [ ] Cost per item = total production cost / yield
- [ ] SRP = cost per item × (1 + margin / 100)
- [ ] SRP is editable (manual override)
- [ ] Saved costing updates products.price
- [ ] POS shows updated price
- [ ] Editing a costing does not affect past orders
- [ ] Deleting an ingredient used in a costing shows a warning
