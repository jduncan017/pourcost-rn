-- ============================================================
-- Migration 014: Separate pour cost goals for beer + wine
--
-- Bars price beer and wine differently from spirits. Beer (especially
-- draft from a keg) typically runs 18-25% pour cost. Wine by the glass
-- runs 20-30%. Forcing them through the same bar-wide spirits target
-- (or a bottle-cost tier) gives wrong suggested prices.
--
-- New columns default to typical industry numbers; users adjust in
-- Settings → Pricing → Pour Cost Targets.
-- ============================================================

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS beer_pour_cost_goal NUMERIC(5,4) DEFAULT 0.22,
  ADD COLUMN IF NOT EXISTS wine_pour_cost_goal NUMERIC(5,4) DEFAULT 0.25;
