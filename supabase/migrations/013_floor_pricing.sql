-- ============================================================
-- Migration 013: Floor pricing on profile
--
-- Adds two minimum-price floors used to clamp Suggested Price
-- output. Without these, low-cost recipes (e.g. cheap rum
-- daiquiri at 18% pour cost) suggest $5-6 — too cheap for any
-- cocktail bar to actually charge. Floor wins over raw % math.
--
-- min_cocktail_price applies to suggested cocktail retail prices.
-- min_ingredient_price applies to suggested per-pour ingredient
-- retail prices (single-pour spirits, beer, etc.).
-- ============================================================

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS min_cocktail_price NUMERIC(10,2) DEFAULT 10.00,
  ADD COLUMN IF NOT EXISTS min_ingredient_price NUMERIC(10,2) DEFAULT 7.00;
