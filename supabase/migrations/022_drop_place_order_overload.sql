-- Drop the multi-param place_order overload that conflicts with the single-param version.
-- The payment fields (amount_received, change_amount, change_given) are no longer used.
DROP FUNCTION IF EXISTS public.place_order(jsonb, numeric, numeric, boolean);
