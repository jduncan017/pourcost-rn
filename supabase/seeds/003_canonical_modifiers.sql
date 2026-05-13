-- ============================================================
-- Seed 003: Canonical modifiers
--
-- Liqueurs, vermouth + aperitif wines, bitters, absinthe (under
-- Spirit category per locked taxonomy).
-- These are the "modifier" half of most cocktail recipes; the base
-- spirit is in 002_canonical_spirits.sql, the citrus and syrups
-- are in 001_canonical_ingredients.sql.
--
-- Taxonomy locked per docs/database_decisions.md.
--
-- Run AFTER migration 011_canonical_library_foundation.sql.
-- ============================================================


-- ============================================================
-- LIQUEURS (category = 'Liqueur')
-- Locked subs (20): Orange, Citrus, Cherry, Berry, Stone Fruit,
--   Tropical, Herbal, Anise, Coffee, Cream, Almond, Hazelnut,
--   Cacao, Floral, Mint, Vanilla, Spiced, Aperitif Bitter, Amaro, Other
-- ============================================================

INSERT INTO canonical_products (name, brand, category, subcategory, default_sizes, abv, origin, description, flavor_notes, enrichment_status)
VALUES
  ('Cointreau', 'Cointreau', 'Liqueur', 'Orange', '[{"kind":"milliliters","ml":750},{"kind":"milliliters","ml":1000}]'::jsonb, 40, 'France',
   'Premium triple sec. The default orange liqueur in Margaritas and Sidecars.',
   '["orange","sweet","floral"]'::jsonb, 'pending'),
  ('Triple Sec', NULL, 'Liqueur', 'Orange', '[{"kind":"milliliters","ml":750},{"kind":"milliliters","ml":1000}]'::jsonb, 30, NULL,
   'Generic orange liqueur. Lower-quality alternative to Cointreau.',
   '["orange","sweet"]'::jsonb, 'pending'),
  ('Grand Marnier', 'Grand Marnier', 'Liqueur', 'Orange', '[{"kind":"milliliters","ml":750},{"kind":"milliliters","ml":1000}]'::jsonb, 40, 'France',
   'Cognac-based orange liqueur. Richer and rounder than Cointreau; used in B-52 and Cadillac Margarita.',
   '["orange","cognac","caramel"]'::jsonb, 'pending'),
  ('Pierre Ferrand Dry Curacao', 'Pierre Ferrand', 'Liqueur', 'Orange', '[{"kind":"milliliters","ml":750}]'::jsonb, 40, 'France',
   'Cognac-based orange liqueur designed for classic cocktails. Bartender favorite.',
   '["orange","brandy","spice"]'::jsonb, 'pending'),
  ('Combier Liqueur d''Orange', 'Combier', 'Liqueur', 'Orange', '[{"kind":"milliliters","ml":750}]'::jsonb, 40, 'France',
   'Original triple sec recipe from 1834. Cocktail-quality orange liqueur.',
   '["orange","floral","clean"]'::jsonb, 'pending'),
  ('Campari', 'Campari', 'Liqueur', 'Aperitif Bitter', '[{"kind":"milliliters","ml":750},{"kind":"milliliters","ml":1000}]'::jsonb, 24, 'Italy',
   'Italian red aperitif bitter. The Negroni''s defining ingredient.',
   '["bitter","orange","herbal"]'::jsonb, 'pending'),
  ('Aperol', 'Aperol', 'Liqueur', 'Aperitif Bitter', '[{"kind":"milliliters","ml":750},{"kind":"milliliters","ml":1000}]'::jsonb, 11, 'Italy',
   'Lighter, sweeter cousin of Campari. Foundation of the Aperol Spritz.',
   '["bitter orange","gentian","sweet"]'::jsonb, 'pending'),
  ('St-Germain', 'St-Germain', 'Liqueur', 'Floral', '[{"kind":"milliliters","ml":750}]'::jsonb, 20, 'France',
   'Elderflower liqueur. The "bartender''s ketchup" of the 2010s; ubiquitous in modern cocktails.',
   '["elderflower","lychee","sweet"]'::jsonb, 'pending'),
  ('Chartreuse Green', 'Chartreuse', 'Liqueur', 'Herbal', '[{"kind":"milliliters","ml":750}]'::jsonb, 55, 'France',
   '110-proof French herbal liqueur made by Carthusian monks. 130 botanicals; iconic.',
   '["herbal","intense","grass"]'::jsonb, 'pending'),
  ('Chartreuse Yellow', 'Chartreuse', 'Liqueur', 'Herbal', '[{"kind":"milliliters","ml":750}]'::jsonb, 40, 'France',
   'Sweeter, lower-proof yellow Chartreuse. Honey notes alongside the herbal core.',
   '["herbal","honey","saffron"]'::jsonb, 'pending'),
  ('Luxardo Maraschino Liqueur', 'Luxardo', 'Liqueur', 'Cherry', '[{"kind":"milliliters","ml":750}]'::jsonb, 32, 'Italy',
   'Marasca cherry liqueur. Critical for the Aviation, Last Word, and Hemingway Daiquiri.',
   '["cherry pit","funky","floral"]'::jsonb, 'pending'),
  ('Kahlua', 'Kahlua', 'Liqueur', 'Coffee', '[{"kind":"milliliters","ml":750},{"kind":"milliliters","ml":1000},{"kind":"milliliters","ml":1750}]'::jsonb, 20, 'Mexico',
   'Coffee liqueur. White Russian and Espresso Martini standard.',
   '["coffee","sweet","vanilla"]'::jsonb, 'pending'),
  ('Mr. Black Cold Brew Coffee Liqueur', 'Mr. Black', 'Liqueur', 'Coffee', '[{"kind":"milliliters","ml":750}]'::jsonb, 25, 'Australia',
   'Premium cold brew coffee liqueur. Less sweet, more coffee-forward than Kahlua.',
   '["coffee","bitter","dark chocolate"]'::jsonb, 'pending'),
  ('Bailey''s Irish Cream', 'Bailey''s', 'Liqueur', 'Cream', '[{"kind":"milliliters","ml":750},{"kind":"milliliters","ml":1000}]'::jsonb, 17, 'Ireland',
   'Irish whiskey cream liqueur. Mudslides and Mind Erasers.',
   '["creamy","whiskey","chocolate"]'::jsonb, 'pending'),
  ('Disaronno Originale', 'Disaronno', 'Liqueur', 'Almond', '[{"kind":"milliliters","ml":750},{"kind":"milliliters","ml":1000}]'::jsonb, 28, 'Italy',
   'Almond-flavored liqueur (no actual almonds). Sour and Godfather standard.',
   '["almond","sweet","marzipan"]'::jsonb, 'pending'),
  ('Frangelico', 'Frangelico', 'Liqueur', 'Hazelnut', '[{"kind":"milliliters","ml":750}]'::jsonb, 20, 'Italy',
   'Hazelnut liqueur. Used in Nutty Irishmans and dessert cocktails.',
   '["hazelnut","vanilla","sweet"]'::jsonb, 'pending'),
  ('Drambuie', 'Drambuie', 'Liqueur', 'Herbal', '[{"kind":"milliliters","ml":750}]'::jsonb, 40, 'Scotland',
   'Scotch whisky liqueur with heather honey and herbs. Rusty Nail base.',
   '["honey","whisky","herbal"]'::jsonb, 'pending'),
  ('Galliano L''Autentico', 'Galliano', 'Liqueur', 'Herbal', '[{"kind":"milliliters","ml":750}]'::jsonb, 30, 'Italy',
   'Yellow Italian liqueur with vanilla and anise. Top of a Harvey Wallbanger.',
   '["vanilla","anise","herbal"]'::jsonb, 'pending'),
  ('Licor 43', 'Licor 43', 'Liqueur', 'Vanilla', '[{"kind":"milliliters","ml":750}]'::jsonb, 31, 'Spain',
   'Spanish 43-ingredient vanilla and citrus liqueur. Carajillo and modern dessert cocktails.',
   '["vanilla","citrus","sweet"]'::jsonb, 'pending'),
  ('Benedictine', 'Benedictine', 'Liqueur', 'Herbal', '[{"kind":"milliliters","ml":750}]'::jsonb, 40, 'France',
   'Herbal liqueur made by Benedictine monks since 1510. Vieux Carre and Singapore Sling.',
   '["herbal","honey","spice"]'::jsonb, 'pending'),
  ('B and B', 'Benedictine', 'Liqueur', 'Herbal', '[{"kind":"milliliters","ml":750}]'::jsonb, 40, 'France',
   '50/50 blend of Benedictine and brandy. Pre-mixed for ease.',
   '["herbal","brandy","oak"]'::jsonb, 'pending'),
  ('Chambord', 'Chambord', 'Liqueur', 'Berry', '[{"kind":"milliliters","ml":750}]'::jsonb, 16.5, 'France',
   'Black raspberry liqueur. French Martini and Kir Royale enhancer.',
   '["raspberry","blackberry","rich"]'::jsonb, 'pending'),
  ('Limoncello', NULL, 'Liqueur', 'Citrus', '[{"kind":"milliliters","ml":750}]'::jsonb, 28, 'Italy',
   'Lemon zest liqueur from southern Italy. Served chilled neat or in spritzes.',
   '["lemon","sweet","bright"]'::jsonb, 'pending'),
  ('Cynar', 'Cynar', 'Liqueur', 'Aperitif Bitter', '[{"kind":"milliliters","ml":750}]'::jsonb, 16.5, 'Italy',
   'Artichoke-based amaro. Vegetal bitterness; great in spritzes and stirred.',
   '["bitter","artichoke","caramel"]'::jsonb, 'pending'),
  ('Fernet-Branca', 'Fernet-Branca', 'Liqueur', 'Amaro', '[{"kind":"milliliters","ml":750}]'::jsonb, 39, 'Italy',
   'Intensely bitter Italian amaro. The bartender''s handshake.',
   '["bitter","menthol","saffron"]'::jsonb, 'pending'),
  ('Averna', 'Averna', 'Liqueur', 'Amaro', '[{"kind":"milliliters","ml":750}]'::jsonb, 29, 'Sicily, Italy',
   'Sweet, gentle Sicilian amaro. Approachable entry point to amari.',
   '["caramel","citrus","mild bitter"]'::jsonb, 'pending'),
  ('Montenegro', 'Amaro Montenegro', 'Liqueur', 'Amaro', '[{"kind":"milliliters","ml":750}]'::jsonb, 23, 'Italy',
   'Floral Italian amaro. Approachable; rose and orange notes.',
   '["floral","orange","light bitter"]'::jsonb, 'pending'),
  ('Nonino Quintessentia', 'Amaro Nonino', 'Liqueur', 'Amaro', '[{"kind":"milliliters","ml":750}]'::jsonb, 35, 'Italy',
   'Grappa-based amaro. Premium; central to the Paper Plane.',
   '["herbal","citrus","caramel"]'::jsonb, 'pending'),
  ('Pimm''s No. 1', 'Pimm''s', 'Liqueur', 'Other', '[{"kind":"milliliters","ml":750}]'::jsonb, 25, 'England',
   'Gin-based fruit cup liqueur. Foundation of the Pimm''s Cup.',
   '["fruity","herbal","citrus"]'::jsonb, 'pending'),
  ('Crème de Cassis', NULL, 'Liqueur', 'Berry', '[{"kind":"milliliters","ml":750}]'::jsonb, 15, 'France',
   'Blackcurrant liqueur. Kir and Kir Royale.',
   '["blackcurrant","sweet","tart"]'::jsonb, 'pending'),
  ('Crème de Violette', NULL, 'Liqueur', 'Floral', '[{"kind":"milliliters","ml":750}]'::jsonb, 22, NULL,
   'Violet flower liqueur. Aviation cocktail color and flavor.',
   '["floral","violet","sweet"]'::jsonb, 'pending'),
  ('Crème de Menthe (Green)', NULL, 'Liqueur', 'Mint', '[{"kind":"milliliters","ml":750}]'::jsonb, 25, NULL,
   'Mint-flavored green liqueur. Grasshopper and Stinger.',
   '["mint","sweet","cooling"]'::jsonb, 'pending'),
  ('Crème de Cacao (White)', NULL, 'Liqueur', 'Cacao', '[{"kind":"milliliters","ml":750}]'::jsonb, 25, NULL,
   'Clear chocolate liqueur. Brandy Alexander and dessert cocktails.',
   '["chocolate","sweet","vanilla"]'::jsonb, 'pending'),
  ('Crème de Cacao (Dark)', NULL, 'Liqueur', 'Cacao', '[{"kind":"milliliters","ml":750}]'::jsonb, 25, NULL,
   'Dark chocolate liqueur. Color and depth in dessert and martini-style drinks.',
   '["chocolate","sweet","dark"]'::jsonb, 'pending'),
  ('Sloe Gin', NULL, 'Liqueur', 'Berry', '[{"kind":"milliliters","ml":750}]'::jsonb, 25, NULL,
   'Gin infused with sloe berries. Sloe Gin Fizz; sweet-tart character.',
   '["plum","tart","sweet"]'::jsonb, 'pending'),
  ('Strega', 'Strega', 'Liqueur', 'Herbal', '[{"kind":"milliliters","ml":750}]'::jsonb, 40, 'Italy',
   '70-herb Italian liqueur. Saffron color; minty and floral.',
   '["mint","saffron","herbal"]'::jsonb, 'pending'),
  ('Ouzo', NULL, 'Liqueur', 'Anise', '[{"kind":"milliliters","ml":750}]'::jsonb, 40, 'Greece',
   'Greek anise liqueur. Turns cloudy with water (the louche effect).',
   '["anise","licorice","sweet"]'::jsonb, 'pending'),
  ('Sambuca', NULL, 'Liqueur', 'Anise', '[{"kind":"milliliters","ml":750}]'::jsonb, 40, 'Italy',
   'Italian anise liqueur. Often served as digestive shots with espresso.',
   '["anise","sweet","herbal"]'::jsonb, 'pending'),
  ('Cherry Heering', 'Heering', 'Liqueur', 'Cherry', '[{"kind":"milliliters","ml":750}]'::jsonb, 24, 'Denmark',
   'Danish dark cherry liqueur since 1818. Singapore Sling and Blood and Sand staple.',
   '["dark cherry","spice","sweet"]'::jsonb, 'pending'),
  ('Allspice Dram (Pimento)', NULL, 'Liqueur', 'Spiced', '[{"kind":"milliliters","ml":750}]'::jsonb, 30, 'Caribbean',
   'Allspice-infused rum-based liqueur. Tiki workhorse.',
   '["allspice","clove","cinnamon"]'::jsonb, 'pending'),
  ('Velvet Falernum', 'John D. Taylor''s', 'Liqueur', 'Spiced', '[{"kind":"milliliters","ml":750}]'::jsonb, 11, 'Barbados',
   'Lightly alcoholic falernum liqueur. Lime, ginger, almond, clove. Tiki essential.',
   '["lime","clove","almond"]'::jsonb, 'pending');


-- ============================================================
-- VERMOUTH + APERITIF WINES (category = 'Vermouth')
-- Locked subs: Dry / Sweet / Bianco / Aperitif Wine
-- ============================================================

INSERT INTO canonical_products (name, brand, category, subcategory, default_sizes, abv, origin, description, flavor_notes, enrichment_status)
VALUES
  ('Dolin Dry Vermouth', 'Dolin', 'Vermouth', 'Dry', '[{"kind":"milliliters","ml":750}]'::jsonb, 17.5, 'Chambery, France',
   'French dry vermouth. Bartender default for martinis.',
   '["herbal","mineral","crisp"]'::jsonb, 'pending'),
  ('Dolin Rouge', 'Dolin', 'Vermouth', 'Sweet', '[{"kind":"milliliters","ml":750}]'::jsonb, 16, 'Chambery, France',
   'Lighter, more delicate sweet vermouth. Modern Manhattan favorite.',
   '["herbal","caramel","light bitter"]'::jsonb, 'pending'),
  ('Carpano Antica Formula', 'Carpano', 'Vermouth', 'Sweet', '[{"kind":"milliliters","ml":750},{"kind":"milliliters","ml":1000}]'::jsonb, 16.5, 'Italy',
   'Premium sweet vermouth. Vanilla and chocolate richness; cocktail bar standard.',
   '["vanilla","chocolate","herbal"]'::jsonb, 'pending'),
  ('Cinzano Rosso', 'Cinzano', 'Vermouth', 'Sweet', '[{"kind":"milliliters","ml":750},{"kind":"milliliters","ml":1000}]'::jsonb, 15, 'Italy',
   'Affordable Italian sweet vermouth. Common well red vermouth.',
   '["caramel","herbal","sweet"]'::jsonb, 'pending'),
  ('Cinzano Bianco', 'Cinzano', 'Vermouth', 'Bianco', '[{"kind":"milliliters","ml":750}]'::jsonb, 15, 'Italy',
   'Sweet white vermouth. Used in modern white Negronis and spritzes.',
   '["floral","vanilla","sweet"]'::jsonb, 'pending'),
  ('Martini and Rossi Extra Dry', 'Martini and Rossi', 'Vermouth', 'Dry', '[{"kind":"milliliters","ml":750},{"kind":"milliliters","ml":1000},{"kind":"milliliters","ml":1750}]'::jsonb, 15, 'Italy',
   'Mass-market dry vermouth. Common well dry vermouth.',
   '["herbal","crisp","mild"]'::jsonb, 'pending'),
  ('Lillet Blanc', 'Lillet', 'Vermouth', 'Aperitif Wine', '[{"kind":"milliliters","ml":750}]'::jsonb, 17, 'France',
   'Fortified aperitif wine. Used in Vesper martini and modern brunch cocktails.',
   '["honey","orange","floral"]'::jsonb, 'pending'),
  ('Lillet Rosé', 'Lillet', 'Vermouth', 'Aperitif Wine', '[{"kind":"milliliters","ml":750}]'::jsonb, 17, 'France',
   'Pink Lillet introduced 2012. Strawberry notes alongside the classic profile.',
   '["strawberry","orange","floral"]'::jsonb, 'pending'),
  ('Cocchi Americano', 'Cocchi', 'Vermouth', 'Aperitif Wine', '[{"kind":"milliliters","ml":750}]'::jsonb, 16.5, 'Italy',
   'Quinine-fortified aperitif wine. Substitute for original Kina Lillet.',
   '["bitter quinine","orange","gentian"]'::jsonb, 'pending'),
  ('Cocchi Vermouth di Torino', 'Cocchi', 'Vermouth', 'Sweet', '[{"kind":"milliliters","ml":750}]'::jsonb, 16, 'Italy',
   'Premium Torino-style sweet vermouth. Bitter chocolate and herbal notes.',
   '["chocolate","cocoa","herbal"]'::jsonb, 'pending'),
  ('Punt e Mes', 'Punt e Mes', 'Vermouth', 'Sweet', '[{"kind":"milliliters","ml":750}]'::jsonb, 16, 'Italy',
   'Bitter sweet vermouth, "1.5 sweet, 0.5 bitter." Adds depth to negronis and Manhattans.',
   '["bitter","caramel","herbal"]'::jsonb, 'pending'),
  ('Bonal Gentiane Quina', 'Bonal', 'Vermouth', 'Aperitif Wine', '[{"kind":"milliliters","ml":750}]'::jsonb, 16, 'France',
   'Bitter-sweet aperitif wine with gentian and cinchona. Cult bartender ingredient.',
   '["bitter","quinine","spice"]'::jsonb, 'pending');


-- ============================================================
-- BITTERS (category = 'Bitters')
-- Locked subs: Aromatic / Orange / Chocolate / Other
-- Peychaud's lives in Aromatic per locked spec (anise-leaning but
-- still aromatic in function).
-- ============================================================

INSERT INTO canonical_products (name, brand, category, subcategory, default_sizes, abv, origin, description, flavor_notes, enrichment_status)
VALUES
  ('Angostura Aromatic Bitters', 'Angostura', 'Bitters', 'Aromatic', '[{"kind":"milliliters","ml":118}]'::jsonb, 44.7, 'Trinidad and Tobago',
   'The world''s most-used bitters. Spice and gentian; standard in Old Fashioneds and Manhattans.',
   '["spicy","gentian","clove"]'::jsonb, 'pending'),
  ('Peychaud''s Bitters', 'Peychaud''s', 'Bitters', 'Aromatic', '[{"kind":"milliliters","ml":300}]'::jsonb, 35, 'New Orleans, LA, USA',
   'Anise-forward bitters. Required for Sazeracs.',
   '["anise","cherry","floral"]'::jsonb, 'pending'),
  ('Regan''s Orange Bitters No. 6', 'Regan''s', 'Bitters', 'Orange', '[{"kind":"milliliters","ml":150}]'::jsonb, 45, NULL,
   'Modern orange bitters. Common cocktail-bar default for orange bitters.',
   '["orange peel","cardamom","spicy"]'::jsonb, 'pending'),
  ('Fee Brothers Orange Bitters', 'Fee Brothers', 'Bitters', 'Orange', '[{"kind":"milliliters","ml":150}]'::jsonb, 1.7, 'Rochester, NY, USA',
   'Lower-proof orange bitters. Sweeter and brighter than Regan''s.',
   '["orange","sweet"]'::jsonb, 'pending'),
  ('Fee Brothers Whiskey Barrel-Aged Bitters', 'Fee Brothers', 'Bitters', 'Aromatic', '[{"kind":"milliliters","ml":150}]'::jsonb, 17.5, 'Rochester, NY, USA',
   'Aromatic bitters aged in whiskey barrels. Depth for Old Fashioneds.',
   '["oak","spice","caramel"]'::jsonb, 'pending'),
  ('Bittermens Xocolatl Mole Bitters', 'Bittermens', 'Bitters', 'Chocolate', '[{"kind":"milliliters","ml":150}]'::jsonb, 44, 'USA',
   'Cacao and chili bitters. Adds depth to tequila and rum stirred drinks.',
   '["chocolate","chili","spicy"]'::jsonb, 'pending'),
  ('Bittermens Hellfire Habanero Shrub', 'Bittermens', 'Bitters', 'Other', '[{"kind":"milliliters","ml":150}]'::jsonb, 44, 'USA',
   'Habanero pepper bitters. For spicy margaritas and modern bloody mary tweaks.',
   '["habanero","spicy","tart"]'::jsonb, 'pending'),
  ('Scrappy''s Lavender Bitters', 'Scrappy''s', 'Bitters', 'Other', '[{"kind":"milliliters","ml":150}]'::jsonb, 50, 'Seattle, WA, USA',
   'Lavender-forward bitters. Modern gin and floral cocktail use.',
   '["lavender","floral","spice"]'::jsonb, 'pending');


-- ============================================================
-- ABSINTHE + PASTIS (category = 'Spirit' per locked taxonomy)
-- Anise spirits live under Spirit > Absinthe / Spirit > Pastis.
-- ============================================================

INSERT INTO canonical_products (name, brand, category, subcategory, default_sizes, abv, origin, description, flavor_notes, enrichment_status)
VALUES
  ('Pernod Absinthe', 'Pernod', 'Spirit', 'Absinthe', '[{"kind":"milliliters","ml":750}]'::jsonb, 68, 'France',
   'Modern Pernod absinthe (relaunched 2013). The historic name in absinthe.',
   '["anise","wormwood","fennel"]'::jsonb, 'pending'),
  ('St. George Absinthe Verte', 'St. George Spirits', 'Spirit', 'Absinthe', '[{"kind":"milliliters","ml":750}]'::jsonb, 60, 'Alameda, CA, USA',
   'First American absinthe legally distilled post-2007. Cult favorite.',
   '["anise","star anise","mint"]'::jsonb, 'pending'),
  ('Vieux Pontarlier Absinthe', 'Vieux Pontarlier', 'Spirit', 'Absinthe', '[{"kind":"milliliters","ml":750}]'::jsonb, 65, 'France',
   'Traditional French absinthe. Bartender favorite for Sazerac rinses.',
   '["anise","wormwood","herbal"]'::jsonb, 'pending'),
  ('Lucid Absinthe', 'Lucid', 'Spirit', 'Absinthe', '[{"kind":"milliliters","ml":750}]'::jsonb, 62, 'France',
   'Modern American-market absinthe. First brand legally sold in the US after the 2007 ban lift.',
   '["anise","wormwood","herbal"]'::jsonb, 'pending'),
  ('Pernod Pastis', 'Pernod', 'Spirit', 'Pastis', '[{"kind":"milliliters","ml":750}]'::jsonb, 40, 'France',
   'Anise-flavored aperitif (no wormwood). The post-absinthe-ban replacement; Marseille style.',
   '["anise","licorice","herbal"]'::jsonb, 'pending'),
  ('Ricard Pastis', 'Ricard', 'Spirit', 'Pastis', '[{"kind":"milliliters","ml":750}]'::jsonb, 45, 'France',
   'Marseille pastis. The most-poured aperitif in France.',
   '["anise","licorice","herbal"]'::jsonb, 'pending');
