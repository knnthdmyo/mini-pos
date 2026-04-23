-- 007_products_schema_fix.sql
-- Adds missing columns to products and recipes tables that may exist
-- on the remote DB from a prior partial migration run.

alter table public.products
  add column if not exists price              numeric(10,2) not null default 0,
  add column if not exists has_prepared_stock boolean       not null default false,
  add column if not exists is_active          boolean       not null default true;

-- recipes may be missing quantity_per_unit if created by an older schema
alter table public.recipes
  add column if not exists quantity_per_unit numeric(12,4) not null default 0;
