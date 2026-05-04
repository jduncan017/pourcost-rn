-- ============================================================
-- Migration 017: Per-ingredient-type defaults for pour size + retail
--
-- The legacy `default_pour_size` / `default_retail_price` columns hold a
-- single value used everywhere. They now back the Spirit slot only; per-type
-- defaults for Beer, Wine, Non-Alc, Prepped, Garnish, and Other live in two
-- new JSONB columns so they sync across devices.
--
-- Shape:
--   default_pour_sizes:    { Spirit: Volume, Beer: Volume, Wine: Volume, ... }
--   default_retail_prices: { Spirit: number, Beer: number, Wine: number, ... }
--
-- The legacy single-value columns stay (Spirit mirrors back into them) so
-- older clients keep working until they update.
-- ============================================================

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS default_pour_sizes JSONB,
  ADD COLUMN IF NOT EXISTS default_retail_prices JSONB;
