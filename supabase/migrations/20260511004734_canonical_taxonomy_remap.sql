-- ============================================================
-- Migration 024: Canonical taxonomy remap (locked taxonomy per
-- docs/database_decisions.md).
--
-- Updates existing canonical_products rows (preserving id, so all
-- ingredients.canonical_product_id FK references remain intact).
--
-- Scope:
--   - Split Spirit > Whiskey/Rum/Tequila/Gin/Mezcal/Brandy into
--     locked subcategories.
--   - Move Absinthe rows from category='Absinthe' to category='Spirit'.
--   - Flatten Dairy/Egg/Spice subcategories to NULL.
--   - Remap Liqueur/Bitters/Vermouth/Mixer/Juice/Syrup/Garnish/
--     Prepped subcategories to locked vocabulary.
--   - Populate Wine.varietal where varietal is identifiable.
--
-- All updates are keyed by (name, brand) so FKs stay valid.
-- ============================================================


-- ============================================================
-- JUICE
-- ============================================================

UPDATE canonical_products SET subcategory='Other'
WHERE category='Juice' AND name='Apple Juice' AND brand IS NULL;


-- ============================================================
-- SYRUP — locked subs: Plain / Sweetener / Flavored / Spiced / Nut / Grenadine / Other
-- ============================================================

UPDATE canonical_products SET subcategory='Plain'
WHERE category='Syrup' AND name='Demerara Syrup' AND brand IS NULL;

UPDATE canonical_products SET subcategory='Sweetener'
WHERE category='Syrup' AND name IN ('Honey Syrup','Agave Syrup','Maple Syrup') AND brand IS NULL;

UPDATE canonical_products SET subcategory='Spiced'
WHERE category='Syrup' AND name IN ('Ginger Syrup','Cinnamon Syrup') AND brand IS NULL;

UPDATE canonical_products SET subcategory='Grenadine'
WHERE category='Syrup' AND name='Grenadine' AND brand IS NULL;

UPDATE canonical_products SET subcategory='Flavored'
WHERE category='Syrup' AND name IN ('Vanilla Syrup','Raspberry Syrup') AND brand IS NULL;


-- ============================================================
-- MIXER — locked subs: Soda / Energy / Cocktail Mix / Other
-- ============================================================

UPDATE canonical_products SET subcategory='Soda'
WHERE category='Mixer' AND subcategory='Carbonated';

-- Champagne (mixer use) was incorrectly tagged subcategory='Wine'.
-- Per locked Mixer subs, move to Other (it's a Mixer-category row
-- distinct from the Wine-category Champagne canonical in seed 004).
UPDATE canonical_products SET subcategory='Other'
WHERE category='Mixer' AND name='Champagne (mixer use)' AND brand IS NULL;


-- ============================================================
-- DAIRY / EGG / SPICE — flatten (subcategory = NULL)
-- ============================================================

UPDATE canonical_products SET subcategory=NULL
WHERE category IN ('Dairy','Egg','Spice');


-- ============================================================
-- GARNISH — locked subs: Citrus / Cherry / Olive / Onion / Herb / Rim / Other
-- ============================================================

UPDATE canonical_products SET subcategory='Onion'
WHERE category='Garnish' AND name='Cocktail Onion' AND brand IS NULL;

UPDATE canonical_products SET subcategory='Olive'
WHERE category='Garnish' AND name='Olive' AND brand IS NULL;


-- ============================================================
-- PREPPED — locked subs: Syrup / Infusion / Oleo Saccharum / Shrub / Tincture / Cordial / Other
-- ============================================================

UPDATE canonical_products SET subcategory='Oleo Saccharum'
WHERE category='Prepped' AND name='Oleo Saccharum' AND brand IS NULL;

UPDATE canonical_products SET subcategory='Shrub'
WHERE category='Prepped' AND name='Shrub (Berry)' AND brand IS NULL;


-- ============================================================
-- ABSINTHE → SPIRIT  (category change + subcategory locked)
-- ============================================================

UPDATE canonical_products SET category='Spirit', subcategory='Absinthe'
WHERE category='Absinthe' AND subcategory='Verte';

UPDATE canonical_products SET category='Spirit', subcategory='Pastis'
WHERE category='Absinthe' AND subcategory='Pastis';


-- ============================================================
-- SPIRIT > GIN  — split into locked sub styles
-- ============================================================

-- London Dry: classic juniper-forward style
UPDATE canonical_products SET subcategory='Gin: London Dry'
WHERE category='Spirit' AND subcategory='Gin' AND name IN (
  'Gin','London Dry Gin','Tanqueray London Dry','Tanqueray No. Ten',
  'Bombay Sapphire','Beefeater','Sipsmith London Dry','Bombay Original'
);

UPDATE canonical_products SET subcategory='Gin: Plymouth'
WHERE category='Spirit' AND subcategory='Gin' AND name='Plymouth';

-- Modern (New Western / contemporary botanical) style
UPDATE canonical_products SET subcategory='Gin: Modern'
WHERE category='Spirit' AND subcategory='Gin' AND name IN (
  'Hendrick''s','The Botanist','Aviation','Monkey 47','Empress 1908'
);


-- ============================================================
-- SPIRIT > RUM  — split into locked sub styles
-- ============================================================

UPDATE canonical_products SET subcategory='White Rum'
WHERE category='Spirit' AND subcategory='Rum' AND name IN (
  'White Rum','Bacardi Superior','Don Q Cristal','Plantation 3 Stars'
);

UPDATE canonical_products SET subcategory='Gold Rum'
WHERE category='Spirit' AND subcategory='Rum' AND name='Mount Gay Eclipse';

UPDATE canonical_products SET subcategory='Aged Rum'
WHERE category='Spirit' AND subcategory='Rum' AND name IN (
  'Aged Rum','Bacardi 8','Mount Gay Black Barrel','Appleton Estate Reserve Blend',
  'Diplomatico Reserva Exclusiva','Plantation Xaymaca'
);

UPDATE canonical_products SET subcategory='Dark Rum'
WHERE category='Spirit' AND subcategory='Rum' AND name IN ('Dark Rum','Goslings Black Seal');

UPDATE canonical_products SET subcategory='Spiced Rum'
WHERE category='Spirit' AND subcategory='Rum' AND name IN (
  'Spiced Rum','Captain Morgan Original Spiced','Sailor Jerry Spiced'
);

UPDATE canonical_products SET subcategory='Overproof Rum'
WHERE category='Spirit' AND subcategory='Rum' AND name IN (
  'Smith and Cross','Wray and Nephew White Overproof'
);

UPDATE canonical_products SET subcategory='Rhum Agricole'
WHERE category='Spirit' AND subcategory='Rum' AND name='Rhum Clement VSOP';


-- ============================================================
-- SPIRIT > TEQUILA  — split into locked sub styles
-- ============================================================

UPDATE canonical_products SET subcategory='Tequila Blanco'
WHERE category='Spirit' AND subcategory='Tequila' AND name IN (
  'Blanco Tequila','Patron Silver','Don Julio Blanco','Casamigos Blanco',
  'Herradura Silver','Espolon Blanco','El Tesoro Platinum','Fortaleza Blanco',
  'Siete Leguas Blanco'
);

UPDATE canonical_products SET subcategory='Tequila Reposado'
WHERE category='Spirit' AND subcategory='Tequila' AND name IN (
  'Reposado Tequila','Casamigos Reposado','Herradura Reposado','Cazadores Reposado'
);

UPDATE canonical_products SET subcategory='Tequila Anejo'
WHERE category='Spirit' AND subcategory='Tequila' AND name IN ('Anejo Tequila','Don Julio 1942');


-- ============================================================
-- SPIRIT > MEZCAL  — split into locked sub styles
-- ============================================================

UPDATE canonical_products SET subcategory='Mezcal Joven'
WHERE category='Spirit' AND subcategory='Mezcal' AND name IN (
  'Mezcal','Del Maguey Vida','Ilegal Joven','Montelobos'
);


-- ============================================================
-- SPIRIT > WHISKEY  — split into locked sub styles
-- ============================================================

-- Generic catchall: keep generic "Whiskey" as American Whiskey
UPDATE canonical_products SET subcategory='American Whiskey'
WHERE category='Spirit' AND subcategory='Whiskey' AND name='Whiskey' AND brand IS NULL;

UPDATE canonical_products SET subcategory='Bourbon'
WHERE category='Spirit' AND subcategory='Whiskey' AND name IN (
  'Bourbon','Maker''s Mark','Buffalo Trace','Woodford Reserve','Bulleit Bourbon',
  'Knob Creek','Four Roses Yellow Label','Wild Turkey 101','Elijah Craig Small Batch',
  'Eagle Rare','Old Forester 86 Proof','Old Forester 100 Proof','Larceny',
  'Evan Williams Black Label','Jim Beam White Label'
);

UPDATE canonical_products SET subcategory='Rye Whiskey'
WHERE category='Spirit' AND subcategory='Whiskey' AND name IN (
  'Rye Whiskey','Bulleit Rye','Rittenhouse Rye Bottled in Bond','Sazerac Rye',
  'High West Double Rye','Old Overholt','WhistlePig 10 Year'
);

UPDATE canonical_products SET subcategory='Scotch'
WHERE category='Spirit' AND subcategory='Whiskey' AND name IN (
  'Scotch Whisky','Johnnie Walker Black Label','Johnnie Walker Red Label',
  'Dewar''s White Label','Chivas Regal 12','Monkey Shoulder','Glenfiddich 12',
  'The Macallan 12 Double Cask','Laphroaig 10','Lagavulin 16','Highland Park 12',
  'Talisker 10','The Glenlivet 12'
);

UPDATE canonical_products SET subcategory='Irish Whiskey'
WHERE category='Spirit' AND subcategory='Whiskey' AND name IN (
  'Irish Whiskey','Jameson','Tullamore D.E.W.','Bushmills Original','Redbreast 12'
);

UPDATE canonical_products SET subcategory='Japanese Whisky'
WHERE category='Spirit' AND subcategory='Whiskey' AND name IN (
  'Suntory Toki','Nikka From the Barrel','Hibiki Japanese Harmony'
);

UPDATE canonical_products SET subcategory='Tennessee Whiskey'
WHERE category='Spirit' AND subcategory='Whiskey' AND name IN (
  'Jack Daniel''s Old No. 7','Gentleman Jack'
);

UPDATE canonical_products SET subcategory='Canadian Whisky'
WHERE category='Spirit' AND subcategory='Whiskey' AND name IN ('Crown Royal','Canadian Club');


-- ============================================================
-- SPIRIT > BRANDY  — split into locked sub styles
-- ============================================================

UPDATE canonical_products SET subcategory='Cognac'
WHERE category='Spirit' AND subcategory='Brandy' AND name IN (
  'Cognac','Hennessy VS','Hennessy VSOP','Remy Martin VSOP',
  'Pierre Ferrand 1840 Original Formula'
);

UPDATE canonical_products SET subcategory='Calvados'
WHERE category='Spirit' AND subcategory='Brandy' AND name='Calvados';

-- Laird's Bonded Apple Brandy is American apple brandy, not Normandy Calvados AOC;
-- Brandy catchall fits per locked spec ("Spanish, German, fruit brandies / eau-de-vie").
UPDATE canonical_products SET subcategory='Brandy'
WHERE category='Spirit' AND subcategory='Brandy' AND name='Laird''s Bonded Apple Brandy';


-- ============================================================
-- LIQUEUR — remap to locked 20-sub vocabulary
-- ============================================================

UPDATE canonical_products SET subcategory='Herbal'
WHERE category='Liqueur' AND name IN ('Drambuie','Galliano L''Autentico');

UPDATE canonical_products SET subcategory='Vanilla'
WHERE category='Liqueur' AND name='Licor 43';

UPDATE canonical_products SET subcategory='Aperitif Bitter'
WHERE category='Liqueur' AND name='Cynar';

UPDATE canonical_products SET subcategory='Other'
WHERE category='Liqueur' AND name='Pimm''s No. 1';


-- ============================================================
-- VERMOUTH — locked subs: Dry / Sweet / Bianco / Aperitif Wine
-- ============================================================

UPDATE canonical_products SET subcategory='Sweet'
WHERE category='Vermouth' AND name='Punt e Mes' AND subcategory='Sweet Bitter';


-- ============================================================
-- BITTERS — locked subs: Aromatic / Orange / Chocolate / Other
-- ============================================================

UPDATE canonical_products SET subcategory='Aromatic'
WHERE category='Bitters' AND name='Peychaud''s Bitters';

UPDATE canonical_products SET subcategory='Chocolate'
WHERE category='Bitters' AND name='Bittermens Xocolatl Mole Bitters';

UPDATE canonical_products SET subcategory='Other'
WHERE category='Bitters' AND name IN (
  'Bittermens Hellfire Habanero Shrub','Scrappy''s Lavender Bitters'
);


-- ============================================================
-- BEER — Farmhouse → Belgian per Josh's call
-- ============================================================

UPDATE canonical_products SET subcategory='Belgian'
WHERE category='Beer' AND subcategory='Farmhouse';


-- ============================================================
-- WINE — populate varietal where identifiable
-- ============================================================

UPDATE canonical_products SET varietal='Cabernet Sauvignon'
WHERE category='Wine' AND name='Cabernet Sauvignon' AND brand IS NULL;

UPDATE canonical_products SET varietal='Merlot'
WHERE category='Wine' AND name='Merlot' AND brand IS NULL;

UPDATE canonical_products SET varietal='Pinot Noir'
WHERE category='Wine' AND name='Pinot Noir' AND brand IS NULL;

UPDATE canonical_products SET varietal='Malbec'
WHERE category='Wine' AND name='Malbec' AND brand IS NULL;

UPDATE canonical_products SET varietal='Syrah/Shiraz'
WHERE category='Wine' AND name='Syrah / Shiraz' AND brand IS NULL;

UPDATE canonical_products SET varietal='Tempranillo'
WHERE category='Wine' AND name='Tempranillo' AND brand IS NULL;

UPDATE canonical_products SET varietal='Chardonnay'
WHERE category='Wine' AND name='Chardonnay' AND brand IS NULL;

UPDATE canonical_products SET varietal='Sauvignon Blanc'
WHERE category='Wine' AND name='Sauvignon Blanc' AND brand IS NULL;

UPDATE canonical_products SET varietal='Pinot Grigio'
WHERE category='Wine' AND name='Pinot Grigio / Pinot Gris' AND brand IS NULL;

UPDATE canonical_products SET varietal='Riesling'
WHERE category='Wine' AND name='Riesling' AND brand IS NULL;

UPDATE canonical_products SET varietal='Moscato'
WHERE category='Wine' AND name='Moscato' AND brand IS NULL;

UPDATE canonical_products SET varietal='Champagne Blend'
WHERE category='Wine' AND name='Champagne' AND brand IS NULL;

UPDATE canonical_products SET varietal='Glera'
WHERE category='Wine' AND name='Prosecco' AND brand IS NULL;

UPDATE canonical_products SET varietal='Macabeo Blend'
WHERE category='Wine' AND name='Cava' AND brand IS NULL;
