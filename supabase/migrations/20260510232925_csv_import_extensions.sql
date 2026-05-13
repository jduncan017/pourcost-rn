-- Migration 023: CSV import extensions
--
-- 1. Add distributor_name to ingredient_configurations for free-text
--    distributor names that don't yet map to a distributors row + SKU.
-- 2. Extend the source check constraint to accept 'csv_import'.
-- 3. Add pending_canonical_pack_sizes for tracking novel pack configs
--    (e.g. a 24-pack that isn't in canonical_products.default_sizes).

ALTER TABLE ingredient_configurations
  ADD COLUMN IF NOT EXISTS distributor_name TEXT;

-- Drop the old constraint and replace with one that includes csv_import.
ALTER TABLE ingredient_configurations
  DROP CONSTRAINT IF EXISTS ingredient_configurations_source_check;

ALTER TABLE ingredient_configurations
  ADD CONSTRAINT ingredient_configurations_source_check
    CHECK (source IN ('manual', 'invoice', 'barcode', 'csv_import'));

-- Pending pack configurations: canonical product + size + pack_size combos
-- seen in imports that aren't represented in canonical_products.default_sizes.
CREATE TABLE pending_canonical_pack_sizes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  canonical_product_id uuid NOT NULL REFERENCES canonical_products(id) ON DELETE CASCADE,
  size_ml numeric NOT NULL,
  pack_size integer NOT NULL,
  sighting_count integer NOT NULL DEFAULT 1,
  first_seen_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (canonical_product_id, size_ml, pack_size)
);

ALTER TABLE pending_canonical_pack_sizes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated users can insert pending canonical pack sizes"
  ON pending_canonical_pack_sizes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "authenticated users can read pending canonical pack sizes"
  ON pending_canonical_pack_sizes FOR SELECT
  TO authenticated
  USING (auth.uid() IS NOT NULL);
