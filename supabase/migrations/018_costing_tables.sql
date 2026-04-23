-- product_costings: one costing snapshot per product
create table product_costings (
  id uuid primary key default gen_random_uuid(),
  product_id uuid unique not null
    references products(id) on delete cascade,
  overhead_cost numeric(10,2) not null default 0
    check (overhead_cost >= 0),
  labor_cost numeric(10,2) not null default 0
    check (labor_cost >= 0),
  other_cost numeric(10,2) not null default 0
    check (other_cost >= 0),
  yield_quantity numeric(12,4) not null
    check (yield_quantity > 0),
  total_material_cost numeric(10,2) not null
    check (total_material_cost >= 0),
  total_production_cost numeric(10,2) not null
    check (total_production_cost >= 0),
  cost_per_item numeric(10,4) not null
    check (cost_per_item >= 0),
  profit_margin numeric(5,2) not null default 0
    check (profit_margin >= 0),
  srp numeric(10,2) not null
    check (srp > 0),
  srp_override boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- costing_material_rows: material breakdown per costing
create table costing_material_rows (
  id uuid primary key default gen_random_uuid(),
  costing_id uuid not null
    references product_costings(id) on delete cascade,
  ingredient_id uuid
    references ingredients(id) on delete set null,
  material_name text not null,
  unit text not null,
  cost_per_unit numeric(10,4) not null
    check (cost_per_unit >= 0),
  quantity_used numeric(12,4) not null
    check (quantity_used > 0),
  row_total numeric(10,2) not null
    check (row_total >= 0),
  created_at timestamptz not null default now()
);

-- Index for looking up costing material rows by costing
create index idx_costing_material_rows_costing
  on costing_material_rows(costing_id);

-- RLS policies
alter table product_costings enable row level security;
alter table costing_material_rows enable row level security;

create policy "Authenticated users can read product_costings"
  on product_costings for select
  to authenticated using (true);

create policy "Authenticated users can insert product_costings"
  on product_costings for insert
  to authenticated with check (true);

create policy "Authenticated users can update product_costings"
  on product_costings for update
  to authenticated using (true);

create policy "Authenticated users can delete product_costings"
  on product_costings for delete
  to authenticated using (true);

create policy "Authenticated users can read costing_material_rows"
  on costing_material_rows for select
  to authenticated using (true);

create policy "Authenticated users can insert costing_material_rows"
  on costing_material_rows for insert
  to authenticated with check (true);

create policy "Authenticated users can delete costing_material_rows"
  on costing_material_rows for delete
  to authenticated using (true);
