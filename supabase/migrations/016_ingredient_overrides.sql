-- ============================================================
-- 016: Ingredient overrides for canonical-derived fields
--
-- Lets a user customize a bottle's brand, origin, flavor notes,
-- and other canonical-style attributes on a per-ingredient basis.
-- Display logic (Phase C) reads these first, falling back to the
-- linked canonical_products row when null. Form (Phase D) exposes
-- them as a "Detailed" mode toggle.
--
-- All columns are nullable + default null so existing ingredients
-- work unchanged.
-- ============================================================

ALTER TABLE ingredients
  ADD COLUMN IF NOT EXISTS brand TEXT,
  ADD COLUMN IF NOT EXISTS origin TEXT,
  ADD COLUMN IF NOT EXISTS flavor_notes JSONB,             -- ["clean","peppery"]
  ADD COLUMN IF NOT EXISTS parent_company TEXT,
  ADD COLUMN IF NOT EXISTS founded_year INTEGER,
  ADD COLUMN IF NOT EXISTS production_region TEXT,
  ADD COLUMN IF NOT EXISTS aging_years NUMERIC(4,1),
  ADD COLUMN IF NOT EXISTS education_data JSONB;            -- Tier 2 fields, same shape as canonical_products
