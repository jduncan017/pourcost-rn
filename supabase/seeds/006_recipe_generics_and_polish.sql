-- ============================================================
-- Seed 006: Recipe genericization + cleanup
--
-- Patches the library recipes (seed 005) to reference generic
-- canonicals where the original brand wasn't load-bearing. Per
-- database_decisions.md: "recipes reference canonical generics
-- at the appropriate level of granularity" — Manhattan needs a
-- sweet vermouth, not specifically Carpano Antica.
--
-- Also adds two missing generic canonicals (Sweet Vermouth,
-- Dry Vermouth) that should have been in seed 003 but weren't.
--
-- Removes Bloody Mary from the library — depends on the prep
-- builder (mix-vs-scratch costing) which isn't shipped yet.
--
-- Idempotent. Safe to re-run.
--
-- Run AFTER seeds 001-005 + migration 011.
-- ============================================================


-- ============================================================
-- 1. Add missing generic vermouth canonicals
-- ============================================================

INSERT INTO canonical_products
  (name, brand, category, subcategory, default_sizes, abv, origin, description, flavor_notes, enrichment_status)
SELECT * FROM (VALUES
  ('Sweet Vermouth', NULL::TEXT, 'Vermouth', 'Sweet',
   '[{"kind":"milliliters","ml":750},{"kind":"milliliters","ml":1000}]'::jsonb,
   17, NULL::TEXT,
   'Generic sweet (rosso) vermouth. Italian-style red vermouth used in Manhattan, Negroni, Boulevardier, and stirred whiskey cocktails.',
   '["herbal","sweet","spiced","red"]'::jsonb,
   'pending'),
  ('Dry Vermouth', NULL, 'Vermouth', 'Dry',
   '[{"kind":"milliliters","ml":750},{"kind":"milliliters","ml":1000}]'::jsonb,
   17, NULL,
   'Generic dry (French) vermouth. Bartender default for martinis and any drink calling for "dry vermouth" without naming a brand.',
   '["herbal","dry","floral","crisp"]'::jsonb,
   'pending')
) AS new_rows(name, brand, category, subcategory, default_sizes, abv, origin, description, flavor_notes, enrichment_status)
WHERE NOT EXISTS (
  SELECT 1 FROM canonical_products
  WHERE canonical_products.name = new_rows.name
    AND canonical_products.brand IS NULL
    AND canonical_products.category = new_rows.category
);


-- ============================================================
-- 2. Repoint library recipe ingredients to generics
--
-- For each recipe ingredient currently pointing to a brand-specific
-- canonical that has a sensible generic equivalent, repoint to the
-- generic. Updates canonical_subcategory + display_name to match.
-- ============================================================

-- Helper: lookup IDs we'll repoint to.
DO $$
DECLARE
  v_sweet_vermouth_id UUID;
  v_dry_vermouth_id UUID;
  v_sparkling_wine_id UUID;
  v_maraschino_cherry_id UUID;
BEGIN
  SELECT id INTO v_sweet_vermouth_id
    FROM canonical_products
    WHERE name = 'Sweet Vermouth' AND brand IS NULL AND category = 'Vermouth'
    LIMIT 1;
  SELECT id INTO v_dry_vermouth_id
    FROM canonical_products
    WHERE name = 'Dry Vermouth' AND brand IS NULL AND category = 'Vermouth'
    LIMIT 1;
  SELECT id INTO v_sparkling_wine_id
    FROM canonical_products
    WHERE name = 'Sparkling Wine (Dry)' AND brand IS NULL AND category = 'Wine'
    LIMIT 1;
  SELECT id INTO v_maraschino_cherry_id
    FROM canonical_products
    WHERE name = 'Maraschino Cherry' AND brand IS NULL AND category = 'Garnish'
    LIMIT 1;

  -- Manhattan / Boulevardier / Negroni: Carpano Antica → Sweet Vermouth
  IF v_sweet_vermouth_id IS NOT NULL THEN
    UPDATE received_recipe_ingredients rri
    SET canonical_product_id = v_sweet_vermouth_id,
        canonical_category = 'Vermouth',
        canonical_subcategory = 'Sweet',
        display_name = 'Sweet Vermouth'
    FROM received_recipes rr, canonical_products cp
    WHERE rri.received_recipe_id = rr.id
      AND rr.source = 'library'
      AND rri.canonical_product_id = cp.id
      AND cp.name = 'Carpano Antica Formula'
      AND cp.brand = 'Carpano';
  END IF;

  -- Any other brand-specific sweet vermouth references in library recipes
  -- get the same treatment (Cinzano Rosso, Dolin Rouge, etc. used as
  -- recipe ingredients — none currently, but defensive).
  IF v_sweet_vermouth_id IS NOT NULL THEN
    UPDATE received_recipe_ingredients rri
    SET canonical_product_id = v_sweet_vermouth_id,
        canonical_category = 'Vermouth',
        canonical_subcategory = 'Sweet',
        display_name = 'Sweet Vermouth'
    FROM received_recipes rr, canonical_products cp
    WHERE rri.received_recipe_id = rr.id
      AND rr.source = 'library'
      AND rri.canonical_product_id = cp.id
      AND cp.category = 'Vermouth'
      AND cp.subcategory = 'Sweet'
      AND cp.brand IS NOT NULL
      AND cp.id != v_sweet_vermouth_id;
  END IF;

  -- Dry vermouth (Dry Martini, etc.): repoint brand-specific dry vermouths
  IF v_dry_vermouth_id IS NOT NULL THEN
    UPDATE received_recipe_ingredients rri
    SET canonical_product_id = v_dry_vermouth_id,
        canonical_category = 'Vermouth',
        canonical_subcategory = 'Dry',
        display_name = 'Dry Vermouth'
    FROM received_recipes rr, canonical_products cp
    WHERE rri.received_recipe_id = rr.id
      AND rr.source = 'library'
      AND rri.canonical_product_id = cp.id
      AND cp.category = 'Vermouth'
      AND cp.subcategory = 'Dry'
      AND cp.brand IS NOT NULL
      AND cp.id != v_dry_vermouth_id;
  END IF;

  -- French 75 / Champagne cocktails: Champagne → Sparkling Wine (Dry).
  -- Most bars use Prosecco or Cava, not Champagne. Generic is more honest.
  IF v_sparkling_wine_id IS NOT NULL THEN
    UPDATE received_recipe_ingredients rri
    SET canonical_product_id = v_sparkling_wine_id,
        canonical_category = 'Wine',
        canonical_subcategory = 'Sparkling',
        display_name = 'Sparkling Wine'
    FROM received_recipes rr, canonical_products cp
    WHERE rri.received_recipe_id = rr.id
      AND rr.source = 'library'
      AND rri.canonical_product_id = cp.id
      AND cp.name = 'Champagne'
      AND cp.brand IS NULL;
  END IF;

  -- Manhattan / Whiskey Sour / Old Fashioned cherries: Luxardo (specific) →
  -- Maraschino Cherry (generic). Bars stocking real Luxardo can swap in
  -- their specific from My Inventory.
  IF v_maraschino_cherry_id IS NOT NULL THEN
    UPDATE received_recipe_ingredients rri
    SET canonical_product_id = v_maraschino_cherry_id,
        canonical_category = 'Garnish',
        canonical_subcategory = 'Cherry',
        display_name = 'Maraschino Cherry'
    FROM received_recipes rr, canonical_products cp
    WHERE rri.received_recipe_id = rr.id
      AND rr.source = 'library'
      AND rri.canonical_product_id = cp.id
      AND cp.name = 'Luxardo Cherry'
      AND cp.brand = 'Luxardo';
  END IF;
END $$;


-- ============================================================
-- 3. Drop Bloody Mary — depends on prep builder (Bloody Mary mix
--    vs scratch costing) which isn't shipped yet.
--    CASCADE removes received_recipe_ingredients automatically.
-- ============================================================

DELETE FROM received_recipes
WHERE source = 'library'
  AND user_id IS NULL
  AND name = 'Bloody Mary';
