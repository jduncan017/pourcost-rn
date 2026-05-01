-- ============================================================
-- Migration 012: Tag well-tier ingredients
--
-- Adds an explicit `is_well` flag on ingredient rows so the V1.1
-- cocktail picker can substitute a generic recipe slot ("any vodka")
-- with this user's actual well brand. Without the flag we can't
-- distinguish a well from any other vodka in the same bar.
--
-- Default false. Set true at insert time by the wells onboarding
-- flow (`seed-wells.ts`). Existing rows are unaffected.
-- ============================================================

ALTER TABLE ingredients
  ADD COLUMN IF NOT EXISTS is_well BOOLEAN NOT NULL DEFAULT false;

-- Partial index — keeps the well lookup fast without paying for the
-- 99% of rows that aren't wells.
CREATE INDEX IF NOT EXISTS idx_ingredients_user_well
  ON ingredients(user_id) WHERE is_well = true;
