-- 013_inventory_logs_core_columns.sql
-- Adds the core columns missing from inventory_logs on the remote DB.
-- The table pre-existed migration 001 (skipped via CREATE TABLE IF NOT EXISTS),
-- and migrations 005/011 only added source_type, source_id, notes, created_by.
-- ingredient_id and change_qty were never added.

alter table public.inventory_logs
  add column if not exists ingredient_id uuid
    references public.ingredients(id),
  add column if not exists change_qty    numeric(12,4),
  add column if not exists created_at    timestamptz not null default now();

create index if not exists inventory_logs_ingredient_id_idx
  on public.inventory_logs (ingredient_id);
create index if not exists inventory_logs_created_at_idx
  on public.inventory_logs (created_at);
