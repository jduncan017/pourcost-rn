-- ============================================================
-- Seed 004: Canonical beer + wine
--
-- Heavily weighted toward generics since most cocktails that use
-- beer or wine call for "any IPA" or "dry red" rather than a
-- specific brand. Specific entries are limited to products that
-- show up in named cocktails (Guinness in a Black Velvet,
-- Champagne in a French 75) or that are common bar SKUs.
--
-- Taxonomy locked per docs/database_decisions.md.
-- Wine.varietal populated where varietal is identifiable.
--
-- Run AFTER migration 011_canonical_library_foundation.sql.
-- ============================================================


-- ============================================================
-- BEER GENERICS (category = 'Beer', brand = NULL)
-- Locked subs (14): Lager, Pilsner, IPA, Pale Ale, Amber, Stout,
--   Porter, Wheat, Sour, Belgian, Ale (catchall), Cider,
--   Hard Seltzer, Other
-- ============================================================

INSERT INTO canonical_products (name, brand, category, subcategory, default_sizes, abv, origin, description, flavor_notes, enrichment_status)
VALUES
  ('IPA', NULL, 'Beer', 'IPA', '[{"kind":"milliliters","ml":355},{"kind":"milliliters","ml":473}]'::jsonb, 6.5, NULL,
   'Generic India Pale Ale. Hop-forward style with citrus and pine character.',
   '["hoppy","bitter","citrus"]'::jsonb, 'pending'),
  ('Pilsner', NULL, 'Beer', 'Pilsner', '[{"kind":"milliliters","ml":355},{"kind":"milliliters","ml":473}]'::jsonb, 4.8, NULL,
   'Generic Pilsner-style lager. Crisp, bitter, golden.',
   '["crisp","bitter","clean"]'::jsonb, 'pending'),
  ('Lager', NULL, 'Beer', 'Lager', '[{"kind":"milliliters","ml":355},{"kind":"milliliters","ml":473}]'::jsonb, 5, NULL,
   'Generic pale lager. Light, crisp, easy-drinking.',
   '["clean","crisp","light"]'::jsonb, 'pending'),
  ('Stout', NULL, 'Beer', 'Stout', '[{"kind":"milliliters","ml":355},{"kind":"milliliters","ml":473}]'::jsonb, 6, NULL,
   'Generic stout. Dark, roasted, often with coffee and chocolate notes.',
   '["roasted","coffee","chocolate"]'::jsonb, 'pending'),
  ('Porter', NULL, 'Beer', 'Porter', '[{"kind":"milliliters","ml":355},{"kind":"milliliters","ml":473}]'::jsonb, 5.5, NULL,
   'Generic porter. Dark and roasted but lighter than stout.',
   '["roasted","caramel","mild"]'::jsonb, 'pending'),
  ('Wheat Beer', NULL, 'Beer', 'Wheat', '[{"kind":"milliliters","ml":355},{"kind":"milliliters","ml":473}]'::jsonb, 5, NULL,
   'Generic wheat beer. Cloudy and soft; often served with citrus.',
   '["cloudy","soft","citrus"]'::jsonb, 'pending'),
  ('Hefeweizen', NULL, 'Beer', 'Wheat', '[{"kind":"milliliters","ml":500}]'::jsonb, 5.4, 'Germany',
   'Generic German wheat beer. Banana and clove esters from yeast.',
   '["banana","clove","cloudy"]'::jsonb, 'pending'),
  ('Saison', NULL, 'Beer', 'Belgian', '[{"kind":"milliliters","ml":355},{"kind":"milliliters","ml":750}]'::jsonb, 6.5, NULL,
   'Generic Belgian-style farmhouse ale. Dry, peppery, complex.',
   '["peppery","dry","fruity"]'::jsonb, 'pending'),
  ('Sour Ale', NULL, 'Beer', 'Sour', '[{"kind":"milliliters","ml":355},{"kind":"milliliters","ml":473}]'::jsonb, 5, NULL,
   'Generic sour beer. Tart, often fruited; modern craft style.',
   '["tart","fruity","dry"]'::jsonb, 'pending'),
  ('Mexican Lager', NULL, 'Beer', 'Lager', '[{"kind":"milliliters","ml":355},{"kind":"milliliters","ml":355}]'::jsonb, 4.5, 'Mexico',
   'Generic Mexican-style lager. Light and crisp; common in micheladas.',
   '["clean","light","crisp"]'::jsonb, 'pending'),
  ('Amber Ale', NULL, 'Beer', 'Amber', '[{"kind":"milliliters","ml":355},{"kind":"milliliters","ml":473}]'::jsonb, 5.5, NULL,
   'Generic amber ale. Caramel malt with moderate hop balance.',
   '["caramel","balanced","malty"]'::jsonb, 'pending'),
  ('Belgian Tripel', NULL, 'Beer', 'Belgian', '[{"kind":"milliliters","ml":330},{"kind":"milliliters","ml":750}]'::jsonb, 9, 'Belgium',
   'Generic Belgian tripel. Strong, golden, fruity esters from Belgian yeast.',
   '["fruity","strong","spice"]'::jsonb, 'pending');


-- ============================================================
-- BEER SPECIFIC (named in classic cocktails or common bar pours)
-- ============================================================

INSERT INTO canonical_products (name, brand, category, subcategory, default_sizes, abv, origin, description, flavor_notes, enrichment_status)
VALUES
  ('Guinness Draught', 'Guinness', 'Beer', 'Stout', '[{"kind":"milliliters","ml":440},{"kind":"milliliters","ml":355}]'::jsonb, 4.2, 'Dublin, Ireland',
   'Iconic Irish dry stout. Required for the Black Velvet and Black and Tan.',
   '["roasted","creamy","coffee"]'::jsonb, 'pending'),
  ('Modelo Especial', 'Modelo', 'Beer', 'Lager', '[{"kind":"milliliters","ml":355},{"kind":"milliliters","ml":650}]'::jsonb, 4.4, 'Mexico',
   'Mexican pilsner-style lager. Now the top-selling beer in the US.',
   '["crisp","clean","mild"]'::jsonb, 'pending'),
  ('Corona Extra', 'Corona', 'Beer', 'Lager', '[{"kind":"milliliters","ml":355},{"kind":"milliliters","ml":710}]'::jsonb, 4.5, 'Mexico',
   'Light Mexican lager. Standard with a lime wedge.',
   '["light","mild","clean"]'::jsonb, 'pending'),
  ('Pacifico', 'Pacifico', 'Beer', 'Lager', '[{"kind":"milliliters","ml":355}]'::jsonb, 4.4, 'Mexico',
   'Pilsner-style Mexican lager. Common in Tex-Mex and Baja food bars.',
   '["clean","crisp","light"]'::jsonb, 'pending'),
  ('Tecate', 'Tecate', 'Beer', 'Lager', '[{"kind":"milliliters","ml":355}]'::jsonb, 4.5, 'Mexico',
   'Mexican lager often used in micheladas.',
   '["mild","clean","crisp"]'::jsonb, 'pending'),
  ('Heineken', 'Heineken', 'Beer', 'Lager', '[{"kind":"milliliters","ml":330}]'::jsonb, 5, 'Netherlands',
   'Dutch pale lager. Globally distributed; standard import lager.',
   '["crisp","slightly hoppy","clean"]'::jsonb, 'pending'),
  ('Stella Artois', 'Stella Artois', 'Beer', 'Lager', '[{"kind":"milliliters","ml":330}]'::jsonb, 5, 'Belgium',
   'Belgian premium lager. Common upscale import draft.',
   '["crisp","floral","clean"]'::jsonb, 'pending'),
  ('Sierra Nevada Pale Ale', 'Sierra Nevada', 'Beer', 'Pale Ale', '[{"kind":"milliliters","ml":355}]'::jsonb, 5.6, 'Chico, CA, USA',
   'Foundational American pale ale. Cascade hops; reference example of the style.',
   '["pine","citrus","balanced"]'::jsonb, 'pending');


-- ============================================================
-- WINE GENERICS (category = 'Wine', brand = NULL)
-- Locked subs: Red / White / Rosé / Sparkling / Fortified
-- Varietal populated where identifiable (constrained vocab per
-- database_decisions.md).
-- ============================================================

INSERT INTO canonical_products (name, brand, category, subcategory, varietal, default_sizes, abv, origin, description, flavor_notes, enrichment_status)
VALUES
  ('Red Wine (Dry)', NULL, 'Wine', 'Red', NULL, '[{"kind":"milliliters","ml":750}]'::jsonb, 13.5, NULL,
   'Generic dry red wine. Use for sangria, mulled wine, beef braising cocktails.',
   '["fruity","dry","tannin"]'::jsonb, 'pending'),
  ('Red Wine (Sweet)', NULL, 'Wine', 'Red', NULL, '[{"kind":"milliliters","ml":750}]'::jsonb, 11, NULL,
   'Generic sweet red wine. Used in some sangrias and dessert cocktails.',
   '["sweet","fruity","jammy"]'::jsonb, 'pending'),
  ('White Wine (Dry)', NULL, 'Wine', 'White', NULL, '[{"kind":"milliliters","ml":750}]'::jsonb, 12, NULL,
   'Generic dry white wine. Use for white sangria, spritzes.',
   '["crisp","dry","floral"]'::jsonb, 'pending'),
  ('White Wine (Sweet)', NULL, 'Wine', 'White', NULL, '[{"kind":"milliliters","ml":750}]'::jsonb, 10, NULL,
   'Generic sweet white wine. Used in dessert cocktails and brunch drinks.',
   '["sweet","floral","fruity"]'::jsonb, 'pending'),
  ('Rosé', NULL, 'Wine', 'Rosé', NULL, '[{"kind":"milliliters","ml":750}]'::jsonb, 12.5, NULL,
   'Generic rosé wine. Provençal-style for spritzes and frosé.',
   '["fruity","crisp","light"]'::jsonb, 'pending'),
  ('Sparkling Wine (Dry)', NULL, 'Wine', 'Sparkling', NULL, '[{"kind":"milliliters","ml":750}]'::jsonb, 12, NULL,
   'Generic dry sparkling wine. Use for spritzes, French 75s, and toppers.',
   '["crisp","dry","effervescent"]'::jsonb, 'pending'),
  ('Champagne', NULL, 'Wine', 'Sparkling', 'Champagne Blend', '[{"kind":"milliliters","ml":750}]'::jsonb, 12, 'Champagne, France',
   'Generic Champagne. Méthode champenoise from the Champagne region. Used in classic French 75 and Champagne cocktails.',
   '["yeasty","crisp","mineral"]'::jsonb, 'pending'),
  ('Prosecco', NULL, 'Wine', 'Sparkling', 'Glera', '[{"kind":"milliliters","ml":750}]'::jsonb, 11, 'Veneto, Italy',
   'Italian sparkling wine from Glera grapes. Foundation of the Aperol Spritz and Bellini.',
   '["fruity","floral","light"]'::jsonb, 'pending'),
  ('Cava', NULL, 'Wine', 'Sparkling', 'Macabeo Blend', '[{"kind":"milliliters","ml":750}]'::jsonb, 11.5, 'Spain',
   'Spanish méthode champenoise sparkling wine. Affordable substitute for Champagne in cocktails.',
   '["yeasty","crisp","mineral"]'::jsonb, 'pending');


-- ============================================================
-- WINE VARIETALS (still wine specifics)
-- ============================================================

INSERT INTO canonical_products (name, brand, category, subcategory, varietal, default_sizes, abv, origin, description, flavor_notes, enrichment_status)
VALUES
  ('Cabernet Sauvignon', NULL, 'Wine', 'Red', 'Cabernet Sauvignon', '[{"kind":"milliliters","ml":750}]'::jsonb, 14, NULL,
   'Full-bodied red wine grape. Tannic with dark fruit; common in California and Bordeaux.',
   '["dark fruit","tannin","oak"]'::jsonb, 'pending'),
  ('Merlot', NULL, 'Wine', 'Red', 'Merlot', '[{"kind":"milliliters","ml":750}]'::jsonb, 13.5, NULL,
   'Medium-bodied red wine grape. Softer tannins than Cabernet.',
   '["plum","cherry","soft"]'::jsonb, 'pending'),
  ('Pinot Noir', NULL, 'Wine', 'Red', 'Pinot Noir', '[{"kind":"milliliters","ml":750}]'::jsonb, 13, NULL,
   'Light-bodied red wine grape. Bright acidity, red fruit, Burgundy origin.',
   '["red fruit","earthy","bright"]'::jsonb, 'pending'),
  ('Malbec', NULL, 'Wine', 'Red', 'Malbec', '[{"kind":"milliliters","ml":750}]'::jsonb, 13.5, NULL,
   'Argentinian red wine grape. Inky color, dark fruit, plush tannins.',
   '["dark fruit","plum","plush"]'::jsonb, 'pending'),
  ('Syrah / Shiraz', NULL, 'Wine', 'Red', 'Syrah/Shiraz', '[{"kind":"milliliters","ml":750}]'::jsonb, 14, NULL,
   'Bold red wine grape. Spicy, peppery; Rhone Valley and Australia.',
   '["pepper","dark fruit","spice"]'::jsonb, 'pending'),
  ('Tempranillo', NULL, 'Wine', 'Red', 'Tempranillo', '[{"kind":"milliliters","ml":750}]'::jsonb, 13.5, 'Spain',
   'Spanish red wine grape. Foundation of Rioja; cherry and leather.',
   '["cherry","leather","earthy"]'::jsonb, 'pending'),
  ('Chardonnay', NULL, 'Wine', 'White', 'Chardonnay', '[{"kind":"milliliters","ml":750}]'::jsonb, 13, NULL,
   'Versatile white wine grape. Ranges from crisp unoaked to buttery oaked.',
   '["apple","oak","creamy"]'::jsonb, 'pending'),
  ('Sauvignon Blanc', NULL, 'Wine', 'White', 'Sauvignon Blanc', '[{"kind":"milliliters","ml":750}]'::jsonb, 12.5, NULL,
   'Crisp white wine grape. Grass and citrus; New Zealand and Loire.',
   '["grass","citrus","crisp"]'::jsonb, 'pending'),
  ('Pinot Grigio / Pinot Gris', NULL, 'Wine', 'White', 'Pinot Grigio', '[{"kind":"milliliters","ml":750}]'::jsonb, 12, NULL,
   'Light white wine grape. Italian style is crisp; Alsatian style is richer.',
   '["pear","crisp","mild"]'::jsonb, 'pending'),
  ('Riesling', NULL, 'Wine', 'White', 'Riesling', '[{"kind":"milliliters","ml":750}]'::jsonb, 11, 'Germany',
   'Aromatic white wine grape. Ranges from bone-dry to dessert-sweet.',
   '["floral","apricot","mineral"]'::jsonb, 'pending'),
  ('Moscato', NULL, 'Wine', 'White', 'Moscato', '[{"kind":"milliliters","ml":750}]'::jsonb, 5.5, NULL,
   'Sweet, lightly sparkling white wine. Often dessert pairing.',
   '["sweet","floral","peach"]'::jsonb, 'pending');


-- ============================================================
-- FORTIFIED WINES (category = 'Wine', subcategory = 'Fortified')
-- Varietal nullable: port/sherry/madeira identify by style/region,
-- not grape.
-- ============================================================

INSERT INTO canonical_products (name, brand, category, subcategory, default_sizes, abv, origin, description, flavor_notes, enrichment_status)
VALUES
  ('Tawny Port', NULL, 'Wine', 'Fortified', '[{"kind":"milliliters","ml":750}]'::jsonb, 20, 'Portugal',
   'Generic tawny port. Aged in barrel; nutty and caramelized.',
   '["nutty","caramel","dried fruit"]'::jsonb, 'pending'),
  ('Ruby Port', NULL, 'Wine', 'Fortified', '[{"kind":"milliliters","ml":750}]'::jsonb, 20, 'Portugal',
   'Generic ruby port. Younger than tawny; bright fruit-forward.',
   '["dark fruit","sweet","robust"]'::jsonb, 'pending'),
  ('Fino Sherry', NULL, 'Wine', 'Fortified', '[{"kind":"milliliters","ml":750}]'::jsonb, 15, 'Andalusia, Spain',
   'Dry, pale sherry aged under flor. Saline and almond character.',
   '["saline","almond","dry"]'::jsonb, 'pending'),
  ('Manzanilla Sherry', NULL, 'Wine', 'Fortified', '[{"kind":"milliliters","ml":750}]'::jsonb, 15, 'Sanlucar de Barrameda, Spain',
   'Dry sherry from coastal Sanlucar. Saltier than Fino.',
   '["saline","floral","dry"]'::jsonb, 'pending'),
  ('Amontillado Sherry', NULL, 'Wine', 'Fortified', '[{"kind":"milliliters","ml":750}]'::jsonb, 17.5, 'Andalusia, Spain',
   'Sherry that has lost its flor; oxidative aging adds nutty complexity.',
   '["nutty","oxidative","dry"]'::jsonb, 'pending'),
  ('Oloroso Sherry', NULL, 'Wine', 'Fortified', '[{"kind":"milliliters","ml":750}]'::jsonb, 18, 'Andalusia, Spain',
   'Fully oxidized sherry. Walnut and dried fruit character; can be dry or sweetened.',
   '["walnut","dried fruit","rich"]'::jsonb, 'pending'),
  ('PX Sherry', NULL, 'Wine', 'Fortified', '[{"kind":"milliliters","ml":750}]'::jsonb, 17, 'Andalusia, Spain',
   'Pedro Ximenez sherry. Intensely sweet from sun-dried grapes; raisin and molasses.',
   '["raisin","molasses","sweet"]'::jsonb, 'pending'),
  ('Madeira (Bual)', NULL, 'Wine', 'Fortified', '[{"kind":"milliliters","ml":750}]'::jsonb, 19, 'Madeira, Portugal',
   'Heat-aged fortified wine from Madeira. Bual style is medium-sweet, nutty.',
   '["nutty","caramel","medium-sweet"]'::jsonb, 'pending');
