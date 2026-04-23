-- Migration: 002_db_functions.sql
-- Function: complete_order(order_id uuid)
-- Atomically completes an order: updates status, deducts inventory, logs changes

create or replace function public.complete_order(p_order_id uuid)
returns void language plpgsql security definer as $$
declare
  v_item        record;
  v_recipe      record;
  v_order_status text;
begin
  -- Verify order exists and is in 'placed' status
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

  -- Process each order item
  for v_item in
    select oi.product_id, oi.quantity, p.has_prepared_stock
    from public.order_items oi
    join public.products p on p.id = oi.product_id
    where oi.order_id = p_order_id
  loop
    if v_item.has_prepared_stock then
      -- Deduct from prepared stock
      update public.prepared_stock
      set    quantity   = quantity - v_item.quantity,
             updated_at = now()
      where  product_id = v_item.product_id;

    else
      -- Deduct ingredients via recipe
      for v_recipe in
        select ingredient_id, quantity_per_unit
        from public.recipes
        where product_id = v_item.product_id
      loop
        -- Update ingredient stock
        update public.ingredients
        set    stock_qty = stock_qty - (v_recipe.quantity_per_unit * v_item.quantity)
        where  id = v_recipe.ingredient_id;

        -- Log the deduction
        insert into public.inventory_logs
          (ingredient_id, change_qty, source_type, source_id)
        values
          (v_recipe.ingredient_id,
           -(v_recipe.quantity_per_unit * v_item.quantity),
           'order',
           p_order_id);
      end loop;
    end if;
  end loop;

  -- Mark order as completed
  update public.orders
  set    status       = 'completed',
         completed_at = now()
  where  id = p_order_id;

end;
$$;
