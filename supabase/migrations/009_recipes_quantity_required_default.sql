-- 009_recipes_quantity_required_default.sql
-- The remote recipes table has a legacy `quantity_required` NOT NULL column.
-- Give it a default so application inserts (which use quantity_per_unit) don't fail.
-- Also backfill quantity_per_unit from quantity_required for any existing rows.

alter table public.recipes
  alter column quantity_required set default 0;

-- Backfill quantity_per_unit for any rows that still have 0 (default we set)
-- where quantity_required has the real value.
update public.recipes
set quantity_per_unit = quantity_required
where quantity_per_unit = 0 and quantity_required != 0;
