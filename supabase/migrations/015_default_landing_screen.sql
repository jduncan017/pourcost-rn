-- ============================================================
-- Migration 015: User-settable default landing screen
--
-- Where the user lands after sign-in. Bar managers building drinks all day
-- want Cocktails. Bartenders running invoice math want Calculator. Owners
-- managing inventory want My Inventory. One default doesn't fit everyone.
-- ============================================================

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS default_landing_screen TEXT DEFAULT 'cocktails'
    CHECK (default_landing_screen IN ('cocktails', 'ingredients', 'calculator'));
