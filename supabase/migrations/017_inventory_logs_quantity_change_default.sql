-- 017_inventory_logs_quantity_change_default.sql
-- Legacy `quantity_change` column (NOT NULL) exists alongside our `change_qty`.
-- Give it a default so inserts that omit it succeed.

alter table public.inventory_logs
  alter column quantity_change set default 0;

-- Backfill from change_qty
update public.inventory_logs
set    quantity_change = change_qty
where  quantity_change = 0 and change_qty is not null and change_qty != 0;
