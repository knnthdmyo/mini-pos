-- Update place_order RPC to accept payment fields (amount_received, change_amount, change_given)

create or replace function place_order(p_items jsonb, p_amount_received numeric default null, p_change_amount numeric default null, p_change_given boolean default true)
returns jsonb
language plpgsql
security invoker
as $$
declare
  v_order_id  uuid;
  v_total     numeric;
  v_result    jsonb;
begin
  if jsonb_array_length(p_items) = 0 then
    raise exception 'EMPTY_ORDER';
  end if;

  -- Validate: every product must exist and be active
  if exists (
    select 1
    from jsonb_array_elements(p_items) as item
    left join products p on p.id = (item->>'productId')::uuid
    where p.id is null or not p.is_active
  ) then
    raise exception 'INVALID_PRODUCT';
  end if;

  -- Compute total price
  select coalesce(sum(p.price * (item->>'quantity')::int), 0)
  into v_total
  from jsonb_array_elements(p_items) as item
  join products p on p.id = (item->>'productId')::uuid;

  -- Insert order row with payment fields
  insert into orders (status, total_price, amount_received, change_amount, change_given)
  values ('placed', v_total, p_amount_received, p_change_amount, p_change_given)
  returning id into v_order_id;

  -- Insert all order_items in one statement
  insert into order_items (order_id, product_id, quantity, unit_price)
  select v_order_id,
         (item->>'productId')::uuid,
         (item->>'quantity')::int,
         p.price
  from jsonb_array_elements(p_items) as item
  join products p on p.id = (item->>'productId')::uuid;

  -- Return full order + items + product names as JSON
  select jsonb_build_object(
    'id',              o.id,
    'status',          o.status,
    'total_price',     o.total_price,
    'created_at',      o.created_at,
    'amount_received', o.amount_received,
    'change_amount',   o.change_amount,
    'change_given',    o.change_given,
    'order_items', (
      select jsonb_agg(
        jsonb_build_object(
          'product_id', oi.product_id,
          'quantity',   oi.quantity,
          'unit_price', oi.unit_price,
          'products',   jsonb_build_object('name', p2.name)
        )
        order by oi.product_id
      )
      from order_items oi
      join products p2 on p2.id = oi.product_id
      where oi.order_id = o.id
    )
  )
  into v_result
  from orders o
  where o.id = v_order_id;

  return v_result;
end;
$$;
