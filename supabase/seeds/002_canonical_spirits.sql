-- ============================================================
-- Seed 002: Canonical spirits (branded + generic)
--
-- Top brands across each spirit category, plus generic "any X"
-- canonicals so recipes can reference categories ("any whiskey")
-- without naming a specific brand.
--
-- ABV reflects the most common SKU's label proof for each brand.
-- Some brands have multiple expressions (Maker's Mark vs 46);
-- additional expressions can be added as separate canonicals
-- once Tier 2 enrichment fills out the catalog.
--
-- Run AFTER migration 011_canonical_library_foundation.sql.
-- ============================================================


-- ============================================================
-- GENERICS (category = 'Spirit', brand = NULL)
-- These are referenced by library recipes that should match
-- any product in the category. Recipe author chooses generic
-- vs specific based on intent.
-- ============================================================

INSERT INTO canonical_products (name, brand, category, subcategory, default_sizes, abv, origin, description, flavor_notes, enrichment_status)
VALUES
  ('Vodka', NULL, 'Spirit', 'Vodka', '[{"kind":"milliliters","ml":750},{"kind":"milliliters","ml":1000},{"kind":"milliliters","ml":1750}]'::jsonb, 40, NULL,
   'Generic vodka reference. Use when recipe works with any neutral spirit.',
   '["neutral","clean"]'::jsonb, 'pending'),
  ('Gin', NULL, 'Spirit', 'Gin', '[{"kind":"milliliters","ml":750},{"kind":"milliliters","ml":1000}]'::jsonb, 40, NULL,
   'Generic gin reference. Default to a London Dry style unless recipe calls for specific category.',
   '["juniper","botanical","crisp"]'::jsonb, 'pending'),
  ('London Dry Gin', NULL, 'Spirit', 'Gin', '[{"kind":"milliliters","ml":750},{"kind":"milliliters","ml":1000}]'::jsonb, 40, NULL,
   'Classic dry gin style. Juniper-forward with citrus and coriander.',
   '["juniper","crisp","citrus"]'::jsonb, 'pending'),
  ('White Rum', NULL, 'Spirit', 'Rum', '[{"kind":"milliliters","ml":750},{"kind":"milliliters","ml":1000},{"kind":"milliliters","ml":1750}]'::jsonb, 40, NULL,
   'Light, clear rum. Used in daiquiris, mojitos, and Cuban cocktails.',
   '["clean","sweet","light"]'::jsonb, 'pending'),
  ('Aged Rum', NULL, 'Spirit', 'Rum', '[{"kind":"milliliters","ml":750}]'::jsonb, 40, NULL,
   'Rum aged in oak. Color and depth from the barrel; used in Mai Tais and Old Fashioneds.',
   '["caramel","oak","sweet"]'::jsonb, 'pending'),
  ('Dark Rum', NULL, 'Spirit', 'Rum', '[{"kind":"milliliters","ml":750}]'::jsonb, 40, NULL,
   'Heavily caramel-colored, often molasses-rich rum. Tiki staple; used in Dark and Stormy.',
   '["molasses","rich","spiced"]'::jsonb, 'pending'),
  ('Spiced Rum', NULL, 'Spirit', 'Rum', '[{"kind":"milliliters","ml":750}]'::jsonb, 35, NULL,
   'Rum infused with spices like vanilla and cinnamon. Sweeter highball style.',
   '["spiced","sweet","vanilla"]'::jsonb, 'pending'),
  ('Blanco Tequila', NULL, 'Spirit', 'Tequila', '[{"kind":"milliliters","ml":750}]'::jsonb, 40, 'Mexico',
   'Unaged tequila. Sharp agave character; default for margaritas and palomas.',
   '["agave","peppery","crisp"]'::jsonb, 'pending'),
  ('Reposado Tequila', NULL, 'Spirit', 'Tequila', '[{"kind":"milliliters","ml":750}]'::jsonb, 40, 'Mexico',
   'Tequila aged 2 to 12 months in oak. Softer and rounder than blanco.',
   '["agave","oak","mellow"]'::jsonb, 'pending'),
  ('Anejo Tequila', NULL, 'Spirit', 'Tequila', '[{"kind":"milliliters","ml":750}]'::jsonb, 40, 'Mexico',
   'Tequila aged 1 to 3 years. Whiskey-like depth; used in stirred tequila drinks.',
   '["caramel","oak","agave"]'::jsonb, 'pending'),
  ('Mezcal', NULL, 'Spirit', 'Mezcal', '[{"kind":"milliliters","ml":750}]'::jsonb, 45, 'Mexico',
   'Smoky agave spirit. Generally roasted in earthen pits before distillation.',
   '["smoky","agave","earthy"]'::jsonb, 'pending'),
  ('Whiskey', NULL, 'Spirit', 'Whiskey', '[{"kind":"milliliters","ml":750},{"kind":"milliliters","ml":1000},{"kind":"milliliters","ml":1750}]'::jsonb, 40, NULL,
   'Generic whiskey reference. Use for recipes (like Old Fashioned) that work across whiskey styles.',
   '["oak","grain","caramel"]'::jsonb, 'pending'),
  ('Bourbon', NULL, 'Spirit', 'Whiskey', '[{"kind":"milliliters","ml":750},{"kind":"milliliters","ml":1000},{"kind":"milliliters","ml":1750}]'::jsonb, 45, 'Kentucky, USA',
   'Generic bourbon reference. Sweeter, corn-forward whiskey. Default to roughly 90 proof brand.',
   '["caramel","vanilla","oak"]'::jsonb, 'pending'),
  ('Rye Whiskey', NULL, 'Spirit', 'Whiskey', '[{"kind":"milliliters","ml":750},{"kind":"milliliters","ml":1000}]'::jsonb, 45, 'USA',
   'Generic rye reference. Spicier and drier than bourbon. Default for Manhattans, Sazeracs.',
   '["spicy","peppery","grain"]'::jsonb, 'pending'),
  ('Scotch Whisky', NULL, 'Spirit', 'Whiskey', '[{"kind":"milliliters","ml":750}]'::jsonb, 40, 'Scotland',
   'Generic Scotch reference. Default to a blended style; single malts vary widely.',
   '["malty","oak","earthy"]'::jsonb, 'pending'),
  ('Irish Whiskey', NULL, 'Spirit', 'Whiskey', '[{"kind":"milliliters","ml":750}]'::jsonb, 40, 'Ireland',
   'Generic Irish whiskey. Smoother and lighter than Scotch; triple distillation typical.',
   '["smooth","light","grain"]'::jsonb, 'pending'),
  ('Cognac', NULL, 'Spirit', 'Brandy', '[{"kind":"milliliters","ml":750}]'::jsonb, 40, 'France',
   'Brandy from the Cognac region of France. Used in Sidecars, Sazeracs, Vieux Carre.',
   '["fruity","oak","floral"]'::jsonb, 'pending'),
  ('Brandy', NULL, 'Spirit', 'Brandy', '[{"kind":"milliliters","ml":750}]'::jsonb, 40, NULL,
   'Generic grape brandy. Use for cocktails that don''t require Cognac''s region specificity.',
   '["fruity","oak"]'::jsonb, 'pending');


-- ============================================================
-- VODKA (specific brands)
-- ============================================================

INSERT INTO canonical_products (name, brand, category, subcategory, default_sizes, abv, origin, description, flavor_notes, enrichment_status)
VALUES
  ('Tito''s Handmade Vodka', 'Tito''s', 'Spirit', 'Vodka', '[{"kind":"milliliters","ml":750},{"kind":"milliliters","ml":1000},{"kind":"milliliters","ml":1750}]'::jsonb, 40, 'Austin, TX, USA',
   'Corn-based American vodka. The top-selling spirit in the US.',
   '["clean","slightly sweet","smooth"]'::jsonb, 'pending'),
  ('Grey Goose', 'Grey Goose', 'Spirit', 'Vodka', '[{"kind":"milliliters","ml":750},{"kind":"milliliters","ml":1000},{"kind":"milliliters","ml":1750}]'::jsonb, 40, 'France',
   'French wheat-based vodka. Premium positioning; used in upscale bar programs.',
   '["soft","mineral","smooth"]'::jsonb, 'pending'),
  ('Ketel One', 'Ketel One', 'Spirit', 'Vodka', '[{"kind":"milliliters","ml":750},{"kind":"milliliters","ml":1000},{"kind":"milliliters","ml":1750}]'::jsonb, 40, 'Netherlands',
   'Dutch wheat-based vodka. Crisp, slightly peppery character.',
   '["crisp","peppery","clean"]'::jsonb, 'pending'),
  ('Absolut', 'Absolut', 'Spirit', 'Vodka', '[{"kind":"milliliters","ml":750},{"kind":"milliliters","ml":1000},{"kind":"milliliters","ml":1750}]'::jsonb, 40, 'Sweden',
   'Swedish wheat-based vodka. Widely available; standard well vodka in many bars.',
   '["clean","grain","mild"]'::jsonb, 'pending'),
  ('Smirnoff', 'Smirnoff', 'Spirit', 'Vodka', '[{"kind":"milliliters","ml":750},{"kind":"milliliters","ml":1000},{"kind":"milliliters","ml":1750}]'::jsonb, 40, 'Various',
   'Mass-market vodka. Common well spirit.',
   '["neutral","clean"]'::jsonb, 'pending'),
  ('Belvedere', 'Belvedere', 'Spirit', 'Vodka', '[{"kind":"milliliters","ml":750},{"kind":"milliliters","ml":1000}]'::jsonb, 40, 'Poland',
   'Polish rye-based vodka. Premium grain character.',
   '["rye","creamy","slightly sweet"]'::jsonb, 'pending'),
  ('Stolichnaya', 'Stolichnaya', 'Spirit', 'Vodka', '[{"kind":"milliliters","ml":750},{"kind":"milliliters","ml":1000}]'::jsonb, 40, 'Latvia',
   'Wheat and rye blend vodka. Often called Stoli; classic Bloody Mary base.',
   '["grain","mild","clean"]'::jsonb, 'pending'),
  ('Chopin', 'Chopin', 'Spirit', 'Vodka', '[{"kind":"milliliters","ml":750}]'::jsonb, 40, 'Poland',
   'Polish potato vodka. Creamy and full-bodied compared to grain vodkas.',
   '["creamy","earthy","full-bodied"]'::jsonb, 'pending'),
  ('Hangar 1', 'Hangar 1', 'Spirit', 'Vodka', '[{"kind":"milliliters","ml":750}]'::jsonb, 40, 'Alameda, CA, USA',
   'California craft vodka. Wheat and grape blend.',
   '["clean","subtle fruit"]'::jsonb, 'pending'),
  ('Deep Eddy', 'Deep Eddy', 'Spirit', 'Vodka', '[{"kind":"milliliters","ml":750},{"kind":"milliliters","ml":1000},{"kind":"milliliters","ml":1750}]'::jsonb, 40, 'Austin, TX, USA',
   'Texas-made corn-based vodka. Known for flavored expressions.',
   '["clean","slightly sweet"]'::jsonb, 'pending'),
  ('Reyka', 'Reyka', 'Spirit', 'Vodka', '[{"kind":"milliliters","ml":750}]'::jsonb, 40, 'Iceland',
   'Icelandic vodka filtered through volcanic rock. Wheat and barley blend.',
   '["clean","mineral","crisp"]'::jsonb, 'pending'),
  ('Hangar One', 'Hangar 1', 'Spirit', 'Vodka', '[{"kind":"milliliters","ml":750}]'::jsonb, 40, 'Alameda, CA, USA',
   'Premium American craft vodka with citrus expressions popular in bars.',
   '["citrus","clean"]'::jsonb, 'pending');


-- ============================================================
-- GIN (specific brands)
-- ============================================================

INSERT INTO canonical_products (name, brand, category, subcategory, default_sizes, abv, origin, description, flavor_notes, enrichment_status)
VALUES
  ('Tanqueray London Dry', 'Tanqueray', 'Spirit', 'Gin', '[{"kind":"milliliters","ml":750},{"kind":"milliliters","ml":1000},{"kind":"milliliters","ml":1750}]'::jsonb, 47.3, 'England',
   'Classic London Dry gin. Juniper-forward with coriander and angelica. The default cocktail gin for many bartenders.',
   '["juniper","crisp","citrus"]'::jsonb, 'pending'),
  ('Tanqueray No. Ten', 'Tanqueray', 'Spirit', 'Gin', '[{"kind":"milliliters","ml":750}]'::jsonb, 47.3, 'England',
   'Tanqueray''s premium expression. Fresh citrus and chamomile from a small still ("Tiny Ten").',
   '["citrus","floral","crisp"]'::jsonb, 'pending'),
  ('Bombay Sapphire', 'Bombay', 'Spirit', 'Gin', '[{"kind":"milliliters","ml":750},{"kind":"milliliters","ml":1000},{"kind":"milliliters","ml":1750}]'::jsonb, 47, 'England',
   'Vapor-infused London Dry gin. Lighter juniper than Tanqueray with prominent botanical character.',
   '["light juniper","floral","citrus"]'::jsonb, 'pending'),
  ('Hendrick''s', 'Hendrick''s', 'Spirit', 'Gin', '[{"kind":"milliliters","ml":750},{"kind":"milliliters","ml":1000}]'::jsonb, 44, 'Scotland',
   'Scottish gin with cucumber and rose. Distinctive perfumed style; serves traditionally with cucumber.',
   '["cucumber","rose","floral"]'::jsonb, 'pending'),
  ('Beefeater', 'Beefeater', 'Spirit', 'Gin', '[{"kind":"milliliters","ml":750},{"kind":"milliliters","ml":1000}]'::jsonb, 47, 'England',
   'Traditional London Dry, distilled in central London. Strong juniper and citrus.',
   '["juniper","citrus","classic"]'::jsonb, 'pending'),
  ('Plymouth', 'Plymouth', 'Spirit', 'Gin', '[{"kind":"milliliters","ml":750}]'::jsonb, 41.2, 'Plymouth, England',
   'Geographically protected gin from Plymouth. Earthier and slightly sweeter than London Dry.',
   '["earthy","mellow juniper","root"]'::jsonb, 'pending'),
  ('The Botanist', 'The Botanist', 'Spirit', 'Gin', '[{"kind":"milliliters","ml":750}]'::jsonb, 46, 'Islay, Scotland',
   'Made by Bruichladdich on Islay. 22 hand-foraged Islay botanicals.',
   '["botanical","floral","herbal"]'::jsonb, 'pending'),
  ('Aviation', 'Aviation', 'Spirit', 'Gin', '[{"kind":"milliliters","ml":750}]'::jsonb, 42, 'Portland, OR, USA',
   'New American gin style. Less juniper-heavy, with lavender and cardamom.',
   '["floral","lavender","mild juniper"]'::jsonb, 'pending'),
  ('Sipsmith London Dry', 'Sipsmith', 'Spirit', 'Gin', '[{"kind":"milliliters","ml":750}]'::jsonb, 41.6, 'London, England',
   'Modern small-batch London Dry. Founded 2009; helped revive London distilling.',
   '["juniper","citrus","classic"]'::jsonb, 'pending'),
  ('Monkey 47', 'Monkey 47', 'Spirit', 'Gin', '[{"kind":"milliliters","ml":500}]'::jsonb, 47, 'Black Forest, Germany',
   'Black Forest gin made with 47 botanicals. Complex and pricey.',
   '["botanical","peppery","forest"]'::jsonb, 'pending'),
  ('Empress 1908', 'Empress', 'Spirit', 'Gin', '[{"kind":"milliliters","ml":750}]'::jsonb, 42.5, 'Victoria, BC, Canada',
   'Indigo color from butterfly pea flower; turns pink with citrus. Visual impact gin.',
   '["floral","grapefruit","tea"]'::jsonb, 'pending'),
  ('Bombay Original', 'Bombay', 'Spirit', 'Gin', '[{"kind":"milliliters","ml":750},{"kind":"milliliters","ml":1000}]'::jsonb, 43, 'England',
   'The original Bombay before Sapphire. London Dry with eight botanicals.',
   '["juniper","classic","crisp"]'::jsonb, 'pending');


-- ============================================================
-- RUM (specific brands)
-- ============================================================

INSERT INTO canonical_products (name, brand, category, subcategory, default_sizes, abv, origin, description, flavor_notes, enrichment_status)
VALUES
  ('Bacardi Superior', 'Bacardi', 'Spirit', 'Rum', '[{"kind":"milliliters","ml":750},{"kind":"milliliters","ml":1000},{"kind":"milliliters","ml":1750}]'::jsonb, 40, 'Puerto Rico',
   'Light, filtered Cuban-style rum. The default white rum for daiquiris and mojitos in most bars.',
   '["clean","light","subtle sweetness"]'::jsonb, 'pending'),
  ('Bacardi 8', 'Bacardi', 'Spirit', 'Rum', '[{"kind":"milliliters","ml":750}]'::jsonb, 40, 'Puerto Rico',
   'Aged 8 years. Used as a sipping rum and in stirred rum cocktails.',
   '["caramel","oak","vanilla"]'::jsonb, 'pending'),
  ('Don Q Cristal', 'Don Q', 'Spirit', 'Rum', '[{"kind":"milliliters","ml":750},{"kind":"milliliters","ml":1000}]'::jsonb, 40, 'Puerto Rico',
   'Light Puerto Rican rum. Preferred at many cocktail bars over Bacardi for daiquiris.',
   '["clean","subtle vanilla","crisp"]'::jsonb, 'pending'),
  ('Plantation 3 Stars', 'Plantation', 'Spirit', 'Rum', '[{"kind":"milliliters","ml":750}]'::jsonb, 41.2, 'Caribbean',
   'Blend of Trinidad, Barbados, and Jamaica rums. Modern bar workhorse white rum.',
   '["funky","tropical","light"]'::jsonb, 'pending'),
  ('Mount Gay Eclipse', 'Mount Gay', 'Spirit', 'Rum', '[{"kind":"milliliters","ml":750},{"kind":"milliliters","ml":1000}]'::jsonb, 40, 'Barbados',
   'Bajan blended rum. Classic for rum punches and Hurricanes.',
   '["caramel","oak","banana"]'::jsonb, 'pending'),
  ('Mount Gay Black Barrel', 'Mount Gay', 'Spirit', 'Rum', '[{"kind":"milliliters","ml":750}]'::jsonb, 43, 'Barbados',
   'Mount Gay finished in heavily charred bourbon barrels.',
   '["smoke","oak","spice"]'::jsonb, 'pending'),
  ('Appleton Estate Reserve Blend', 'Appleton Estate', 'Spirit', 'Rum', '[{"kind":"milliliters","ml":750}]'::jsonb, 40, 'Jamaica',
   'Jamaican blended rum with funky pot still character. Used in Mai Tais and tiki drinks.',
   '["funky","banana","tropical"]'::jsonb, 'pending'),
  ('Diplomatico Reserva Exclusiva', 'Diplomatico', 'Spirit', 'Rum', '[{"kind":"milliliters","ml":750}]'::jsonb, 40, 'Venezuela',
   'Sweet, dessert-style aged rum. Popular for sipping and rum Old Fashioneds.',
   '["sweet","caramel","dried fruit"]'::jsonb, 'pending'),
  ('Plantation Xaymaca', 'Plantation', 'Spirit', 'Rum', '[{"kind":"milliliters","ml":750}]'::jsonb, 43, 'Jamaica',
   'High-ester Jamaican rum. Funky pot still character; tiki favorite.',
   '["funky","tropical","banana"]'::jsonb, 'pending'),
  ('Smith and Cross', 'Smith and Cross', 'Spirit', 'Rum', '[{"kind":"milliliters","ml":750}]'::jsonb, 57, 'Jamaica',
   'Navy strength Jamaican pot still rum. Intense funk; backbone of many tiki recipes.',
   '["intense funk","overripe banana","high-proof"]'::jsonb, 'pending'),
  ('Wray and Nephew White Overproof', 'Wray and Nephew', 'Spirit', 'Rum', '[{"kind":"milliliters","ml":750}]'::jsonb, 63, 'Jamaica',
   'White overproof Jamaican rum. Classic Tiki and Caribbean cocktail booster.',
   '["funky","intense","overproof"]'::jsonb, 'pending'),
  ('Captain Morgan Original Spiced', 'Captain Morgan', 'Spirit', 'Rum', '[{"kind":"milliliters","ml":750},{"kind":"milliliters","ml":1000},{"kind":"milliliters","ml":1750}]'::jsonb, 35, 'Various',
   'Best-selling spiced rum in the US. Vanilla-forward; mass market.',
   '["vanilla","spiced","sweet"]'::jsonb, 'pending'),
  ('Sailor Jerry Spiced', 'Sailor Jerry', 'Spirit', 'Rum', '[{"kind":"milliliters","ml":750}]'::jsonb, 46, 'Caribbean',
   'Higher-proof spiced rum than Captain Morgan. Vanilla and cinnamon dominant.',
   '["vanilla","cinnamon","spiced"]'::jsonb, 'pending'),
  ('Goslings Black Seal', 'Goslings', 'Spirit', 'Rum', '[{"kind":"milliliters","ml":750},{"kind":"milliliters","ml":1000}]'::jsonb, 40, 'Bermuda',
   'Bermudian dark rum. Required for an authentic Dark and Stormy.',
   '["molasses","dark","caramel"]'::jsonb, 'pending'),
  ('Rhum Clement VSOP', 'Clement', 'Spirit', 'Rum', '[{"kind":"milliliters","ml":750}]'::jsonb, 40, 'Martinique',
   'Aged rhum agricole made from sugarcane juice. Grass and earth instead of molasses.',
   '["grassy","earthy","funky"]'::jsonb, 'pending');


-- ============================================================
-- TEQUILA + MEZCAL (specific brands)
-- ============================================================

INSERT INTO canonical_products (name, brand, category, subcategory, default_sizes, abv, origin, description, flavor_notes, enrichment_status)
VALUES
  ('Patron Silver', 'Patron', 'Spirit', 'Tequila', '[{"kind":"milliliters","ml":750},{"kind":"milliliters","ml":1000},{"kind":"milliliters","ml":1750}]'::jsonb, 40, 'Jalisco, Mexico',
   'Premium blanco tequila. Smooth, slightly sweet; mass-market premium.',
   '["agave","peppery","smooth"]'::jsonb, 'pending'),
  ('Don Julio Blanco', 'Don Julio', 'Spirit', 'Tequila', '[{"kind":"milliliters","ml":750},{"kind":"milliliters","ml":1000}]'::jsonb, 40, 'Jalisco, Mexico',
   'Premium blanco. Bright agave with white pepper finish.',
   '["agave","pepper","bright"]'::jsonb, 'pending'),
  ('Don Julio 1942', 'Don Julio', 'Spirit', 'Tequila', '[{"kind":"milliliters","ml":750}]'::jsonb, 38, 'Jalisco, Mexico',
   'Don Julio''s premium anejo. Distinctive bottle; popular for sipping.',
   '["caramel","oak","vanilla"]'::jsonb, 'pending'),
  ('Casamigos Blanco', 'Casamigos', 'Spirit', 'Tequila', '[{"kind":"milliliters","ml":750},{"kind":"milliliters","ml":1000}]'::jsonb, 40, 'Jalisco, Mexico',
   'Celebrity-founded blanco. Smooth and sweet; popular at upscale cocktail bars.',
   '["sweet","mild agave","smooth"]'::jsonb, 'pending'),
  ('Casamigos Reposado', 'Casamigos', 'Spirit', 'Tequila', '[{"kind":"milliliters","ml":750}]'::jsonb, 40, 'Jalisco, Mexico',
   'Reposado from Casamigos. Caramel and oak with the softness Casamigos is known for.',
   '["caramel","oak","mellow"]'::jsonb, 'pending'),
  ('Herradura Silver', 'Herradura', 'Spirit', 'Tequila', '[{"kind":"milliliters","ml":750}]'::jsonb, 40, 'Jalisco, Mexico',
   'Silver tequila aged 45 days (legally still blanco). Earthier than most blancos.',
   '["earthy","agave","roasted"]'::jsonb, 'pending'),
  ('Herradura Reposado', 'Herradura', 'Spirit', 'Tequila', '[{"kind":"milliliters","ml":750}]'::jsonb, 40, 'Jalisco, Mexico',
   'Reposado aged 11 months. Long-aged for a reposado, with deep oak character.',
   '["oak","caramel","agave"]'::jsonb, 'pending'),
  ('Espolon Blanco', 'Espolon', 'Spirit', 'Tequila', '[{"kind":"milliliters","ml":750},{"kind":"milliliters","ml":1000}]'::jsonb, 40, 'Jalisco, Mexico',
   'Mid-tier blanco with bold agave character. Popular cocktail tequila for the price.',
   '["agave","pepper","bold"]'::jsonb, 'pending'),
  ('El Tesoro Platinum', 'El Tesoro', 'Spirit', 'Tequila', '[{"kind":"milliliters","ml":750}]'::jsonb, 40, 'Jalisco, Mexico',
   'Tahona-made blanco. Cocktail community favorite for traditional production.',
   '["agave","earthy","mineral"]'::jsonb, 'pending'),
  ('Fortaleza Blanco', 'Fortaleza', 'Spirit', 'Tequila', '[{"kind":"milliliters","ml":750}]'::jsonb, 40, 'Jalisco, Mexico',
   'Tahona-crushed, copper pot still tequila. Bartender darling.',
   '["agave","cooked","earthy"]'::jsonb, 'pending'),
  ('Cazadores Reposado', 'Cazadores', 'Spirit', 'Tequila', '[{"kind":"milliliters","ml":750},{"kind":"milliliters","ml":1000}]'::jsonb, 40, 'Jalisco, Mexico',
   'Mid-tier reposado. Common well tequila in cocktail-forward bars.',
   '["mellow","oak","agave"]'::jsonb, 'pending'),
  ('Siete Leguas Blanco', 'Siete Leguas', 'Spirit', 'Tequila', '[{"kind":"milliliters","ml":750}]'::jsonb, 40, 'Jalisco, Mexico',
   'Family-owned distillery using traditional methods. Cult bartender brand.',
   '["agave","cooked","earthy"]'::jsonb, 'pending'),
  ('Del Maguey Vida', 'Del Maguey', 'Spirit', 'Mezcal', '[{"kind":"milliliters","ml":750}]'::jsonb, 42, 'Oaxaca, Mexico',
   'Single-village espadin mezcal. The cocktail mezcal default; affordable enough for mixing.',
   '["smoky","agave","earthy"]'::jsonb, 'pending'),
  ('Ilegal Joven', 'Ilegal', 'Spirit', 'Mezcal', '[{"kind":"milliliters","ml":750}]'::jsonb, 40, 'Oaxaca, Mexico',
   'Smooth, lighter mezcal style. Popular in upscale cocktail programs.',
   '["smoky","tropical","mellow"]'::jsonb, 'pending'),
  ('Montelobos', 'Montelobos', 'Spirit', 'Mezcal', '[{"kind":"milliliters","ml":750}]'::jsonb, 43.2, 'Oaxaca, Mexico',
   'Joven espadin mezcal. Vibrant smoke and citrus.',
   '["smoky","citrus","vibrant"]'::jsonb, 'pending');


-- ============================================================
-- WHISKEY: BOURBON
-- ============================================================

INSERT INTO canonical_products (name, brand, category, subcategory, default_sizes, abv, origin, description, flavor_notes, enrichment_status)
VALUES
  ('Maker''s Mark', 'Maker''s Mark', 'Spirit', 'Whiskey', '[{"kind":"milliliters","ml":750},{"kind":"milliliters","ml":1000},{"kind":"milliliters","ml":1750}]'::jsonb, 45, 'Loretto, KY, USA',
   'Wheated bourbon, no rye in mash bill. Soft, sweet character with red wax dipped bottle.',
   '["caramel","wheat","soft"]'::jsonb, 'pending'),
  ('Buffalo Trace', 'Buffalo Trace', 'Spirit', 'Whiskey', '[{"kind":"milliliters","ml":750},{"kind":"milliliters","ml":1000},{"kind":"milliliters","ml":1750}]'::jsonb, 45, 'Frankfort, KY, USA',
   'Standard rye-recipe bourbon from Buffalo Trace Distillery. Award winner; widely used in cocktails.',
   '["caramel","vanilla","light spice"]'::jsonb, 'pending'),
  ('Woodford Reserve', 'Woodford Reserve', 'Spirit', 'Whiskey', '[{"kind":"milliliters","ml":750},{"kind":"milliliters","ml":1000}]'::jsonb, 45.2, 'Versailles, KY, USA',
   'Premium small-batch bourbon. Triple-distilled (unusual for bourbon); fruit-forward.',
   '["caramel","fruit","oak"]'::jsonb, 'pending'),
  ('Bulleit Bourbon', 'Bulleit', 'Spirit', 'Whiskey', '[{"kind":"milliliters","ml":750},{"kind":"milliliters","ml":1000},{"kind":"milliliters","ml":1750}]'::jsonb, 45, 'Kentucky, USA',
   'High-rye bourbon (~28% rye in mash). Spicier than typical bourbons; cocktail-friendly.',
   '["spicy","oak","caramel"]'::jsonb, 'pending'),
  ('Knob Creek', 'Knob Creek', 'Spirit', 'Whiskey', '[{"kind":"milliliters","ml":750},{"kind":"milliliters","ml":1000}]'::jsonb, 50, 'Clermont, KY, USA',
   'Small-batch 100-proof bourbon. Robust character; from the Jim Beam family.',
   '["caramel","oak","spice"]'::jsonb, 'pending'),
  ('Four Roses Yellow Label', 'Four Roses', 'Spirit', 'Whiskey', '[{"kind":"milliliters","ml":750},{"kind":"milliliters","ml":1000}]'::jsonb, 40, 'Lawrenceburg, KY, USA',
   'Entry Four Roses expression. Floral with light spice.',
   '["floral","light spice","caramel"]'::jsonb, 'pending'),
  ('Wild Turkey 101', 'Wild Turkey', 'Spirit', 'Whiskey', '[{"kind":"milliliters","ml":750},{"kind":"milliliters","ml":1000},{"kind":"milliliters","ml":1750}]'::jsonb, 50.5, 'Lawrenceburg, KY, USA',
   '101 proof; cocktail bartender favorite for backbone in stirred drinks.',
   '["spicy","caramel","robust"]'::jsonb, 'pending'),
  ('Elijah Craig Small Batch', 'Elijah Craig', 'Spirit', 'Whiskey', '[{"kind":"milliliters","ml":750},{"kind":"milliliters","ml":1000}]'::jsonb, 47, 'Bardstown, KY, USA',
   'Small batch bourbon from Heaven Hill. Strong vanilla and oak from heavily charred barrels.',
   '["vanilla","oak","caramel"]'::jsonb, 'pending'),
  ('Eagle Rare', 'Eagle Rare', 'Spirit', 'Whiskey', '[{"kind":"milliliters","ml":750}]'::jsonb, 45, 'Frankfort, KY, USA',
   '10-year-aged single-barrel bourbon from Buffalo Trace. Sipping bourbon.',
   '["oak","caramel","subtle smoke"]'::jsonb, 'pending'),
  ('Old Forester 86 Proof', 'Old Forester', 'Spirit', 'Whiskey', '[{"kind":"milliliters","ml":750},{"kind":"milliliters","ml":1000}]'::jsonb, 43, 'Louisville, KY, USA',
   'Brown-Forman''s flagship bourbon. Reliable and inexpensive for cocktails.',
   '["caramel","oak","mellow"]'::jsonb, 'pending'),
  ('Old Forester 100 Proof', 'Old Forester', 'Spirit', 'Whiskey', '[{"kind":"milliliters","ml":750},{"kind":"milliliters","ml":1000}]'::jsonb, 50, 'Louisville, KY, USA',
   'Higher-proof signature for stirred bourbon drinks; bartender favorite.',
   '["caramel","spice","oak"]'::jsonb, 'pending'),
  ('Larceny', 'Larceny', 'Spirit', 'Whiskey', '[{"kind":"milliliters","ml":750}]'::jsonb, 46, 'Bardstown, KY, USA',
   'Wheated bourbon from Heaven Hill. Sweet and approachable.',
   '["caramel","wheat","sweet"]'::jsonb, 'pending'),
  ('Evan Williams Black Label', 'Evan Williams', 'Spirit', 'Whiskey', '[{"kind":"milliliters","ml":750},{"kind":"milliliters","ml":1000},{"kind":"milliliters","ml":1750}]'::jsonb, 43, 'Bardstown, KY, USA',
   'Mass-market well bourbon. Common bar pour.',
   '["caramel","oak","mild"]'::jsonb, 'pending'),
  ('Jim Beam White Label', 'Jim Beam', 'Spirit', 'Whiskey', '[{"kind":"milliliters","ml":750},{"kind":"milliliters","ml":1000},{"kind":"milliliters","ml":1750}]'::jsonb, 40, 'Clermont, KY, USA',
   'The most-poured bourbon in the world. Standard well bourbon.',
   '["mild","caramel","slightly nutty"]'::jsonb, 'pending');


-- ============================================================
-- WHISKEY: RYE
-- ============================================================

INSERT INTO canonical_products (name, brand, category, subcategory, default_sizes, abv, origin, description, flavor_notes, enrichment_status)
VALUES
  ('Bulleit Rye', 'Bulleit', 'Spirit', 'Whiskey', '[{"kind":"milliliters","ml":750},{"kind":"milliliters","ml":1000}]'::jsonb, 45, 'Kentucky, USA',
   'High-rye mash (95% rye, 5% malted barley). Wide bar distribution.',
   '["spicy","peppery","grain"]'::jsonb, 'pending'),
  ('Rittenhouse Rye Bottled in Bond', 'Rittenhouse', 'Spirit', 'Whiskey', '[{"kind":"milliliters","ml":750}]'::jsonb, 50, 'Bardstown, KY, USA',
   '100-proof bonded rye. The cocktail bartender''s default rye for Manhattans and Sazeracs.',
   '["spicy","caramel","robust"]'::jsonb, 'pending'),
  ('Sazerac Rye', 'Sazerac', 'Spirit', 'Whiskey', '[{"kind":"milliliters","ml":750}]'::jsonb, 45, 'Frankfort, KY, USA',
   'Buffalo Trace''s entry rye. The eponymous spirit for the Sazerac cocktail.',
   '["spicy","caramel","mellow"]'::jsonb, 'pending'),
  ('High West Double Rye', 'High West', 'Spirit', 'Whiskey', '[{"kind":"milliliters","ml":750}]'::jsonb, 46, 'Park City, UT, USA',
   'Blend of two rye whiskeys. Modern American craft rye.',
   '["spicy","fruit","grain"]'::jsonb, 'pending'),
  ('Old Overholt', 'Old Overholt', 'Spirit', 'Whiskey', '[{"kind":"milliliters","ml":750},{"kind":"milliliters","ml":1000}]'::jsonb, 40, 'Kentucky, USA',
   'Historic Pennsylvania-style rye, now made in Kentucky. Affordable cocktail rye.',
   '["spicy","mild","grain"]'::jsonb, 'pending'),
  ('WhistlePig 10 Year', 'WhistlePig', 'Spirit', 'Whiskey', '[{"kind":"milliliters","ml":750}]'::jsonb, 50, 'Vermont, USA (Canadian sourced)',
   '100-proof straight rye. Popular premium rye for sipping and high-end cocktails.',
   '["spice","oak","caramel"]'::jsonb, 'pending');


-- ============================================================
-- WHISKEY: SCOTCH
-- ============================================================

INSERT INTO canonical_products (name, brand, category, subcategory, default_sizes, abv, origin, description, flavor_notes, enrichment_status)
VALUES
  ('Johnnie Walker Black Label', 'Johnnie Walker', 'Spirit', 'Whiskey', '[{"kind":"milliliters","ml":750},{"kind":"milliliters","ml":1000},{"kind":"milliliters","ml":1750}]'::jsonb, 40, 'Scotland',
   'Blended Scotch aged at least 12 years. Common premium pour and Penicillin base.',
   '["smoke","malt","fruit"]'::jsonb, 'pending'),
  ('Johnnie Walker Red Label', 'Johnnie Walker', 'Spirit', 'Whiskey', '[{"kind":"milliliters","ml":750},{"kind":"milliliters","ml":1000},{"kind":"milliliters","ml":1750}]'::jsonb, 40, 'Scotland',
   'Entry-level Johnnie Walker blended Scotch. Mass market.',
   '["malt","light smoke","grain"]'::jsonb, 'pending'),
  ('Dewar''s White Label', 'Dewar''s', 'Spirit', 'Whiskey', '[{"kind":"milliliters","ml":750},{"kind":"milliliters","ml":1000}]'::jsonb, 40, 'Scotland',
   'Approachable blended Scotch. Common well Scotch.',
   '["mellow","malt","light"]'::jsonb, 'pending'),
  ('Chivas Regal 12', 'Chivas Regal', 'Spirit', 'Whiskey', '[{"kind":"milliliters","ml":750}]'::jsonb, 40, 'Scotland',
   '12-year blended Scotch. Historic premium blend.',
   '["honey","oak","fruit"]'::jsonb, 'pending'),
  ('Monkey Shoulder', 'Monkey Shoulder', 'Spirit', 'Whiskey', '[{"kind":"milliliters","ml":750}]'::jsonb, 40, 'Speyside, Scotland',
   'Blend of three Speyside single malts. Designed for cocktails.',
   '["honey","vanilla","malt"]'::jsonb, 'pending'),
  ('Glenfiddich 12', 'Glenfiddich', 'Spirit', 'Whiskey', '[{"kind":"milliliters","ml":750}]'::jsonb, 40, 'Speyside, Scotland',
   'Best-selling single malt globally. Pear and oak character.',
   '["pear","honey","oak"]'::jsonb, 'pending'),
  ('The Macallan 12 Double Cask', 'Macallan', 'Spirit', 'Whiskey', '[{"kind":"milliliters","ml":750}]'::jsonb, 40, 'Speyside, Scotland',
   'Sherry and bourbon cask blend. Premium Speyside single malt.',
   '["sherry","honey","oak"]'::jsonb, 'pending'),
  ('Laphroaig 10', 'Laphroaig', 'Spirit', 'Whiskey', '[{"kind":"milliliters","ml":750}]'::jsonb, 43, 'Islay, Scotland',
   'Heavily peated Islay single malt. Iconic for medicinal smoke character.',
   '["peat","smoke","iodine"]'::jsonb, 'pending'),
  ('Lagavulin 16', 'Lagavulin', 'Spirit', 'Whiskey', '[{"kind":"milliliters","ml":750}]'::jsonb, 43, 'Islay, Scotland',
   '16-year Islay single malt. Smoke balanced with sherry sweetness.',
   '["peat","smoke","sherry"]'::jsonb, 'pending'),
  ('Highland Park 12', 'Highland Park', 'Spirit', 'Whiskey', '[{"kind":"milliliters","ml":750}]'::jsonb, 40, 'Orkney, Scotland',
   'Lightly peated Orkney single malt. Heather honey and gentle smoke.',
   '["heather","honey","light smoke"]'::jsonb, 'pending'),
  ('Talisker 10', 'Talisker', 'Spirit', 'Whiskey', '[{"kind":"milliliters","ml":750}]'::jsonb, 45.8, 'Skye, Scotland',
   'Isle of Skye single malt. Maritime peppery smoke.',
   '["peppery","smoke","sea air"]'::jsonb, 'pending'),
  ('The Glenlivet 12', 'The Glenlivet', 'Spirit', 'Whiskey', '[{"kind":"milliliters","ml":750}]'::jsonb, 40, 'Speyside, Scotland',
   'Founding Speyside distillery. Light fruit and honey.',
   '["honey","fruit","floral"]'::jsonb, 'pending');


-- ============================================================
-- WHISKEY: IRISH + JAPANESE + AMERICAN OTHER
-- ============================================================

INSERT INTO canonical_products (name, brand, category, subcategory, default_sizes, abv, origin, description, flavor_notes, enrichment_status)
VALUES
  ('Jameson', 'Jameson', 'Spirit', 'Whiskey', '[{"kind":"milliliters","ml":750},{"kind":"milliliters","ml":1000},{"kind":"milliliters","ml":1750}]'::jsonb, 40, 'Ireland',
   'Triple-distilled Irish blended whiskey. Best-selling Irish whiskey worldwide.',
   '["smooth","light","grain"]'::jsonb, 'pending'),
  ('Tullamore D.E.W.', 'Tullamore', 'Spirit', 'Whiskey', '[{"kind":"milliliters","ml":750},{"kind":"milliliters","ml":1000}]'::jsonb, 40, 'Ireland',
   'Triple-distilled triple-blend Irish whiskey. Smooth and approachable.',
   '["smooth","grain","mild fruit"]'::jsonb, 'pending'),
  ('Bushmills Original', 'Bushmills', 'Spirit', 'Whiskey', '[{"kind":"milliliters","ml":750},{"kind":"milliliters","ml":1000}]'::jsonb, 40, 'Northern Ireland',
   'Northern Irish blended whiskey. Lighter and slightly fruitier than Jameson.',
   '["fruit","grain","light malt"]'::jsonb, 'pending'),
  ('Redbreast 12', 'Redbreast', 'Spirit', 'Whiskey', '[{"kind":"milliliters","ml":750}]'::jsonb, 40, 'Ireland',
   'Single pot still Irish whiskey. Premium category benchmark.',
   '["fruit","spice","sherry"]'::jsonb, 'pending'),
  ('Suntory Toki', 'Suntory', 'Spirit', 'Whiskey', '[{"kind":"milliliters","ml":750}]'::jsonb, 43, 'Japan',
   'Japanese blended whisky. Designed for highballs.',
   '["light","fruit","floral"]'::jsonb, 'pending'),
  ('Nikka From the Barrel', 'Nikka', 'Spirit', 'Whiskey', '[{"kind":"milliliters","ml":500}]'::jsonb, 51.4, 'Japan',
   'High-strength Japanese blended whisky. Cult bartender favorite.',
   '["spice","fruit","oak"]'::jsonb, 'pending'),
  ('Hibiki Japanese Harmony', 'Hibiki', 'Spirit', 'Whiskey', '[{"kind":"milliliters","ml":700}]'::jsonb, 43, 'Japan',
   'Premium blended Japanese whisky from Suntory. Elegant and floral.',
   '["floral","honey","fruit"]'::jsonb, 'pending'),
  ('Jack Daniel''s Old No. 7', 'Jack Daniel''s', 'Spirit', 'Whiskey', '[{"kind":"milliliters","ml":750},{"kind":"milliliters","ml":1000},{"kind":"milliliters","ml":1750}]'::jsonb, 40, 'Lynchburg, TN, USA',
   'Tennessee whiskey. Charcoal-mellowed; technically not bourbon despite similar mash bill.',
   '["banana","caramel","slightly smoky"]'::jsonb, 'pending'),
  ('Gentleman Jack', 'Jack Daniel''s', 'Spirit', 'Whiskey', '[{"kind":"milliliters","ml":750}]'::jsonb, 40, 'Lynchburg, TN, USA',
   'Double-mellowed Jack Daniel''s. Smoother than Old No. 7.',
   '["smooth","caramel","banana"]'::jsonb, 'pending'),
  ('Crown Royal', 'Crown Royal', 'Spirit', 'Whiskey', '[{"kind":"milliliters","ml":750},{"kind":"milliliters","ml":1000},{"kind":"milliliters","ml":1750}]'::jsonb, 40, 'Canada',
   'Best-selling Canadian whisky in the US. Soft and approachable.',
   '["smooth","vanilla","light spice"]'::jsonb, 'pending'),
  ('Canadian Club', 'Canadian Club', 'Spirit', 'Whiskey', '[{"kind":"milliliters","ml":750},{"kind":"milliliters","ml":1000},{"kind":"milliliters","ml":1750}]'::jsonb, 40, 'Canada',
   'Blended Canadian whisky. Classic Old Fashioned alternative.',
   '["mild","grain","slightly sweet"]'::jsonb, 'pending');


-- ============================================================
-- BRANDY + COGNAC
-- ============================================================

INSERT INTO canonical_products (name, brand, category, subcategory, default_sizes, abv, origin, description, flavor_notes, enrichment_status)
VALUES
  ('Hennessy VS', 'Hennessy', 'Spirit', 'Brandy', '[{"kind":"milliliters","ml":750},{"kind":"milliliters","ml":1000},{"kind":"milliliters","ml":1750}]'::jsonb, 40, 'Cognac, France',
   'Most-sold Cognac globally. Entry-level VS aged at least 2 years.',
   '["fruit","oak","vanilla"]'::jsonb, 'pending'),
  ('Hennessy VSOP', 'Hennessy', 'Spirit', 'Brandy', '[{"kind":"milliliters","ml":750}]'::jsonb, 40, 'Cognac, France',
   'Mid-tier Cognac aged at least 4 years. Used in Sidecars and stirred Cognac drinks.',
   '["dried fruit","oak","caramel"]'::jsonb, 'pending'),
  ('Remy Martin VSOP', 'Remy Martin', 'Spirit', 'Brandy', '[{"kind":"milliliters","ml":750}]'::jsonb, 40, 'Cognac, France',
   'VSOP from a top Cognac house. Bright fruit and oak.',
   '["fruit","floral","oak"]'::jsonb, 'pending'),
  ('Pierre Ferrand 1840 Original Formula', 'Pierre Ferrand', 'Spirit', 'Brandy', '[{"kind":"milliliters","ml":750}]'::jsonb, 45, 'Cognac, France',
   'Specifically made for cocktails; replicates 19th-century Cognac style. Bartender favorite.',
   '["fruit","oak","spice"]'::jsonb, 'pending'),
  ('Laird''s Bonded Apple Brandy', 'Laird''s', 'Spirit', 'Brandy', '[{"kind":"milliliters","ml":750}]'::jsonb, 50, 'New Jersey, USA',
   '100-proof bonded apple brandy. Used in Jack Roses and Pink Ladies.',
   '["apple","oak","spice"]'::jsonb, 'pending'),
  ('Calvados', NULL, 'Spirit', 'Brandy', '[{"kind":"milliliters","ml":750}]'::jsonb, 40, 'Normandy, France',
   'Generic French apple brandy. Aged in oak; Normandy region protected.',
   '["apple","oak","earthy"]'::jsonb, 'pending');
