-- ============================================================
-- Migration 011: Canonical Library Foundation
--
-- Adds data foundation for a prebuilt cocktail library and
-- future shareable recipes (rep workflow, friend shares, brand
-- programs). All additive, no data rewrites.
--
--   1. Extends canonical_products with ownership + education fields
--   2. Extends cocktail_ingredients with canonical references so a
--      recipe can reference a specific canonical OR a generic
--      category ("any whiskey")
--   3. Adds received_recipes + received_recipe_ingredients tables
--      so library + shared recipes don't pollute user inventory
-- ============================================================


-- ============================================================
-- 1. canonical_products extensions
-- ============================================================

ALTER TABLE canonical_products
  -- Ownership. NULL = PourCost-curated (default). Set when a brand or
  -- distributor org account owns the canonical (FK on owner_org_id wired
  -- in when orgs table ships).
  ADD COLUMN IF NOT EXISTS owner_type TEXT
    CHECK (owner_type IS NULL OR owner_type IN ('pourcost', 'brand', 'distributor')),
  ADD COLUMN IF NOT EXISTS owner_org_id UUID,

  -- Tier 2 education data, queryable subset
  ADD COLUMN IF NOT EXISTS parent_company TEXT,
  ADD COLUMN IF NOT EXISTS founded_year INTEGER,
  ADD COLUMN IF NOT EXISTS production_region TEXT,
  ADD COLUMN IF NOT EXISTS aging_years NUMERIC(4,1),

  -- Tier 2 education data, JSONB for evolving schema. Category-specific
  -- structure (spirits / wine / beer / ingredients each have own template).
  -- Populated by enrichment job (Gemini Flash + grounded search) which
  -- flips enrichment_status to 'complete' when filled.
  ADD COLUMN IF NOT EXISTS education_data JSONB;

CREATE INDEX IF NOT EXISTS idx_canonical_products_owner
  ON canonical_products(owner_type, owner_org_id);
CREATE INDEX IF NOT EXISTS idx_canonical_products_parent_company
  ON canonical_products(parent_company);
CREATE INDEX IF NOT EXISTS idx_canonical_products_aging_years
  ON canonical_products(aging_years);


-- ============================================================
-- 2. cocktail_ingredients extensions
--
-- Recipe rows now reference one of:
--   a) a user ingredient (existing ingredient_id, current behavior)
--   b) a specific canonical (canonical_product_id, e.g. "Tito's Vodka")
--   c) a generic category (canonical_category + optional subcategory,
--      e.g. "any whiskey" or "any bourbon")
-- ============================================================

ALTER TABLE cocktail_ingredients
  ADD COLUMN IF NOT EXISTS canonical_product_id UUID REFERENCES canonical_products(id),
  ADD COLUMN IF NOT EXISTS canonical_category TEXT,
  ADD COLUMN IF NOT EXISTS canonical_subcategory TEXT;

ALTER TABLE cocktail_ingredients
  ALTER COLUMN ingredient_id DROP NOT NULL;

ALTER TABLE cocktail_ingredients
  ADD CONSTRAINT cocktail_ingredients_has_reference CHECK (
    ingredient_id IS NOT NULL
    OR canonical_product_id IS NOT NULL
    OR canonical_category IS NOT NULL
  );

CREATE INDEX IF NOT EXISTS idx_cocktail_ingredients_canonical
  ON cocktail_ingredients(canonical_product_id);
CREATE INDEX IF NOT EXISTS idx_cocktail_ingredients_canonical_category
  ON cocktail_ingredients(canonical_category, canonical_subcategory);


-- ============================================================
-- 3. received_recipes
--
-- Separate from cocktails so library + shared recipes don't pollute
-- the user's cocktails list or auto-create ingredients in their
-- inventory. user_id NULL = global library (curated by PourCost via
-- service role). Adoption flow copies to cocktails + cocktail_ingredients
-- using the user's real ingredient IDs.
-- ============================================================

CREATE TABLE received_recipes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,  -- NULL = library

  source TEXT NOT NULL
    CHECK (source IN ('library', 'rep', 'shared', 'brand', 'distributor')),
  source_metadata JSONB,  -- { rep_name, brand_id, original_author_id, ... }

  name TEXT NOT NULL,
  notes TEXT,
  category TEXT,
  description TEXT,
  image_path TEXT,

  -- Author's suggested retail price. Distinct from user's COGS calc on adopt.
  suggested_retail_price NUMERIC(10,2),

  -- Lifecycle
  received_at TIMESTAMPTZ DEFAULT now(),
  dismissed_at TIMESTAMPTZ,
  adopted_cocktail_id UUID REFERENCES cocktails(id) ON DELETE SET NULL,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_received_recipes_user ON received_recipes(user_id);
CREATE INDEX idx_received_recipes_source ON received_recipes(source);
CREATE INDEX idx_received_recipes_library
  ON received_recipes(source) WHERE user_id IS NULL;


-- ============================================================
-- 4. received_recipe_ingredients
--
-- References canonicals only, never user ingredients. Adopt flow
-- translates each row to a cocktail_ingredients row with the user's
-- chosen ingredient_id (existing match, substitute, or newly added).
-- ============================================================

CREATE TABLE received_recipe_ingredients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  received_recipe_id UUID NOT NULL REFERENCES received_recipes(id) ON DELETE CASCADE,

  -- One of these must be set
  canonical_product_id UUID REFERENCES canonical_products(id),
  canonical_category TEXT,
  canonical_subcategory TEXT,
  display_name TEXT,  -- author-typed name when no canonical match yet

  pour_size JSONB NOT NULL,
  sort_order INTEGER DEFAULT 0,

  -- Author's notes for this ingredient ("fresh lime only", "double-strain", etc.)
  ingredient_notes TEXT,

  CONSTRAINT received_ingredient_has_reference CHECK (
    canonical_product_id IS NOT NULL
    OR canonical_category IS NOT NULL
    OR display_name IS NOT NULL
  )
);

CREATE INDEX idx_rri_recipe ON received_recipe_ingredients(received_recipe_id);
CREATE INDEX idx_rri_canonical ON received_recipe_ingredients(canonical_product_id);
CREATE INDEX idx_rri_category
  ON received_recipe_ingredients(canonical_category, canonical_subcategory);


-- ============================================================
-- 5. Row Level Security
-- ============================================================

ALTER TABLE received_recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE received_recipe_ingredients ENABLE ROW LEVEL SECURITY;

-- received_recipes: library rows (user_id NULL) readable by all authenticated
-- users. Personal rows readable by owner only. Mutations only on own rows;
-- library is managed via service role.

CREATE POLICY "Read library or own received_recipes"
  ON received_recipes FOR SELECT
  USING (user_id IS NULL OR user_id = auth.uid());

CREATE POLICY "Insert own received_recipes"
  ON received_recipes FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Update own received_recipes"
  ON received_recipes FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Delete own received_recipes"
  ON received_recipes FOR DELETE
  USING (user_id = auth.uid());

-- received_recipe_ingredients: access matches parent recipe.

CREATE POLICY "Read library or own recipe ingredients"
  ON received_recipe_ingredients FOR SELECT
  USING (
    received_recipe_id IN (
      SELECT id FROM received_recipes
      WHERE user_id IS NULL OR user_id = auth.uid()
    )
  );

CREATE POLICY "Insert into own recipe ingredients"
  ON received_recipe_ingredients FOR INSERT
  WITH CHECK (
    received_recipe_id IN (
      SELECT id FROM received_recipes WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Update own recipe ingredients"
  ON received_recipe_ingredients FOR UPDATE
  USING (
    received_recipe_id IN (
      SELECT id FROM received_recipes WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    received_recipe_id IN (
      SELECT id FROM received_recipes WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Delete own recipe ingredients"
  ON received_recipe_ingredients FOR DELETE
  USING (
    received_recipe_id IN (
      SELECT id FROM received_recipes WHERE user_id = auth.uid()
    )
  );


-- ============================================================
-- 6. updated_at trigger
-- ============================================================

CREATE TRIGGER set_updated_at BEFORE UPDATE ON received_recipes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
