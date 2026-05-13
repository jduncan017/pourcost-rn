-- ============================================================
-- Migration 027: Backfill user-owned canonicals for imported ingredients.
--
-- The CSV importer creates user `ingredients` rows but doesn't promote
-- unmatched names to `canonical_products`. This migration:
--   1. Relaxes owner_type CHECK to include 'user' (per database_decisions.md)
--   2. Re-links user ingredients to existing canonicals via case-insensitive
--      (name, brand) match (in case the import script missed some)
--   3. For ingredients still NULL, creates user-owned canonicals
--      (owner_type='user', owner_org_id=user_id, subcategory=NULL for Gemini)
--   4. Links those user ingredients to the new canonicals
--
-- Subcategory left NULL on user-owned rows — Gemini enrichment fills it
-- against the locked taxonomy on the next pass.
-- ============================================================

-- 1. Extend owner_type to allow 'user'
ALTER TABLE canonical_products DROP CONSTRAINT canonical_products_owner_type_check;
ALTER TABLE canonical_products
  ADD CONSTRAINT canonical_products_owner_type_check
  CHECK (owner_type IS NULL OR owner_type IN ('pourcost','brand','distributor','user'));


-- 2. Re-link to existing system canonicals via case-insensitive match
UPDATE ingredients i
SET canonical_product_id = c.id
FROM canonical_products c
WHERE i.canonical_product_id IS NULL
  AND c.owner_org_id IS NULL                 -- only system canonicals
  AND lower(c.name) = lower(i.name)
  AND COALESCE(lower(c.brand),'') = COALESCE(lower(i.brand),'');


-- 3. Insert user-owned canonicals for still-unmatched ingredients.
--    Dedupe by lower(name)+lower(brand) within the user's set.
WITH unique_new AS (
  SELECT DISTINCT ON (lower(i.name), COALESCE(lower(i.brand),''))
    i.name,
    i.brand,
    i.type,
    i.sub_type,
    i.abv,
    i.product_size,
    i.user_id
  FROM ingredients i
  WHERE i.canonical_product_id IS NULL
  ORDER BY lower(i.name), COALESCE(lower(i.brand),''), i.created_at
)
INSERT INTO canonical_products
  (name, brand, category, subcategory, abv, default_sizes,
   owner_type, owner_org_id, enrichment_status)
SELECT
  name,
  brand,
  CASE
    -- Spirit subtypes that map to their own canonical CATEGORY
    WHEN type='Spirit' AND sub_type='Liqueur' THEN 'Liqueur'
    WHEN type='Spirit' AND sub_type='Amaro'   THEN 'Liqueur'
    WHEN type='Spirit' AND sub_type='Vermouth' THEN 'Vermouth'
    WHEN type='Spirit' AND sub_type='Bitters' THEN 'Bitters'
    -- Non-Alc chip subtype IS the canonical category
    WHEN type='Non-Alc' AND sub_type='Mixer'  THEN 'Mixer'
    WHEN type='Non-Alc' AND sub_type='Syrup'  THEN 'Syrup'
    WHEN type='Non-Alc' AND sub_type='Juice'  THEN 'Juice'
    WHEN type='Non-Alc' AND sub_type='Garnish' THEN 'Garnish'
    WHEN type='Non-Alc' AND sub_type='Dairy'  THEN 'Dairy'
    WHEN type='Non-Alc' AND sub_type='Egg'    THEN 'Egg'
    WHEN type='Non-Alc' AND sub_type='Spice'  THEN 'Spice'
    WHEN type='Non-Alc' AND sub_type='Herb'   THEN 'Herb'
    WHEN type='Non-Alc' THEN 'Mixer'           -- 'Other' catchall under Non-Alc
    -- Top-level types passthrough
    WHEN type='Garnish' THEN 'Garnish'
    WHEN type='Prepped' THEN 'Prepped'
    WHEN type='Beer'    THEN 'Beer'
    WHEN type='Wine'    THEN 'Wine'
    -- All other Spirit chips (Vodka/Whiskey/Gin/Rum/Tequila/Mezcal/Cognac/Brandy/etc.)
    WHEN type='Spirit'  THEN 'Spirit'
    ELSE type
  END AS category,
  -- For Wine/Beer the user sub_type aligns with the locked canonical sub vocab,
  -- so pass it through. For everything else, leave NULL for Gemini to fill.
  CASE
    WHEN type='Wine' AND sub_type IN ('Red','White','Rosé','Sparkling','Fortified') THEN sub_type
    WHEN type='Beer' AND sub_type IN ('Lager','Pilsner','IPA','Pale Ale','Amber','Stout','Porter','Wheat','Sour','Belgian','Ale','Cider','Hard Seltzer','Other') THEN sub_type
    ELSE NULL
  END AS subcategory,
  abv,
  jsonb_build_array(product_size) AS default_sizes,
  'user',
  user_id,
  'pending'
FROM unique_new;


-- 4. Link user ingredients to the newly created user-owned canonicals.
UPDATE ingredients i
SET canonical_product_id = c.id
FROM canonical_products c
WHERE i.canonical_product_id IS NULL
  AND c.owner_org_id = i.user_id              -- only this user's user-owned
  AND lower(c.name) = lower(i.name)
  AND COALESCE(lower(c.brand),'') = COALESCE(lower(i.brand),'');
