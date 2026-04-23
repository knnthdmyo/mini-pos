-- 007_ingredients_schema_fix.sql
-- Adds missing columns to ingredients table.

alter table public.ingredients
  add column if not exists unit                text,
  add column if not exists low_stock_threshold numeric(12,4);
