-- Flag for sample (onboarding seed) ingredients and cocktails.
-- Lets us offer a one-tap "Clear sample data" action in Settings after a user
-- has populated their own inventory.

ALTER TABLE ingredients ADD COLUMN IF NOT EXISTS is_sample BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE cocktails ADD COLUMN IF NOT EXISTS is_sample BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_ingredients_sample ON ingredients(user_id) WHERE is_sample = true;
CREATE INDEX IF NOT EXISTS idx_cocktails_sample ON cocktails(user_id) WHERE is_sample = true;
