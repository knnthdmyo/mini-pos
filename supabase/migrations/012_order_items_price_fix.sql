-- 012_order_items_price_fix.sql
-- The remote order_items table has a legacy `price` column (NOT NULL, no default)
-- from a prior schema. Our app column is `unit_price`.
-- Give `price` a default of 0 so inserts that omit it don't fail.
-- Backfill `price` from `unit_price` for any existing rows.

alter table public.order_items
  alter column price set default 0;

update public.order_items
set price = unit_price
where price = 0 and unit_price != 0;
