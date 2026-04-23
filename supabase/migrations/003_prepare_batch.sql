-- Migration: 003_prepare_batch.sql
-- Function: prepare_batch(product_id uuid, quantity numeric)
-- Atomically deducts ingredients and increments prepared stock

create or replace function public.prepare_batch(
  p_product_id uuid,
  p_quantity    numeric
)
returns uuid language plpgsql security definer as $$
declare
  v_recipe        record;
  v_batch_id      uuid;
  v_recipe_count  integer;
begin
  -- Validate quantity
  if p_quantity <= 0 then
    raise exception 'INVALID_QUANTITY: quantity must be positive';
  end if;

  -- Check product exists
  perform 1 from public.products where id = p_product_id;
  if not found then
    raise exception 'INVALID_PRODUCT: product % not found', p_product_id;
  end if;

  -- Check product has recipe
  select count(*) into v_recipe_count
  from public.recipes
  where product_id = p_product_id;

  if v_recipe_count = 0 then
    raise exception 'NO_RECIPE: product % has no recipe', p_product_id;
  end if;

  -- Create batch record
  insert into public.batch_preparations (product_id, quantity)
  values (p_product_id, p_quantity)
  returning id into v_batch_id;

  -- Deduct ingredients
  for v_recipe in
    select ingredient_id, quantity_per_unit
    from public.recipes
    where product_id = p_product_id
  loop
    update public.ingredients
    set    stock_qty = stock_qty - (v_recipe.quantity_per_unit * p_quantity)
    where  id = v_recipe.ingredient_id;

    insert into public.inventory_logs
      (ingredient_id, change_qty, source_type, source_id)
    values
      (v_recipe.ingredient_id,
       -(v_recipe.quantity_per_unit * p_quantity),
       'batch',
       v_batch_id);
  end loop;

  -- Increment prepared stock
  -- Upsert in case row doesn't exist yet
  insert into public.prepared_stock (product_id, quantity)
  values (p_product_id, p_quantity)
  on conflict (product_id)
  do update set
    quantity   = public.prepared_stock.quantity + excluded.quantity,
    updated_at = now();

  return v_batch_id;
end;
$$;
