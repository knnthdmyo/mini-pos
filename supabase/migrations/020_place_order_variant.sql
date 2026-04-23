-- Update place_order RPC to support variant_id
-- Each item in p_items can now include an optional "variantId" field.
-- When present, the price is taken from product_variants instead of products.

create or replace function place_order(p_items jsonb)
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

  -- Validate: if variantId is provided, it must exist and be active
  if exists (
    select 1
    from jsonb_array_elements(p_items) as item
    where item->>'variantId' is not null
      and not exists (
        select 1 from product_variants pv
        where pv.id = (item->>'variantId')::uuid
          and pv.product_id = (item->>'productId')::uuid
          and pv.is_active
      )
  ) then
    raise exception 'INVALID_VARIANT';
  end if;

  -- Compute total price: use variant price when variantId is provided
  select coalesce(sum(
    case
      when item->>'variantId' is not null then
        (select pv.price from product_variants pv where pv.id = (item->>'variantId')::uuid)
      else
        p.price
    end * (item->>'quantity')::int
  ), 0)
  into v_total
  from jsonb_array_elements(p_items) as item
  join products p on p.id = (item->>'productId')::uuid;

  -- Insert order row
  insert into orders (status, total_price)
  values ('placed', v_total)
  returning id into v_order_id;

  -- Insert all order_items with variant_id and correct unit_price
  insert into order_items (order_id, product_id, variant_id, quantity, unit_price)
  select v_order_id,
         (item->>'productId')::uuid,
         (item->>'variantId')::uuid,
         (item->>'quantity')::int,
         case
           when item->>'variantId' is not null then
             (select pv.price from product_variants pv where pv.id = (item->>'variantId')::uuid)
           else
             p.price
         end
  from jsonb_array_elements(p_items) as item
  join products p on p.id = (item->>'productId')::uuid;

  -- Return full order + items + product names as JSON
  select jsonb_build_object(
    'id',          o.id,
    'status',      o.status,
    'total_price', o.total_price,
    'created_at',  o.created_at,
    'order_items', (
      select jsonb_agg(
        jsonb_build_object(
          'product_id', oi.product_id,
          'variant_id', oi.variant_id,
          'quantity',   oi.quantity,
          'unit_price', oi.unit_price,
          'products',   jsonb_build_object('name',
            case
              when oi.variant_id is not null then
                p2.name || ' (' || (select pv.name from product_variants pv where pv.id = oi.variant_id) || ')'
              else
                p2.name
            end
          )
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
