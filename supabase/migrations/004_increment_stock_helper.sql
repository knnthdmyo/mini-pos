-- Migration: 004_increment_stock_helper.sql
-- Helper function used by inventory adjustments and order edit reversals

create or replace function public.increment_stock(
  p_ingredient_id uuid,
  p_delta         numeric
)
returns void language plpgsql security definer as $$
begin
  update public.ingredients
  set    stock_qty = stock_qty + p_delta
  where  id = p_ingredient_id;

  if not found then
    raise exception 'INVALID_INGREDIENT: ingredient % not found', p_ingredient_id;
  end if;
end;
$$;
