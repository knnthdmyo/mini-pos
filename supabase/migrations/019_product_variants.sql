-- product_variants: size/variant options per product (e.g. S, M, L)
CREATE TABLE product_variants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  name text NOT NULL,
  price numeric(10,2) NOT NULL CHECK (price >= 0),
  is_active boolean NOT NULL DEFAULT true,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (product_id, name)
);

-- RLS
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read product_variants"
  ON product_variants FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert product_variants"
  ON product_variants FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update product_variants"
  ON product_variants FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete product_variants"
  ON product_variants FOR DELETE TO authenticated USING (true);

-- Add variant_id to product_costings (nullable for backward compat)
ALTER TABLE product_costings
  ADD COLUMN variant_id uuid REFERENCES product_variants(id) ON DELETE CASCADE;

-- Drop old unique on product_id, add unique on variant_id
ALTER TABLE product_costings DROP CONSTRAINT IF EXISTS product_costings_product_id_key;

-- Each variant should have at most one costing
CREATE UNIQUE INDEX idx_product_costings_variant ON product_costings(variant_id) WHERE variant_id IS NOT NULL;

-- Products without variants still use product_id unique costing
CREATE UNIQUE INDEX idx_product_costings_product_no_variant ON product_costings(product_id) WHERE variant_id IS NULL;

-- Index for lookups
CREATE INDEX idx_product_variants_product ON product_variants(product_id);

-- Add variant_id to order_items so POS can track which variant was ordered
ALTER TABLE order_items
  ADD COLUMN variant_id uuid REFERENCES product_variants(id) ON DELETE SET NULL;
