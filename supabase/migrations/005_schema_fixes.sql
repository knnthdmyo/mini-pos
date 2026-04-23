-- 005_schema_fixes.sql
-- Adds missing columns to tables that may already exist on the remote DB
-- from a prior migration run. Uses ADD COLUMN IF NOT EXISTS for idempotency.

-- inventory_logs: add columns that may be missing from an older version of the table
alter table public.inventory_logs
  add column if not exists source_type text
    check (source_type in ('order', 'batch', 'manual')),
  add column if not exists source_id   uuid,
  add column if not exists notes       text,
  add column if not exists created_by  uuid references public.users(id);

-- Create indexes that depend on source_type (safe to re-run)
create index if not exists inventory_logs_source_idx
  on public.inventory_logs (source_type, source_id);

-- products: add description and selling_price alias if the app evolves
-- (no-op if schema already matches — price column was created by migration 001)

-- recipes: ensure quantity_per_unit exists (created by migration 001)
-- No fix needed unless table was created without the column.
