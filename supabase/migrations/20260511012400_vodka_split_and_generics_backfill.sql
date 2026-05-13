-- ============================================================
-- Migration 026: Vodka Plain/Flavored split + generics backfill.
--
-- Part 1: Split Vodka subcategory into Plain / Flavored
--   - Existing 13 Vodka rows → sub 'Plain' (all currently seeded brands
--     are unflavored)
--   - Add Flavored Vodka generic for recipe portability (orange vodka
--     cocktails resolve to flavored wells, not plain ones)
--
-- Part 2: Backfill generics for every locked Spirit/Liqueur/Vermouth/
--   Beer subcategory recipes might reference. Ensures cocktail
--   adoption can fall back to a generic when the bar lacks the
--   recipe's exact brand.
-- ============================================================


-- ============================================================
-- PART 1: VODKA SPLIT
-- ============================================================

UPDATE canonical_products SET subcategory='Plain'
WHERE category='Spirit' AND subcategory='Vodka';


-- ============================================================
-- PART 2: SPIRIT GENERICS BACKFILL
-- ============================================================

INSERT INTO canonical_products (name, brand, category, subcategory, default_sizes, abv, origin, description, flavor_notes, enrichment_status)
VALUES
  -- Vodka: Flavored generic
  ('Flavored Vodka', NULL, 'Spirit', 'Flavored', '[{"kind":"milliliters","ml":750},{"kind":"milliliters","ml":1000}]'::jsonb, 35, NULL,
   'Generic flavored vodka. Catchall for citrus, vanilla, berry, and other infused vodka SKUs. Use when recipe specifies a flavor profile but not a brand.',
   '["sweet","clean"]'::jsonb, 'pending'),

  -- Gin: missing 5 sub generics
  ('Plymouth Gin', NULL, 'Spirit', 'Gin: Plymouth', '[{"kind":"milliliters","ml":750}]'::jsonb, 41.2, 'Plymouth, England',
   'Generic Plymouth-style gin. Earthier and slightly sweeter than London Dry; protected designation.',
   '["earthy","juniper","root"]'::jsonb, 'pending'),
  ('Old Tom Gin', NULL, 'Spirit', 'Gin: Old Tom', '[{"kind":"milliliters","ml":750}]'::jsonb, 43, NULL,
   'Generic Old Tom gin. Sweetened pre-Prohibition style; used in Martinez and Tom Collins.',
   '["sweet","juniper","botanical"]'::jsonb, 'pending'),
  ('Genever', NULL, 'Spirit', 'Gin: Genever', '[{"kind":"milliliters","ml":750}]'::jsonb, 38, 'Netherlands',
   'Generic Dutch genever. Malt-base gin ancestor; richer and grain-forward.',
   '["malty","juniper","bread"]'::jsonb, 'pending'),
  ('Navy Strength Gin', NULL, 'Spirit', 'Gin: Navy Strength', '[{"kind":"milliliters","ml":750}]'::jsonb, 57, NULL,
   'Generic 114-proof gin. Higher proof carries botanicals through citrus and tonic.',
   '["juniper","intense","crisp"]'::jsonb, 'pending'),
  ('Modern Gin', NULL, 'Spirit', 'Gin: Modern', '[{"kind":"milliliters","ml":750}]'::jsonb, 42, NULL,
   'Generic New Western / contemporary botanical gin. Less juniper-forward; floral, citrus, or herbaceous lead.',
   '["floral","botanical","light juniper"]'::jsonb, 'pending'),

  -- Rum: missing 5 sub generics
  ('Gold Rum', NULL, 'Spirit', 'Gold Rum', '[{"kind":"milliliters","ml":750}]'::jsonb, 40, NULL,
   'Generic gold (amber) rum. Lightly aged blend; used in rum punches and Hurricanes.',
   '["caramel","oak","banana"]'::jsonb, 'pending'),
  ('Overproof Rum', NULL, 'Spirit', 'Overproof Rum', '[{"kind":"milliliters","ml":750}]'::jsonb, 63, NULL,
   'Generic overproof rum. 114+ proof; tiki backbone and float ingredient.',
   '["funky","intense","overproof"]'::jsonb, 'pending'),
  ('Rhum Agricole', NULL, 'Spirit', 'Rhum Agricole', '[{"kind":"milliliters","ml":750}]'::jsonb, 50, 'Martinique',
   'Generic rhum agricole. Made from fresh sugarcane juice; grassy and earthy vs molasses rums.',
   '["grassy","earthy","funky"]'::jsonb, 'pending'),
  ('Cachaça', NULL, 'Spirit', 'Cachaça', '[{"kind":"milliliters","ml":750}]'::jsonb, 40, 'Brazil',
   'Generic Brazilian cane spirit. Caipirinha base; distinct from molasses rum.',
   '["grassy","sweet","earthy"]'::jsonb, 'pending'),
  ('Other Rum', NULL, 'Spirit', 'Other Rum', '[{"kind":"milliliters","ml":750}]'::jsonb, 40, NULL,
   'Catchall for Clairin, Batavia Arrack, Aguardiente, and other regional cane spirits.',
   '["funky","earthy","complex"]'::jsonb, 'pending'),

  -- Tequila: missing 2 sub generics
  ('Extra Anejo Tequila', NULL, 'Spirit', 'Tequila Extra Anejo', '[{"kind":"milliliters","ml":750}]'::jsonb, 40, 'Jalisco, Mexico',
   'Generic Extra Anejo tequila. Aged 3+ years; sipping category, whiskey-like depth.',
   '["caramel","oak","rich"]'::jsonb, 'pending'),
  ('Cristalino Tequila', NULL, 'Spirit', 'Tequila Cristalino', '[{"kind":"milliliters","ml":750}]'::jsonb, 40, 'Jalisco, Mexico',
   'Generic Cristalino tequila. Aged then charcoal-filtered to clear; bridges aged complexity with blanco appearance.',
   '["agave","oak","smooth"]'::jsonb, 'pending'),

  -- Mezcal: missing 2 sub generics
  ('Reposado Mezcal', NULL, 'Spirit', 'Mezcal Reposado', '[{"kind":"milliliters","ml":750}]'::jsonb, 45, 'Oaxaca, Mexico',
   'Generic Reposado mezcal. Smoky agave aged 2-12 months; oak rounds the smoke.',
   '["smoky","agave","oak"]'::jsonb, 'pending'),
  ('Anejo Mezcal', NULL, 'Spirit', 'Mezcal Anejo', '[{"kind":"milliliters","ml":750}]'::jsonb, 45, 'Oaxaca, Mexico',
   'Generic Anejo mezcal. Smoky agave aged 1+ year; sipping category.',
   '["smoky","oak","caramel"]'::jsonb, 'pending'),

  -- Whiskey: missing 4 sub generics
  ('Tennessee Whiskey', NULL, 'Spirit', 'Tennessee Whiskey', '[{"kind":"milliliters","ml":750}]'::jsonb, 40, 'Tennessee, USA',
   'Generic Tennessee whiskey. Bourbon-like mash bill, charcoal-mellowed (Lincoln County Process).',
   '["caramel","banana","smooth"]'::jsonb, 'pending'),
  ('Japanese Whisky', NULL, 'Spirit', 'Japanese Whisky', '[{"kind":"milliliters","ml":750}]'::jsonb, 43, 'Japan',
   'Generic Japanese whisky. Built for highballs; elegant, floral, lightly malty.',
   '["floral","light","fruit"]'::jsonb, 'pending'),
  ('Canadian Whisky', NULL, 'Spirit', 'Canadian Whisky', '[{"kind":"milliliters","ml":750}]'::jsonb, 40, 'Canada',
   'Generic Canadian blended whisky. Soft, approachable; common Old Fashioned base.',
   '["smooth","grain","light spice"]'::jsonb, 'pending'),
  ('Other Whiskey', NULL, 'Spirit', 'Other Whiskey', '[{"kind":"milliliters","ml":750}]'::jsonb, 40, NULL,
   'Catchall for world whiskies that do not fit other regional subcategories.',
   '["grain","oak","mild"]'::jsonb, 'pending'),

  -- Brandy: missing 2 sub generics
  ('Armagnac', NULL, 'Spirit', 'Armagnac', '[{"kind":"milliliters","ml":750}]'::jsonb, 40, 'Gascony, France',
   'Generic French Armagnac. Column-still cousin of Cognac; richer and more rustic.',
   '["dried-fruit","oak","spice"]'::jsonb, 'pending'),
  ('Pisco', NULL, 'Spirit', 'Pisco', '[{"kind":"milliliters","ml":750}]'::jsonb, 40, 'Peru/Chile',
   'Generic South American grape brandy. Pisco Sour and Chilcano base.',
   '["floral","fruit","grape"]'::jsonb, 'pending'),

  -- East Asian / Nordic
  ('Aquavit', NULL, 'Spirit', 'Aquavit', '[{"kind":"milliliters","ml":750}]'::jsonb, 40, 'Scandinavia',
   'Generic Scandinavian caraway-and-dill spirit. Used in modern Nordic cocktails and traditional sippers.',
   '["caraway","herbal","spice"]'::jsonb, 'pending'),
  ('Soju', NULL, 'Spirit', 'Soju', '[{"kind":"milliliters","ml":375}]'::jsonb, 17, 'Korea',
   'Generic Korean soju. Neutral grain/sweet potato spirit; modern cocktail use as lower-ABV vodka substitute.',
   '["clean","slightly sweet","light"]'::jsonb, 'pending'),
  ('Shochu', NULL, 'Spirit', 'Shochu', '[{"kind":"milliliters","ml":750}]'::jsonb, 25, 'Japan',
   'Generic Japanese shochu. Distilled from barley, rice, sweet potato, or buckwheat. Highball and cocktail use.',
   '["clean","earthy","mild"]'::jsonb, 'pending'),
  ('Baijiu', NULL, 'Spirit', 'Baijiu', '[{"kind":"milliliters","ml":500}]'::jsonb, 52, 'China',
   'Generic Chinese baijiu. Sorghum-based; intensely aromatic. Emerging in modern cocktails.',
   '["funky","floral","intense"]'::jsonb, 'pending'),

  -- Other agave + adjacent
  ('Sotol', NULL, 'Spirit', 'Sotol', '[{"kind":"milliliters","ml":750}]'::jsonb, 45, 'Chihuahua, Mexico',
   'Generic sotol. Dasylirion-based (not agave); stocked alongside agave spirits. Earthy, herbaceous.',
   '["earthy","vegetal","herbal"]'::jsonb, 'pending'),
  ('Other Agave', NULL, 'Spirit', 'Other Agave', '[{"kind":"milliliters","ml":750}]'::jsonb, 45, 'Mexico',
   'Catchall for Raicilla, Bacanora, and other agave-derived spirits below the volume threshold for their own subcategory.',
   '["agave","earthy","smoky"]'::jsonb, 'pending'),

  -- Anise spirits — generic (separate from branded Pernod/Ricard rows)
  ('Absinthe', NULL, 'Spirit', 'Absinthe', '[{"kind":"milliliters","ml":750}]'::jsonb, 65, NULL,
   'Generic absinthe. Wormwood + anise + fennel; Sazerac rinse and modern bar staple.',
   '["anise","wormwood","fennel"]'::jsonb, 'pending'),
  ('Pastis', NULL, 'Spirit', 'Pastis', '[{"kind":"milliliters","ml":750}]'::jsonb, 40, 'France',
   'Generic pastis. Anise aperitif without wormwood; Marseille tradition.',
   '["anise","licorice","herbal"]'::jsonb, 'pending'),

  -- Catchall
  ('Other Spirit', NULL, 'Spirit', 'Other Spirit', '[{"kind":"milliliters","ml":750}]'::jsonb, 40, NULL,
   'Catchall for niche spirits below the volume threshold for their own subcategory (Korn, Singani, Marc, Slivovitz, etc.).',
   '["complex","earthy"]'::jsonb, 'pending');


-- ============================================================
-- LIQUEUR GENERICS — fill the missing 12 subs
-- ============================================================

INSERT INTO canonical_products (name, brand, category, subcategory, default_sizes, abv, origin, description, flavor_notes, enrichment_status)
VALUES
  ('Cherry Liqueur', NULL, 'Liqueur', 'Cherry', '[{"kind":"milliliters","ml":750}]'::jsonb, 24, NULL,
   'Generic cherry liqueur. Use when recipe calls for any cherry liqueur (Maraschino, Cherry Heering, Kirsch-style).',
   '["cherry","sweet","fruity"]'::jsonb, 'pending'),
  ('Stone Fruit Liqueur', NULL, 'Liqueur', 'Stone Fruit', '[{"kind":"milliliters","ml":750}]'::jsonb, 24, NULL,
   'Generic stone fruit liqueur (peach, apricot). Bellini and modern sour use.',
   '["stone-fruit","sweet","fruity"]'::jsonb, 'pending'),
  ('Tropical Liqueur', NULL, 'Liqueur', 'Tropical', '[{"kind":"milliliters","ml":750}]'::jsonb, 22, NULL,
   'Generic tropical fruit liqueur (passionfruit, mango, lychee, coconut, banana).',
   '["tropical","sweet","fruity"]'::jsonb, 'pending'),
  ('Herbal Liqueur', NULL, 'Liqueur', 'Herbal', '[{"kind":"milliliters","ml":750}]'::jsonb, 40, NULL,
   'Generic herbal liqueur. Catchall for Chartreuse-style, Bénédictine-style, Strega-style.',
   '["herbal","complex","sweet"]'::jsonb, 'pending'),
  ('Coffee Liqueur', NULL, 'Liqueur', 'Coffee', '[{"kind":"milliliters","ml":750}]'::jsonb, 20, NULL,
   'Generic coffee liqueur. Espresso Martini, White Russian, Black Russian.',
   '["coffee","sweet","dark-chocolate"]'::jsonb, 'pending'),
  ('Cream Liqueur', NULL, 'Liqueur', 'Cream', '[{"kind":"milliliters","ml":750}]'::jsonb, 17, NULL,
   'Generic cream liqueur (Irish cream style). Mudslides and dessert cocktails.',
   '["creamy","sweet","vanilla"]'::jsonb, 'pending'),
  ('Almond Liqueur', NULL, 'Liqueur', 'Almond', '[{"kind":"milliliters","ml":750}]'::jsonb, 28, NULL,
   'Generic almond liqueur (amaretto style).',
   '["almond","sweet","nutty"]'::jsonb, 'pending'),
  ('Hazelnut Liqueur', NULL, 'Liqueur', 'Hazelnut', '[{"kind":"milliliters","ml":750}]'::jsonb, 20, NULL,
   'Generic hazelnut liqueur.',
   '["hazelnut","nutty","sweet"]'::jsonb, 'pending'),
  ('Vanilla Liqueur', NULL, 'Liqueur', 'Vanilla', '[{"kind":"milliliters","ml":750}]'::jsonb, 31, NULL,
   'Generic vanilla liqueur (Licor 43 / Tuaca style).',
   '["vanilla","sweet","citrus"]'::jsonb, 'pending'),
  ('Aperitif Bitter', NULL, 'Liqueur', 'Aperitif Bitter', '[{"kind":"milliliters","ml":750}]'::jsonb, 16, NULL,
   'Generic aperitif bitter (Campari / Aperol / Suze style). Negroni and spritz base.',
   '["bitter","herbal","orange"]'::jsonb, 'pending'),
  ('Amaro', NULL, 'Liqueur', 'Amaro', '[{"kind":"milliliters","ml":750}]'::jsonb, 28, 'Italy',
   'Generic amaro. Use when recipe calls for any digestive amaro (Paper Plane, Black Manhattan).',
   '["bitter","herbal","caramel"]'::jsonb, 'pending'),
  ('Other Liqueur', NULL, 'Liqueur', 'Other', '[{"kind":"milliliters","ml":750}]'::jsonb, 25, NULL,
   'Catchall for liqueurs that do not fit other flavor subcategories.',
   '["sweet"]'::jsonb, 'pending');


-- ============================================================
-- VERMOUTH GENERICS — fill 2 missing subs
-- ============================================================

INSERT INTO canonical_products (name, brand, category, subcategory, default_sizes, abv, origin, description, flavor_notes, enrichment_status)
VALUES
  ('Bianco Vermouth', NULL, 'Vermouth', 'Bianco', '[{"kind":"milliliters","ml":750}]'::jsonb, 15, NULL,
   'Generic bianco vermouth. Sweet white vermouth; white Negroni and modern spritz base.',
   '["floral","vanilla","sweet"]'::jsonb, 'pending'),
  ('Aperitif Wine', NULL, 'Vermouth', 'Aperitif Wine', '[{"kind":"milliliters","ml":750}]'::jsonb, 17, NULL,
   'Generic aperitif wine (Lillet / Cocchi Americano / Bonal style). Vesper, Corpse Reviver No. 2.',
   '["honey","orange","floral"]'::jsonb, 'pending');


-- ============================================================
-- BEER GENERICS — fill missing subs
-- ============================================================

INSERT INTO canonical_products (name, brand, category, subcategory, default_sizes, abv, origin, description, flavor_notes, enrichment_status)
VALUES
  ('Pale Ale', NULL, 'Beer', 'Pale Ale', '[{"kind":"milliliters","ml":355},{"kind":"milliliters","ml":473}]'::jsonb, 5.5, NULL,
   'Generic American pale ale. Balanced hop-malt; less aggressive than IPA.',
   '["balanced","citrus","light bitter"]'::jsonb, 'pending'),
  ('Amber', NULL, 'Beer', 'Amber', '[{"kind":"milliliters","ml":355},{"kind":"milliliters","ml":473}]'::jsonb, 5.5, NULL,
   'Generic amber ale or lager. Caramel malt forward.',
   '["caramel","malty","balanced"]'::jsonb, 'pending'),
  ('Ale', NULL, 'Beer', 'Ale', '[{"kind":"milliliters","ml":355}]'::jsonb, 5, NULL,
   'Catchall ale (Brown, Scottish, Cream, Barleywine, etc.) outside the other beer subcategories.',
   '["malty","balanced"]'::jsonb, 'pending'),
  ('Cider', NULL, 'Beer', 'Cider', '[{"kind":"milliliters","ml":355},{"kind":"milliliters","ml":473}]'::jsonb, 5, NULL,
   'Generic hard cider. Fermented apple beverage; cocktail use in Stone Fence and modern fall drinks.',
   '["apple","crisp","slightly sweet"]'::jsonb, 'pending'),
  ('Hard Seltzer', NULL, 'Beer', 'Hard Seltzer', '[{"kind":"milliliters","ml":355}]'::jsonb, 5, NULL,
   'Generic hard seltzer. Flavored alcoholic sparkling water.',
   '["light","clean","citrus"]'::jsonb, 'pending'),
  ('Other Beer', NULL, 'Beer', 'Other', '[{"kind":"milliliters","ml":355}]'::jsonb, 5, NULL,
   'Catchall for beer styles not covered by the locked subcategory list.',
   '["malty"]'::jsonb, 'pending');