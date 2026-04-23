-- 016_inventory_logs_type_column_default.sql
-- Set default on inventory_logs.type now that enum values exist (committed in 015).
-- Also update the complete_order and prepare_batch DB functions to write both
-- `type` and `source_type` so the legacy column stays consistent.

alter table public.inventory_logs
  alter column "type" set default 'manual'::inventory_log_type;

-- Redefine complete_order to also write the legacy `type` column
create or replace function public.complete_order(p_order_id uuid)
returns void language plpgsql security definer as $$
declare
  v_item        record;
  v_recipe      record;
  v_order_status text;
begin
  select status into v_order_status
  from public.orders
  where id = p_order_id
  for update;

  if not found then
    raise exception 'INVALID_ORDER: order % not found', p_order_id;
  end if;

  if v_order_status != 'placed' then
    raise exception 'INVALID_ORDER: order % is already %', p_order_id, v_order_status;
  end if;

  for v_item in
    select oi.product_id, oi.quantity, p.has_prepared_stock
    from public.order_items oi
    join public.products p on p.id = oi.product_id
    where oi.order_id = p_order_id
  loop
    if v_item.has_prepared_stock then
      update public.prepared_stock
      set    quantity   = quantity - v_item.quantity,
             updated_at = now()
      where  product_id = v_item.product_id;
    else
      for v_recipe in
        select ingredient_id, quantity_per_unit
        from public.recipes
        where product_id = v_item.product_id
      loop
        update public.ingredients
        set    stock_qty = stock_qty - (v_recipe.quantity_per_unit * v_item.quantity)
        where  id = v_recipe.ingredient_id;

        insert into public.inventory_logs
          (ingredient_id, change_qty, source_type, source_id, type)
        values
          (v_recipe.ingredient_id,
           -(v_recipe.quantity_per_unit * v_item.quantity),
           'order',
           p_order_id,
           'order'::inventory_log_type);
      end loop;
    end if;
  end loop;

  update public.orders
  set    status       = 'completed',
         completed_at = now()
  where  id = p_order_id;
end;
$$;

-- Redefine prepare_batch to also write the legacy `type` column
create or replace function public.prepare_batch(p_product_id uuid, p_quantity numeric)
returns uuid language plpgsql security definer as $$
declare
  v_batch_id uuid;
  v_recipe   record;
begin
  if p_quantity <= 0 then
    raise exception 'INVALID_QUANTITY: quantity must be positive';
  end if;

  if not exists (select 1 from public.recipes where product_id = p_product_id) then
    raise exception 'NO_RECIPE: product % has no recipe', p_product_id;
  end if;

  insert into public.batch_preparations (product_id, quantity)
  values (p_product_id, p_quantity)
  returning id into v_batch_id;

  for v_recipe in
    select ingredient_id, quantity_per_unit
    from public.recipes
    where product_id = p_product_id
  loop
    update public.ingredients
    set    stock_qty = stock_qty - (v_recipe.quantity_per_unit * p_quantity)
    where  id = v_recipe.ingredient_id;

    insert into public.inventory_logs
      (ingredient_id, change_qty, source_type, source_id, type)
    values
      (v_recipe.ingredient_id,
       -(v_recipe.quantity_per_unit * p_quantity),
       'batch',
       v_batch_id,
       'batch'::inventory_log_type);
  end loop;

  insert into public.prepared_stock (product_id, quantity)
  values (p_product_id, p_quantity)
  on conflict (product_id)
  do update set
    quantity   = public.prepared_stock.quantity + excluded.quantity,
    updated_at = now();

  return v_batch_id;
end;
$$;
