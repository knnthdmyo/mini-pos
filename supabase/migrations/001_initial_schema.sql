-- Migration: 001_initial_schema.sql
-- Tables: users, products, ingredients, recipes, prepared_stock,
--         orders, order_items, inventory_logs, batch_preparations

-- Enable pgcrypto for gen_random_uuid()
create extension if not exists "pgcrypto";

-- ─── users ────────────────────────────────────────────────────────────────────
-- Mirrors Supabase Auth users; row is created after auth.users insert via trigger
create table if not exists public.users (
  id          uuid        primary key references auth.users(id) on delete cascade,
  email       text        not null unique,
  role        text        not null default 'staff' check (role in ('admin', 'staff')),
  created_at  timestamptz not null default now()
);

-- Auto-create user row on sign-up
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.users (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ─── products ─────────────────────────────────────────────────────────────────
create table if not exists public.products (
  id                  uuid            primary key default gen_random_uuid(),
  name                text            not null unique,
  price               numeric(10,2)   not null check (price > 0),
  has_prepared_stock  boolean         not null default false,
  is_active           boolean         not null default true,
  created_at          timestamptz     not null default now()
);

-- ─── ingredients ──────────────────────────────────────────────────────────────
create table if not exists public.ingredients (
  id                    uuid            primary key default gen_random_uuid(),
  name                  text            not null unique,
  stock_qty             numeric(12,4)   not null default 0,
  cost_per_unit         numeric(10,4)   not null default 0 check (cost_per_unit >= 0),
  low_stock_threshold   numeric(12,4),
  unit                  text            not null,
  created_at            timestamptz     not null default now()
);

-- ─── recipes ──────────────────────────────────────────────────────────────────
create table if not exists public.recipes (
  id                  uuid            primary key default gen_random_uuid(),
  product_id          uuid            not null references public.products(id) on delete cascade,
  ingredient_id       uuid            not null references public.ingredients(id) on delete cascade,
  quantity_per_unit   numeric(12,4)   not null check (quantity_per_unit > 0),
  created_at          timestamptz     not null default now(),
  unique (product_id, ingredient_id)
);

-- ─── prepared_stock ───────────────────────────────────────────────────────────
create table if not exists public.prepared_stock (
  id          uuid            primary key default gen_random_uuid(),
  product_id  uuid            not null unique references public.products(id) on delete cascade,
  quantity    numeric(12,4)   not null default 0,
  updated_at  timestamptz     not null default now()
);

-- ─── orders ───────────────────────────────────────────────────────────────────
create table if not exists public.orders (
  id            uuid            primary key default gen_random_uuid(),
  status        text            not null default 'placed' check (status in ('placed', 'completed')),
  total_price   numeric(10,2)   not null,
  created_at    timestamptz     not null default now(),
  completed_at  timestamptz,
  created_by    uuid            references public.users(id)
);

create index if not exists orders_status_idx on public.orders (status);
create index if not exists orders_created_at_idx on public.orders (created_at);

-- ─── order_items ──────────────────────────────────────────────────────────────
create table if not exists public.order_items (
  id          uuid            primary key default gen_random_uuid(),
  order_id    uuid            not null references public.orders(id) on delete cascade,
  product_id  uuid            not null references public.products(id),
  quantity    integer         not null check (quantity > 0),
  unit_price  numeric(10,2)   not null,
  unique (order_id, product_id)
);

create index if not exists order_items_order_id_idx on public.order_items (order_id);

-- ─── inventory_logs ───────────────────────────────────────────────────────────
create table if not exists public.inventory_logs (
  id              uuid            primary key default gen_random_uuid(),
  ingredient_id   uuid            not null references public.ingredients(id),
  change_qty      numeric(12,4)   not null,
  source_type     text            not null check (source_type in ('order', 'batch', 'manual')),
  source_id       uuid,
  notes           text,
  created_at      timestamptz     not null default now(),
  created_by      uuid            references public.users(id)
);

create index if not exists inventory_logs_ingredient_id_idx on public.inventory_logs (ingredient_id);
create index if not exists inventory_logs_created_at_idx on public.inventory_logs (created_at);
-- source_type may not exist on remote DBs that were created with an older schema;
-- migration 005_schema_fixes.sql adds the column and creates this index instead.
do $$ begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name   = 'inventory_logs'
      and column_name  = 'source_type'
  ) then
    execute 'create index if not exists inventory_logs_source_idx on public.inventory_logs (source_type, source_id)';
  end if;
end $$;

-- ─── batch_preparations ───────────────────────────────────────────────────────
create table if not exists public.batch_preparations (
  id          uuid            primary key default gen_random_uuid(),
  product_id  uuid            not null references public.products(id),
  quantity    numeric(12,4)   not null check (quantity > 0),
  created_at  timestamptz     not null default now(),
  created_by  uuid            references public.users(id)
);

-- ─── Row Level Security (basic policies) ──────────────────────────────────────
alter table public.users               enable row level security;
alter table public.products            enable row level security;
alter table public.ingredients         enable row level security;
alter table public.recipes             enable row level security;
alter table public.prepared_stock      enable row level security;
alter table public.orders              enable row level security;
alter table public.order_items         enable row level security;
alter table public.inventory_logs      enable row level security;
alter table public.batch_preparations  enable row level security;

-- Allow authenticated users full access (no role split in MVP)
create policy "Authenticated full access" on public.users
  for all to authenticated using (true) with check (true);
create policy "Authenticated full access" on public.products
  for all to authenticated using (true) with check (true);
create policy "Authenticated full access" on public.ingredients
  for all to authenticated using (true) with check (true);
create policy "Authenticated full access" on public.recipes
  for all to authenticated using (true) with check (true);
create policy "Authenticated full access" on public.prepared_stock
  for all to authenticated using (true) with check (true);
create policy "Authenticated full access" on public.orders
  for all to authenticated using (true) with check (true);
create policy "Authenticated full access" on public.order_items
  for all to authenticated using (true) with check (true);
create policy "Authenticated full access" on public.inventory_logs
  for all to authenticated using (true) with check (true);
create policy "Authenticated full access" on public.batch_preparations
  for all to authenticated using (true) with check (true);
