-- ============================================================
-- PourCost Supabase Schema
-- Matches the RN app's TypeScript models exactly.
-- Volume stored as JSONB to preserve the full discriminated union.
-- ============================================================

-- ============================================================
-- 1. PROFILES (extends Supabase auth.users)
-- ============================================================

CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  legacy_cognito_id TEXT UNIQUE,     -- "us-east-1:<uuid>" for migration mapping
  display_name TEXT,
  base_currency TEXT DEFAULT 'USD',
  measurement_system TEXT DEFAULT 'us' CHECK (measurement_system IN ('us', 'metric')),
  pour_cost_goal NUMERIC(5,4) DEFAULT 0.18,  -- 18% default, matches iOS
  default_pour_size JSONB DEFAULT '{"kind":"fractionalOunces","numerator":3,"denominator":2}',
  default_retail_price NUMERIC(10,2) DEFAULT 10.00,
  ingredient_order_pref TEXT DEFAULT 'manual',
  theme_mode TEXT DEFAULT 'dark' CHECK (theme_mode IN ('dark', 'light', 'auto')),
  enabled_product_sizes JSONB DEFAULT '[]'::jsonb,  -- array of Volume label strings the user wants to see
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_profiles_cognito_id ON profiles(legacy_cognito_id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- 2. INGREDIENTS
-- Matches RN SavedIngredient interface
-- ============================================================

CREATE TABLE ingredients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  legacy_id UUID,                              -- original DynamoDB sort key UUID

  name TEXT NOT NULL,
  product_cost NUMERIC(10,2) NOT NULL DEFAULT 0,
  product_size JSONB NOT NULL,                 -- Volume discriminated union
    -- e.g. {"kind":"milliliters","ml":750}
    -- e.g. {"kind":"namedOunces","name":"Corny Keg","ounces":640}
    -- e.g. {"kind":"unitQuantity","unitType":"oneCanOrBottle","name":"6 pack","quantity":6,"ounces":72}
    -- e.g. {"kind":"fractionalOunces","numerator":3,"denominator":2}
  type TEXT,                                   -- Spirit, Beer, Wine, Prepped, Garnish, Other
  sub_type TEXT,                               -- Spirit subcategory: Vodka, Whiskey, Bourbon, etc.
  retail_price NUMERIC(10,2),                  -- sell price per pour (for pour cost % on individual ingredients)
  pour_size JSONB,                             -- per-ingredient pour size (overrides global default)
  not_for_sale BOOLEAN DEFAULT false,
  description TEXT,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_ingredients_user ON ingredients(user_id);
CREATE INDEX idx_ingredients_legacy ON ingredients(legacy_id);

-- ============================================================
-- 3. COCKTAILS
-- Matches RN Cocktail interface
-- ============================================================

CREATE TABLE cocktails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  legacy_id UUID,                              -- original DynamoDB sort key UUID

  name TEXT NOT NULL,
  notes TEXT,
  category TEXT,                               -- Classic, Modern, Tropical, Whiskey, etc.
  description TEXT,
  favorited BOOLEAN DEFAULT false,
  retail_price NUMERIC(10,2),                  -- menu/retail price set by user
  image_path TEXT,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_cocktails_user ON cocktails(user_id);
CREATE INDEX idx_cocktails_legacy ON cocktails(legacy_id);

-- ============================================================
-- 4. COCKTAIL_INGREDIENTS (junction table)
-- Matches RN CocktailIngredient interface
-- No UNIQUE constraint on (cocktail_id, ingredient_id) —
-- same ingredient can appear multiple times (e.g. rinse + main pour)
-- ============================================================

CREATE TABLE cocktail_ingredients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cocktail_id UUID NOT NULL REFERENCES cocktails(id) ON DELETE CASCADE,
  ingredient_id UUID NOT NULL REFERENCES ingredients(id) ON DELETE CASCADE,

  pour_size JSONB NOT NULL,                    -- Volume discriminated union (same format as product_size)
  cost NUMERIC(10,2),                          -- cached cost for this pour (avoids re-calculation)
  sort_order INTEGER DEFAULT 0,

  -- Denormalized from ingredient for display without joins
  -- (optional — can be populated via trigger or app-side)
  ingredient_name TEXT,
  product_size JSONB,
  product_cost NUMERIC(10,2)
);

CREATE INDEX idx_ci_cocktail ON cocktail_ingredients(cocktail_id);
CREATE INDEX idx_ci_ingredient ON cocktail_ingredients(ingredient_id);

-- ============================================================
-- 5. AD CONFIG (replaces S3 config.json)
-- ============================================================

CREATE TABLE ad_config (
  id TEXT PRIMARY KEY,
  name TEXT,
  image_url TEXT NOT NULL,
  background_color JSONB,                      -- {"r":255,"g":255,"b":255}
  delay_ms INTEGER DEFAULT 6000,
  destination_url TEXT,
  active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0
);

-- ============================================================
-- 6. MIGRATION HELPER (temporary — drop after migration complete)
-- Maps Cognito Identity IDs to social provider user IDs
-- ============================================================

CREATE TABLE user_identity_map (
  cognito_identity_id TEXT PRIMARY KEY,        -- "us-east-1:<uuid>"
  provider TEXT NOT NULL,                      -- 'facebook' or 'google'
  provider_user_id TEXT,                       -- the actual FB/Google user ID
  supabase_user_id UUID REFERENCES auth.users(id),
  migrated BOOLEAN DEFAULT false,
  migrated_at TIMESTAMPTZ
);

CREATE INDEX idx_uim_provider ON user_identity_map(provider, provider_user_id);

-- ============================================================
-- 7. ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE cocktails ENABLE ROW LEVEL SECURITY;
ALTER TABLE cocktail_ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE ad_config ENABLE ROW LEVEL SECURITY;

-- Profiles: users manage their own
CREATE POLICY "Users manage own profile"
  ON profiles FOR ALL
  USING (id = auth.uid());

-- Ingredients: users manage their own
CREATE POLICY "Users manage own ingredients"
  ON ingredients FOR ALL
  USING (user_id = auth.uid());

-- Cocktails: users manage their own
CREATE POLICY "Users manage own cocktails"
  ON cocktails FOR ALL
  USING (user_id = auth.uid());

-- Cocktail ingredients: users manage ingredients in their own cocktails
CREATE POLICY "Users manage own cocktail_ingredients"
  ON cocktail_ingredients FOR ALL
  USING (
    cocktail_id IN (SELECT id FROM cocktails WHERE user_id = auth.uid())
  );

-- Ad config: public read, no write
CREATE POLICY "Anyone can read ads"
  ON ad_config FOR SELECT
  USING (true);

-- ============================================================
-- 8. UPDATED_AT TRIGGER
-- Auto-update updated_at on row changes
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON ingredients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON cocktails
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
