-- Add varietal column to canonical_products for wine subcategory detail
-- e.g. 'Cabernet Sauvignon', 'Chardonnay', 'Pinot Noir'
ALTER TABLE canonical_products
  ADD COLUMN IF NOT EXISTS varietal text;
