-- 011_all_table_fixes.sql
-- Adds all columns that may be missing on tables that pre-existed migration 001.
-- All statements use ADD COLUMN IF NOT EXISTS for full idempotency.

-- ─── orders ───────────────────────────────────────────────────────────────────
alter table public.orders
  add column if not exists status       text        not null default 'placed'
    check (status in ('placed', 'completed')),
  add column if not exists total_price  numeric(10,2) not null default 0,
  add column if not exists created_at   timestamptz not null default now(),
  add column if not exists completed_at timestamptz,
  add column if not exists created_by   uuid        references public.users(id);

create index if not exists orders_status_idx     on public.orders (status);
create index if not exists orders_created_at_idx on public.orders (created_at);

-- ─── order_items ──────────────────────────────────────────────────────────────
alter table public.order_items
  add column if not exists order_id   uuid          not null default '00000000-0000-0000-0000-000000000000',
  add column if not exists product_id uuid          not null default '00000000-0000-0000-0000-000000000000',
  add column if not exists quantity   integer       not null default 1 check (quantity > 0),
  add column if not exists unit_price numeric(10,2) not null default 0;

create index if not exists order_items_order_id_idx on public.order_items (order_id);

-- ─── products ─────────────────────────────────────────────────────────────────
-- (already handled in 006_products_schema_fix.sql — included here for safety)
alter table public.products
  add column if not exists price              numeric(10,2) not null default 0 check (price >= 0),
  add column if not exists has_prepared_stock boolean       not null default false,
  add column if not exists is_active          boolean       not null default true,
  add column if not exists created_at         timestamptz   not null default now();

-- ─── ingredients ──────────────────────────────────────────────────────────────
alter table public.ingredients
  add column if not exists stock_qty           numeric(12,4) not null default 0,
  add column if not exists cost_per_unit       numeric(10,4) not null default 0 check (cost_per_unit >= 0),
  add column if not exists low_stock_threshold numeric(12,4),
  add column if not exists unit                text,
  add column if not exists created_at          timestamptz   not null default now();

-- ─── recipes ──────────────────────────────────────────────────────────────────
alter table public.recipes
  add column if not exists product_id       uuid          not null default '00000000-0000-0000-0000-000000000000',
  add column if not exists ingredient_id    uuid          not null default '00000000-0000-0000-0000-000000000000',
  add column if not exists quantity_per_unit numeric(12,4) not null default 0,
  add column if not exists created_at        timestamptz   not null default now();

-- ─── prepared_stock ───────────────────────────────────────────────────────────
alter table public.prepared_stock
  add column if not exists product_id uuid          not null default '00000000-0000-0000-0000-000000000000',
  add column if not exists quantity   numeric(12,4) not null default 0,
  add column if not exists updated_at timestamptz   not null default now();

-- ─── batch_preparations ───────────────────────────────────────────────────────
alter table public.batch_preparations
  add column if not exists product_id uuid          not null default '00000000-0000-0000-0000-000000000000',
  add column if not exists quantity   numeric(12,4) not null default 0 check (quantity > 0),
  add column if not exists created_at timestamptz   not null default now(),
  add column if not exists created_by uuid          references public.users(id);
