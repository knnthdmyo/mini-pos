-- 009_recipes_quantity_required_default.sql
-- The remote recipes table has a legacy `quantity_required` NOT NULL column.
-- Add it to local schema if missing, give it a default, then backfill.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'recipes'
      AND column_name = 'quantity_required'
  ) THEN
    ALTER TABLE public.recipes
      ADD COLUMN quantity_required numeric(12,4) NOT NULL DEFAULT 0;
  END IF;
END
$$;

ALTER TABLE public.recipes
  ALTER COLUMN quantity_required SET DEFAULT 0;

-- Backfill quantity_per_unit from quantity_required for any existing rows
UPDATE public.recipes
SET quantity_per_unit = quantity_required
WHERE quantity_per_unit = 0 AND quantity_required != 0;
