-- 014_inventory_logs_rename_type.sql
-- The remote inventory_logs table has a legacy `type` column (NOT NULL)
-- where our code expects `source_type`. Rename it to match.
-- Also ensure source_id exists (may have been added in 005 as source_id already).

do $$
begin
  -- Rename `type` → `source_type` only if `type` exists and `source_type` does not
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'inventory_logs' and column_name = 'type'
  ) and not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'inventory_logs' and column_name = 'source_type'
  ) then
    alter table public.inventory_logs rename column "type" to source_type;
  end if;
end $$;
