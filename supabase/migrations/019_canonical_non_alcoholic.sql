-- Flag for non-alcoholic variants of spirits/wine/beer (e.g. Athletic Brewing, Lyre's)
-- Allows substitution engine to treat them as flavor-compatible but ABV-distinct
ALTER TABLE canonical_products
  ADD COLUMN IF NOT EXISTS non_alcoholic boolean NOT NULL DEFAULT false;
