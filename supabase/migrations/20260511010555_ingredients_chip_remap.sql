-- ============================================================
-- Migration 025: Ingredients chip-vocab remap.
--
-- Aligns user-side `ingredients.type` and `ingredients.sub_type`
-- with the chip vocabularies defined in src/constants/appConstants.ts
-- (INGREDIENT_TYPES, SPIRIT_SUBTYPES, NA_SUBTYPES). Many rows from
-- earlier seed iterations stored canonical *subcategory* values
-- ('Carbonated', 'Aromatic', 'Fortified Wine', etc.) where the
-- chip vocabulary expects the parent chip ('Mixer', 'Bitters',
-- 'Vermouth', etc.).
--
-- Wells (is_well=true) are left as-is — their sub_type matches
-- WELL_CATEGORIES.subType (well-specific, not chip vocab).
--
-- Keyed by (name, type, sub_type) so we only touch rows that match
-- the legacy shape; recently-correct rows are untouched.
-- ============================================================


-- ------------------------------------------------------------
-- Non-Alc legacy subs → chip vocab
-- ------------------------------------------------------------

UPDATE ingredients SET sub_type='Mixer'
WHERE type='Non-Alc' AND sub_type='Carbonated';

UPDATE ingredients SET sub_type='Juice'
WHERE type='Non-Alc' AND sub_type='Citrus';


-- ------------------------------------------------------------
-- Prepped rows that are actually juices / mixers / garnishes
-- ------------------------------------------------------------

UPDATE ingredients SET type='Non-Alc', sub_type='Juice'
WHERE type='Prepped' AND name IN ('Cranberry Juice','Lime Juice') AND sub_type IN ('Berry','Citrus');

UPDATE ingredients SET type='Non-Alc', sub_type='Mixer'
WHERE type='Prepped' AND name='Ginger Beer' AND sub_type='Carbonated';

UPDATE ingredients SET type='Garnish', sub_type=NULL
WHERE type='Prepped' AND name IN ('Maraschino Cherry','Lemon Twist','Lime Wedge','Orange Twist')
  AND sub_type IN ('Cherry','Citrus');


-- ------------------------------------------------------------
-- Untyped Angostura → Spirit > Bitters
-- ------------------------------------------------------------

UPDATE ingredients SET type='Spirit', sub_type='Bitters'
WHERE name='Angostura Aromatic Bitters' AND type='Other' AND sub_type IS NULL;


-- ------------------------------------------------------------
-- Spirit chip-vocab fixes (canonical subcategory values stored
-- where chip parent was expected)
-- ------------------------------------------------------------

-- Bitters
UPDATE ingredients SET sub_type='Bitters'
WHERE type='Spirit' AND sub_type='Aromatic';

-- Liqueur (Aperitif Bitter is canonical sub, chip parent is Liqueur)
UPDATE ingredients SET sub_type='Liqueur'
WHERE type='Spirit' AND sub_type IN ('Aperitif Bitter','Orange');

-- Vermouth: 'Fortified Wine', 'Sweet', 'Other Spirit' (Lillet) → Vermouth.
-- Well rows (is_well=true) keep their well subType ('Sweet Vermouth' etc.).
UPDATE ingredients SET sub_type='Vermouth'
WHERE type='Spirit' AND sub_type IN ('Fortified Wine','Sweet') AND is_well=false;

UPDATE ingredients SET sub_type='Vermouth'
WHERE type='Spirit' AND sub_type='Other Spirit' AND name='Lillet Blanc';
