-- Auto-bump `updated_at` on every row update for ingredients + cocktails.
-- The `update_updated_at()` function was defined in migration 001 for the
-- invoice-side tables; we reuse it here so `updated_at > created_at` is a
-- reliable signal that the user has modified a row (used by the
-- `clearSampleData` promotion logic).

DROP TRIGGER IF EXISTS set_updated_at ON ingredients;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON ingredients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS set_updated_at ON cocktails;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON cocktails
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
