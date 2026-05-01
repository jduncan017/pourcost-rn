-- ============================================================
-- Seed 005: Library cocktail recipes
--
-- Inserts ~30 classic cocktails as global library recipes
-- (received_recipes with user_id NULL, source = 'library').
-- Each recipe references canonical_products via canonical name
-- (and brand for brand-specific ingredients).
--
-- Run AFTER seeds 001-004 (which create the canonicals these
-- recipes reference). Also requires migration 011.
--
-- A helper PL/pgSQL function does the canonical lookup so each
-- recipe insert reads as a clean call. The function is dropped
-- at the end of the file so it doesn't pollute the schema.
-- ============================================================


-- ============================================================
-- Helper: seed_library_recipe(...)
--
-- Resolves each ingredient by canonical name (and brand when set),
-- copies the canonical's category + subcategory onto the recipe
-- row, and inserts the join row. Logs a WARNING and skips the
-- ingredient if the canonical isn't found.
-- ============================================================

CREATE OR REPLACE FUNCTION seed_library_recipe(
  p_name TEXT,
  p_description TEXT,
  p_suggested_retail_price NUMERIC,
  p_notes TEXT,
  p_category TEXT,
  p_ingredients JSONB
) RETURNS UUID
LANGUAGE plpgsql AS $$
DECLARE
  v_recipe_id UUID;
  ing JSONB;
  v_canonical_id UUID;
  v_canonical_cat TEXT;
  v_canonical_subcat TEXT;
BEGIN
  INSERT INTO received_recipes
    (user_id, source, name, description, suggested_retail_price, notes, category, image_path)
  VALUES
    (NULL, 'library', p_name, p_description, p_suggested_retail_price, p_notes, p_category, NULL)
  RETURNING id INTO v_recipe_id;

  FOR ing IN SELECT * FROM jsonb_array_elements(p_ingredients) LOOP
    IF (ing->>'brand') IS NOT NULL THEN
      SELECT id, category, subcategory
        INTO v_canonical_id, v_canonical_cat, v_canonical_subcat
      FROM canonical_products
      WHERE name = ing->>'name' AND brand = ing->>'brand'
      LIMIT 1;
    ELSE
      SELECT id, category, subcategory
        INTO v_canonical_id, v_canonical_cat, v_canonical_subcat
      FROM canonical_products
      WHERE name = ing->>'name' AND brand IS NULL
      LIMIT 1;
    END IF;

    IF v_canonical_id IS NULL THEN
      RAISE WARNING 'seed_library_recipe: canonical not found for % (brand: %)',
        ing->>'name', COALESCE(ing->>'brand', '<generic>');
      CONTINUE;
    END IF;

    INSERT INTO received_recipe_ingredients
      (received_recipe_id, canonical_product_id, canonical_category,
       canonical_subcategory, pour_size, sort_order, ingredient_notes,
       display_name)
    VALUES (
      v_recipe_id,
      v_canonical_id,
      v_canonical_cat,
      v_canonical_subcat,
      (ing->'pour')::jsonb,
      COALESCE((ing->>'order')::int, 1),
      ing->>'notes',
      ing->>'display_name'
    );
  END LOOP;

  RETURN v_recipe_id;
END;
$$;


-- ============================================================
-- WHISKEY-FORWARD CLASSICS
-- ============================================================

SELECT seed_library_recipe(
  'Old Fashioned',
  'The original cocktail. Spirit, sugar, water, bitters. The defining template for the entire stirred-and-spirit-forward category.',
  14.00,
  'Stir bourbon, demerara syrup, and bitters with ice until well-chilled. Strain over a large rock. Express orange peel and drop in.',
  'Whiskey',
  '[
    {"name": "Bourbon", "pour": {"kind":"decimalOunces","ounces":2}, "order": 1},
    {"name": "Demerara Syrup", "pour": {"kind":"decimalOunces","ounces":0.25}, "order": 2},
    {"name": "Angostura Aromatic Bitters", "brand": "Angostura", "pour": {"kind":"namedOunces","name":"3 dashes","ounces":0.05}, "order": 3, "notes": "3 dashes"},
    {"name": "Orange Peel", "pour": {"kind":"unitQuantity","unitType":"oneThing","name":"1 peel","quantity":1,"ounces":0}, "order": 4, "notes": "Express and drop"}
  ]'::jsonb
);

SELECT seed_library_recipe(
  'Manhattan',
  'Rye, sweet vermouth, bitters. The benchmark for stirred whiskey cocktails.',
  15.00,
  'Stir rye, sweet vermouth, and bitters with ice until well-chilled. Strain into a chilled coupe. Garnish with a brandied or Luxardo cherry.',
  'Whiskey',
  '[
    {"name": "Rye Whiskey", "pour": {"kind":"decimalOunces","ounces":2}, "order": 1},
    {"name": "Carpano Antica Formula", "brand": "Carpano", "pour": {"kind":"decimalOunces","ounces":1}, "order": 2},
    {"name": "Angostura Aromatic Bitters", "brand": "Angostura", "pour": {"kind":"namedOunces","name":"2 dashes","ounces":0.04}, "order": 3, "notes": "2 dashes"},
    {"name": "Luxardo Cherry", "brand": "Luxardo", "pour": {"kind":"unitQuantity","unitType":"oneThing","name":"1 cherry","quantity":1,"ounces":0}, "order": 4}
  ]'::jsonb
);

SELECT seed_library_recipe(
  'Sazerac',
  'New Orleans original. Rye, sugar, Peychaud''s, with an absinthe-rinsed glass. One of America''s great cocktails.',
  16.00,
  'Rinse a chilled rocks glass with absinthe and discard. Stir rye, demerara syrup, and Peychaud''s with ice until well-chilled. Strain into the prepared glass. Express lemon twist over the top and discard.',
  'Whiskey',
  '[
    {"name": "Rye Whiskey", "pour": {"kind":"decimalOunces","ounces":2}, "order": 1},
    {"name": "Demerara Syrup", "pour": {"kind":"decimalOunces","ounces":0.25}, "order": 2},
    {"name": "Peychaud''s Bitters", "brand": "Peychaud''s", "pour": {"kind":"namedOunces","name":"4 dashes","ounces":0.07}, "order": 3, "notes": "4 dashes"},
    {"name": "Pernod Absinthe", "brand": "Pernod", "pour": {"kind":"namedOunces","name":"Rinse","ounces":0.1}, "order": 4, "notes": "Rinse glass"},
    {"name": "Lemon Twist", "pour": {"kind":"unitQuantity","unitType":"oneThing","name":"1 twist","quantity":1,"ounces":0}, "order": 5, "notes": "Express and discard"}
  ]'::jsonb
);

SELECT seed_library_recipe(
  'Whiskey Sour',
  'Bourbon, lemon, sugar, optional egg white. The original sour template: citrus, sweet, spirit.',
  13.00,
  'Dry shake bourbon, lemon juice, simple syrup, and egg white to emulsify. Add ice and shake again until very cold. Double strain into a coupe or rocks glass. Garnish with a cherry.',
  'Whiskey',
  '[
    {"name": "Bourbon", "pour": {"kind":"decimalOunces","ounces":2}, "order": 1},
    {"name": "Lemon Juice", "pour": {"kind":"decimalOunces","ounces":0.75}, "order": 2},
    {"name": "Simple Syrup", "pour": {"kind":"decimalOunces","ounces":0.5}, "order": 3},
    {"name": "Egg White", "pour": {"kind":"decimalOunces","ounces":1}, "order": 4, "notes": "Optional but classic"},
    {"name": "Maraschino Cherry", "pour": {"kind":"unitQuantity","unitType":"oneThing","name":"1 cherry","quantity":1,"ounces":0}, "order": 5}
  ]'::jsonb
);

SELECT seed_library_recipe(
  'Boulevardier',
  'Negroni''s whiskey-based cousin. Bourbon, sweet vermouth, Campari. Bittersweet and sippable.',
  15.00,
  'Stir bourbon, Campari, and sweet vermouth with ice until well-chilled. Strain over a large rock or into a coupe. Garnish with an orange twist.',
  'Whiskey',
  '[
    {"name": "Bourbon", "pour": {"kind":"decimalOunces","ounces":1.5}, "order": 1},
    {"name": "Campari", "brand": "Campari", "pour": {"kind":"decimalOunces","ounces":1}, "order": 2},
    {"name": "Carpano Antica Formula", "brand": "Carpano", "pour": {"kind":"decimalOunces","ounces":1}, "order": 3},
    {"name": "Orange Twist", "pour": {"kind":"unitQuantity","unitType":"oneThing","name":"1 twist","quantity":1,"ounces":0}, "order": 4}
  ]'::jsonb
);

SELECT seed_library_recipe(
  'Paper Plane',
  'Modern classic from Sam Ross. Equal parts bourbon, Aperol, Nonino, lemon juice. Bittersweet and effortless.',
  16.00,
  'Shake all ingredients with ice until well-chilled. Double strain into a chilled coupe. No garnish.',
  'Whiskey',
  '[
    {"name": "Bourbon", "pour": {"kind":"decimalOunces","ounces":0.75}, "order": 1},
    {"name": "Aperol", "brand": "Aperol", "pour": {"kind":"decimalOunces","ounces":0.75}, "order": 2},
    {"name": "Nonino Quintessentia", "brand": "Amaro Nonino", "pour": {"kind":"decimalOunces","ounces":0.75}, "order": 3},
    {"name": "Lemon Juice", "pour": {"kind":"decimalOunces","ounces":0.75}, "order": 4}
  ]'::jsonb
);

SELECT seed_library_recipe(
  'Penicillin',
  'Modern Scotch classic. Blended Scotch, honey, ginger, lemon, with an Islay float. Smoky, soothing, balanced.',
  17.00,
  'Shake blended Scotch, honey syrup, lemon juice, and ginger syrup with ice. Strain over fresh ice. Float Laphroaig on top. Garnish with candied ginger if you have it.',
  'Whiskey',
  '[
    {"name": "Scotch Whisky", "pour": {"kind":"decimalOunces","ounces":2}, "order": 1},
    {"name": "Honey Syrup", "pour": {"kind":"decimalOunces","ounces":0.5}, "order": 2},
    {"name": "Lemon Juice", "pour": {"kind":"decimalOunces","ounces":0.75}, "order": 3},
    {"name": "Ginger Syrup", "pour": {"kind":"decimalOunces","ounces":0.25}, "order": 4},
    {"name": "Laphroaig 10", "brand": "Laphroaig", "pour": {"kind":"decimalOunces","ounces":0.25}, "order": 5, "notes": "Float on top"}
  ]'::jsonb
);

SELECT seed_library_recipe(
  'Mint Julep',
  'Kentucky Derby classic. Bourbon, sugar, mint, crushed ice. Refreshing and aromatic.',
  13.00,
  'Lightly muddle mint with simple syrup in a julep cup. Add bourbon and pack with crushed ice. Stir to chill, top with more crushed ice, and garnish with a tall mint bouquet.',
  'Whiskey',
  '[
    {"name": "Bourbon", "pour": {"kind":"decimalOunces","ounces":2.5}, "order": 1},
    {"name": "Simple Syrup", "pour": {"kind":"decimalOunces","ounces":0.5}, "order": 2},
    {"name": "Mint Sprig", "pour": {"kind":"unitQuantity","unitType":"oneThing","name":"6 leaves","quantity":6,"ounces":0}, "order": 3, "notes": "Plus a sprig garnish"}
  ]'::jsonb
);


-- ============================================================
-- GIN CLASSICS
-- ============================================================

SELECT seed_library_recipe(
  'Negroni',
  'Equal parts gin, Campari, sweet vermouth. The bartender''s aperitif of choice. Bitter, balanced, intensely savory.',
  14.00,
  'Stir gin, Campari, and sweet vermouth with ice until well-chilled. Strain over a large rock. Express orange twist over the top and drop in.',
  'Other',
  '[
    {"name": "Gin", "pour": {"kind":"decimalOunces","ounces":1}, "order": 1},
    {"name": "Campari", "brand": "Campari", "pour": {"kind":"decimalOunces","ounces":1}, "order": 2},
    {"name": "Carpano Antica Formula", "brand": "Carpano", "pour": {"kind":"decimalOunces","ounces":1}, "order": 3},
    {"name": "Orange Twist", "pour": {"kind":"unitQuantity","unitType":"oneThing","name":"1 twist","quantity":1,"ounces":0}, "order": 4}
  ]'::jsonb
);

SELECT seed_library_recipe(
  'Aviation',
  'Pre-Prohibition gin classic. Gin, lemon, maraschino, crème de violette. Soft purple color, floral and tart.',
  15.00,
  'Shake gin, lemon juice, maraschino, and crème de violette with ice until well-chilled. Double strain into a chilled coupe. Garnish with a Luxardo cherry.',
  'Gin',
  '[
    {"name": "Gin", "pour": {"kind":"decimalOunces","ounces":2}, "order": 1},
    {"name": "Lemon Juice", "pour": {"kind":"decimalOunces","ounces":0.5}, "order": 2},
    {"name": "Luxardo Maraschino Liqueur", "brand": "Luxardo", "pour": {"kind":"decimalOunces","ounces":0.5}, "order": 3},
    {"name": "Crème de Violette", "pour": {"kind":"decimalOunces","ounces":0.25}, "order": 4}
  ]'::jsonb
);

SELECT seed_library_recipe(
  'Tom Collins',
  'Long, refreshing highball. Gin, lemon, sugar, soda. Pre-Prohibition era classic. Essentially gin lemonade with bubbles.',
  12.00,
  'Shake gin, lemon juice, and simple syrup with ice. Strain into a tall Collins glass with fresh ice. Top with club soda. Garnish with a cherry and a lemon wheel.',
  'Gin',
  '[
    {"name": "Gin", "pour": {"kind":"decimalOunces","ounces":2}, "order": 1},
    {"name": "Lemon Juice", "pour": {"kind":"decimalOunces","ounces":0.75}, "order": 2},
    {"name": "Simple Syrup", "pour": {"kind":"decimalOunces","ounces":0.5}, "order": 3},
    {"name": "Club Soda", "pour": {"kind":"namedOunces","name":"Top","ounces":2}, "order": 4, "notes": "Top to fill"},
    {"name": "Maraschino Cherry", "pour": {"kind":"unitQuantity","unitType":"oneThing","name":"1 cherry","quantity":1,"ounces":0}, "order": 5}
  ]'::jsonb
);

SELECT seed_library_recipe(
  'French 75',
  'Gin or Cognac, lemon, sugar, topped with Champagne. Bright, celebratory, lethal in volume.',
  15.00,
  'Shake gin, lemon juice, and simple syrup with ice. Strain into a Champagne flute. Top with Champagne. Garnish with a long lemon twist.',
  'Gin',
  '[
    {"name": "Gin", "pour": {"kind":"decimalOunces","ounces":1}, "order": 1},
    {"name": "Lemon Juice", "pour": {"kind":"decimalOunces","ounces":0.5}, "order": 2},
    {"name": "Simple Syrup", "pour": {"kind":"decimalOunces","ounces":0.5}, "order": 3},
    {"name": "Champagne", "pour": {"kind":"namedOunces","name":"Top","ounces":2}, "order": 4, "notes": "Top to fill"},
    {"name": "Lemon Twist", "pour": {"kind":"unitQuantity","unitType":"oneThing","name":"1 twist","quantity":1,"ounces":0}, "order": 5}
  ]'::jsonb
);

SELECT seed_library_recipe(
  'Last Word',
  'Pre-Prohibition four-equal-parts classic. Gin, green Chartreuse, maraschino, lime. Herbal, tart, complex.',
  16.00,
  'Shake all ingredients with ice until very cold. Double strain into a chilled coupe.',
  'Gin',
  '[
    {"name": "Gin", "pour": {"kind":"decimalOunces","ounces":0.75}, "order": 1},
    {"name": "Chartreuse Green", "brand": "Chartreuse", "pour": {"kind":"decimalOunces","ounces":0.75}, "order": 2},
    {"name": "Luxardo Maraschino Liqueur", "brand": "Luxardo", "pour": {"kind":"decimalOunces","ounces":0.75}, "order": 3},
    {"name": "Lime Juice", "pour": {"kind":"decimalOunces","ounces":0.75}, "order": 4}
  ]'::jsonb
);

SELECT seed_library_recipe(
  'Bee''s Knees',
  'Prohibition-era gin sour. Gin, honey, lemon. Soft, floral, three ingredients of perfection.',
  13.00,
  'Shake gin, honey syrup, and lemon juice with ice. Double strain into a chilled coupe. Garnish with a lemon twist.',
  'Gin',
  '[
    {"name": "Gin", "pour": {"kind":"decimalOunces","ounces":2}, "order": 1},
    {"name": "Honey Syrup", "pour": {"kind":"decimalOunces","ounces":0.75}, "order": 2},
    {"name": "Lemon Juice", "pour": {"kind":"decimalOunces","ounces":0.75}, "order": 3},
    {"name": "Lemon Twist", "pour": {"kind":"unitQuantity","unitType":"oneThing","name":"1 twist","quantity":1,"ounces":0}, "order": 4}
  ]'::jsonb
);

SELECT seed_library_recipe(
  'Gimlet',
  'Gin and lime, sweetened. Originally with Rose''s lime cordial; modern bars use fresh lime + simple syrup.',
  13.00,
  'Shake gin, lime juice, and simple syrup with ice until well-chilled. Strain into a chilled coupe. Garnish with a lime wheel.',
  'Gin',
  '[
    {"name": "Gin", "pour": {"kind":"decimalOunces","ounces":2.5}, "order": 1},
    {"name": "Lime Juice", "pour": {"kind":"decimalOunces","ounces":0.75}, "order": 2},
    {"name": "Simple Syrup", "pour": {"kind":"decimalOunces","ounces":0.5}, "order": 3},
    {"name": "Lime Wheel", "pour": {"kind":"unitQuantity","unitType":"oneThing","name":"1 wheel","quantity":1,"ounces":0}, "order": 4}
  ]'::jsonb
);

SELECT seed_library_recipe(
  'Bramble',
  'Modern London classic from Dick Bradsell. Gin sour with crème de cassis bleeding through crushed ice.',
  14.00,
  'Shake gin, lemon juice, and simple syrup with ice. Strain into a rocks glass packed with crushed ice. Drizzle crème de cassis over the top so it bleeds down. Garnish with a lemon wheel and blackberries if available.',
  'Gin',
  '[
    {"name": "Gin", "pour": {"kind":"decimalOunces","ounces":2}, "order": 1},
    {"name": "Lemon Juice", "pour": {"kind":"decimalOunces","ounces":0.75}, "order": 2},
    {"name": "Simple Syrup", "pour": {"kind":"decimalOunces","ounces":0.5}, "order": 3},
    {"name": "Crème de Cassis", "pour": {"kind":"decimalOunces","ounces":0.5}, "order": 4, "notes": "Drizzle over crushed ice"},
    {"name": "Lemon Wheel", "pour": {"kind":"unitQuantity","unitType":"oneThing","name":"1 wheel","quantity":1,"ounces":0}, "order": 5}
  ]'::jsonb
);


-- ============================================================
-- VODKA CLASSICS
-- ============================================================

SELECT seed_library_recipe(
  'Vesper',
  'Bond''s martini. Gin, vodka, Lillet Blanc. Strong, dry, distinctive.',
  16.00,
  'Stir or shake (Bond preferred shaken) gin, vodka, and Lillet with ice until very cold. Strain into a chilled coupe. Garnish with a long lemon twist.',
  'Vodka',
  '[
    {"name": "Gin", "pour": {"kind":"decimalOunces","ounces":2}, "order": 1},
    {"name": "Vodka", "pour": {"kind":"decimalOunces","ounces":1}, "order": 2},
    {"name": "Lillet Blanc", "brand": "Lillet", "pour": {"kind":"decimalOunces","ounces":0.5}, "order": 3},
    {"name": "Lemon Twist", "pour": {"kind":"unitQuantity","unitType":"oneThing","name":"1 twist","quantity":1,"ounces":0}, "order": 4}
  ]'::jsonb
);

SELECT seed_library_recipe(
  'Espresso Martini',
  'Vodka, coffee liqueur, fresh espresso. Modern brunch and after-dinner staple.',
  15.00,
  'Shake vodka, coffee liqueur, simple syrup, and a fresh shot of espresso with ice. Shake hard and long for a thick crema. Double strain into a chilled coupe. Float three coffee beans on the foam.',
  'Vodka',
  '[
    {"name": "Vodka", "pour": {"kind":"decimalOunces","ounces":2}, "order": 1},
    {"name": "Mr. Black Cold Brew Coffee Liqueur", "brand": "Mr. Black", "pour": {"kind":"decimalOunces","ounces":1}, "order": 2},
    {"name": "Simple Syrup", "pour": {"kind":"decimalOunces","ounces":0.25}, "order": 3, "notes": "Adjust to taste"}
  ]'::jsonb
);

SELECT seed_library_recipe(
  'Cosmopolitan',
  'Vodka, Cointreau, cranberry, lime. Iconic 90s cocktail; still works.',
  13.00,
  'Shake all ingredients hard with ice. Double strain into a chilled coupe. Garnish with a lemon twist or flamed orange peel.',
  'Vodka',
  '[
    {"name": "Vodka", "pour": {"kind":"decimalOunces","ounces":1.5}, "order": 1},
    {"name": "Cointreau", "brand": "Cointreau", "pour": {"kind":"decimalOunces","ounces":0.75}, "order": 2},
    {"name": "Cranberry Juice", "pour": {"kind":"decimalOunces","ounces":0.75}, "order": 3},
    {"name": "Lime Juice", "pour": {"kind":"decimalOunces","ounces":0.5}, "order": 4},
    {"name": "Lemon Twist", "pour": {"kind":"unitQuantity","unitType":"oneThing","name":"1 twist","quantity":1,"ounces":0}, "order": 5}
  ]'::jsonb
);

SELECT seed_library_recipe(
  'Moscow Mule',
  'Vodka, lime, ginger beer in a copper mug. Cool, spicy, and effortless.',
  12.00,
  'Add vodka and lime juice to a copper mug. Pack with ice. Top with ginger beer and stir gently. Garnish with a lime wedge and a mint sprig.',
  'Vodka',
  '[
    {"name": "Vodka", "pour": {"kind":"decimalOunces","ounces":2}, "order": 1},
    {"name": "Lime Juice", "pour": {"kind":"decimalOunces","ounces":0.5}, "order": 2},
    {"name": "Ginger Beer", "pour": {"kind":"namedOunces","name":"Top","ounces":4}, "order": 3, "notes": "Top to fill"},
    {"name": "Lime Wedge", "pour": {"kind":"unitQuantity","unitType":"oneThing","name":"1 wedge","quantity":1,"ounces":0}, "order": 4},
    {"name": "Mint Sprig", "pour": {"kind":"unitQuantity","unitType":"oneThing","name":"1 sprig","quantity":1,"ounces":0}, "order": 5}
  ]'::jsonb
);

SELECT seed_library_recipe(
  'White Russian',
  'Vodka, coffee liqueur, cream. The Dude approves.',
  12.00,
  'Build vodka and coffee liqueur over ice in a rocks glass. Float heavy cream on top. Stir gently to integrate when ready to drink.',
  'Vodka',
  '[
    {"name": "Vodka", "pour": {"kind":"decimalOunces","ounces":2}, "order": 1},
    {"name": "Kahlua", "brand": "Kahlua", "pour": {"kind":"decimalOunces","ounces":1}, "order": 2},
    {"name": "Heavy Cream", "pour": {"kind":"decimalOunces","ounces":1}, "order": 3, "notes": "Float on top"}
  ]'::jsonb
);

SELECT seed_library_recipe(
  'Bloody Mary',
  'Brunch staple. Vodka, tomato juice, lemon, with seasonings. Customize the spice and garnish to taste.',
  13.00,
  'Roll (don''t shake) vodka, tomato juice, lemon juice, and a few dashes each of Worcestershire, hot sauce, salt, and pepper between two tins. Strain into a tall glass with fresh ice. Garnish with an olive, celery stalk, and lemon wedge.',
  'Vodka',
  '[
    {"name": "Vodka", "pour": {"kind":"decimalOunces","ounces":1.5}, "order": 1},
    {"name": "Tomato Juice", "pour": {"kind":"decimalOunces","ounces":4}, "order": 2},
    {"name": "Lemon Juice", "pour": {"kind":"decimalOunces","ounces":0.5}, "order": 3},
    {"name": "Black Pepper", "pour": {"kind":"namedOunces","name":"Pinch","ounces":0}, "order": 4, "notes": "Plus Worcestershire and hot sauce"},
    {"name": "Olive", "pour": {"kind":"unitQuantity","unitType":"oneThing","name":"1 olive","quantity":1,"ounces":0}, "order": 5}
  ]'::jsonb
);


-- ============================================================
-- RUM CLASSICS
-- ============================================================

SELECT seed_library_recipe(
  'Daiquiri',
  'Rum, lime, sugar. The simplest, purest rum cocktail. The Hemingway template for everything that came after.',
  12.00,
  'Shake rum, lime juice, and simple syrup hard with ice. Double strain into a chilled coupe. Garnish with a lime wheel.',
  'Rum',
  '[
    {"name": "White Rum", "pour": {"kind":"decimalOunces","ounces":2}, "order": 1},
    {"name": "Lime Juice", "pour": {"kind":"decimalOunces","ounces":0.75}, "order": 2},
    {"name": "Simple Syrup", "pour": {"kind":"decimalOunces","ounces":0.5}, "order": 3},
    {"name": "Lime Wheel", "pour": {"kind":"unitQuantity","unitType":"oneThing","name":"1 wheel","quantity":1,"ounces":0}, "order": 4}
  ]'::jsonb
);

SELECT seed_library_recipe(
  'Mojito',
  'Cuban classic. Rum, lime, sugar, mint, soda. Refreshing and aromatic. All the work is in the muddle.',
  13.00,
  'Lightly muddle mint with simple syrup and lime juice in a tall glass. Add rum and pack with crushed ice. Top with club soda and stir gently. Garnish with a tall mint sprig and lime wheel.',
  'Rum',
  '[
    {"name": "White Rum", "pour": {"kind":"decimalOunces","ounces":2}, "order": 1},
    {"name": "Lime Juice", "pour": {"kind":"decimalOunces","ounces":0.75}, "order": 2},
    {"name": "Simple Syrup", "pour": {"kind":"decimalOunces","ounces":0.5}, "order": 3},
    {"name": "Mint Sprig", "pour": {"kind":"unitQuantity","unitType":"oneThing","name":"8 leaves","quantity":8,"ounces":0}, "order": 4, "notes": "Plus a sprig garnish"},
    {"name": "Club Soda", "pour": {"kind":"namedOunces","name":"Top","ounces":2}, "order": 5, "notes": "Top to fill"}
  ]'::jsonb
);

SELECT seed_library_recipe(
  'Mai Tai',
  'Trader Vic''s 1944 original. Aged rum, overproof rum, orgeat, lime, orange liqueur. Tiki''s flagship cocktail.',
  16.00,
  'Shake all ingredients hard with crushed ice. Pour unstrained into a double rocks glass. Garnish with a fat mint bouquet and a spent lime shell.',
  'Rum',
  '[
    {"name": "Aged Rum", "pour": {"kind":"decimalOunces","ounces":1}, "order": 1},
    {"name": "Wray and Nephew White Overproof", "brand": "Wray and Nephew", "pour": {"kind":"decimalOunces","ounces":1}, "order": 2},
    {"name": "Cointreau", "brand": "Cointreau", "pour": {"kind":"decimalOunces","ounces":0.5}, "order": 3},
    {"name": "Orgeat", "pour": {"kind":"decimalOunces","ounces":0.5}, "order": 4},
    {"name": "Lime Juice", "pour": {"kind":"decimalOunces","ounces":1}, "order": 5},
    {"name": "Mint Sprig", "pour": {"kind":"unitQuantity","unitType":"oneThing","name":"1 sprig","quantity":1,"ounces":0}, "order": 6, "notes": "Bouquet"}
  ]'::jsonb
);

SELECT seed_library_recipe(
  'Pina Colada',
  'Rum, coconut cream, pineapple juice. The Puerto Rican beach classic. Sweet, creamy, tropical.',
  14.00,
  'Blend white rum, coconut cream, and pineapple juice with crushed ice until smooth. Pour into a hurricane glass. Garnish with a pineapple wedge and a cherry.',
  'Rum',
  '[
    {"name": "White Rum", "pour": {"kind":"decimalOunces","ounces":2}, "order": 1},
    {"name": "Coconut Cream", "pour": {"kind":"decimalOunces","ounces":2}, "order": 2},
    {"name": "Pineapple Juice", "pour": {"kind":"decimalOunces","ounces":4}, "order": 3},
    {"name": "Lime Wheel", "pour": {"kind":"unitQuantity","unitType":"oneThing","name":"1 wheel","quantity":1,"ounces":0}, "order": 4}
  ]'::jsonb
);

SELECT seed_library_recipe(
  'Dark and Stormy',
  'Goslings rum and ginger beer. A registered trademark in Bermuda, where the dark rum brand is part of the recipe.',
  12.00,
  'Build lime juice and ginger beer over ice in a tall glass. Float the dark rum on top by pouring slowly over the back of a bar spoon. Garnish with a lime wedge.',
  'Rum',
  '[
    {"name": "Goslings Black Seal", "brand": "Goslings", "pour": {"kind":"decimalOunces","ounces":2}, "order": 1, "notes": "Float on top"},
    {"name": "Lime Juice", "pour": {"kind":"decimalOunces","ounces":0.5}, "order": 2},
    {"name": "Ginger Beer", "pour": {"kind":"namedOunces","name":"Top","ounces":4}, "order": 3, "notes": "Top to fill"},
    {"name": "Lime Wedge", "pour": {"kind":"unitQuantity","unitType":"oneThing","name":"1 wedge","quantity":1,"ounces":0}, "order": 4}
  ]'::jsonb
);

SELECT seed_library_recipe(
  'Painkiller',
  'Pusser''s creation, BVI tradition. Rum, pineapple, orange, coconut cream, with a heavy nutmeg dust.',
  14.00,
  'Shake all liquid ingredients with ice. Pour unstrained into a tall glass packed with crushed ice. Top generously with freshly grated nutmeg.',
  'Rum',
  '[
    {"name": "Spiced Rum", "pour": {"kind":"decimalOunces","ounces":2}, "order": 1},
    {"name": "Pineapple Juice", "pour": {"kind":"decimalOunces","ounces":4}, "order": 2},
    {"name": "Orange Juice", "pour": {"kind":"decimalOunces","ounces":1}, "order": 3},
    {"name": "Coconut Cream", "pour": {"kind":"decimalOunces","ounces":1}, "order": 4},
    {"name": "Nutmeg (Grated)", "pour": {"kind":"namedOunces","name":"Generous dust","ounces":0}, "order": 5}
  ]'::jsonb
);


-- ============================================================
-- TEQUILA + OTHER
-- ============================================================

SELECT seed_library_recipe(
  'Margarita',
  'Tequila, orange liqueur, lime. The defining Mexican cocktail. Rim with salt, garnish with lime.',
  13.00,
  'Salt half the rim of a rocks glass (use a lime wedge to wet, then dip in salt). Shake tequila, Cointreau, and lime juice with ice until well-chilled. Strain over fresh ice in the prepared glass. Garnish with a lime wheel.',
  'Tequila',
  '[
    {"name": "Blanco Tequila", "pour": {"kind":"decimalOunces","ounces":2}, "order": 1},
    {"name": "Cointreau", "brand": "Cointreau", "pour": {"kind":"decimalOunces","ounces":1}, "order": 2},
    {"name": "Lime Juice", "pour": {"kind":"decimalOunces","ounces":0.75}, "order": 3},
    {"name": "Salt Rim", "pour": {"kind":"namedOunces","name":"Rim","ounces":0}, "order": 4},
    {"name": "Lime Wheel", "pour": {"kind":"unitQuantity","unitType":"oneThing","name":"1 wheel","quantity":1,"ounces":0}, "order": 5}
  ]'::jsonb
);

SELECT seed_library_recipe(
  'Sidecar',
  'Cognac, orange liqueur, lemon. Pre-Prohibition French classic, sometimes credited to Harry''s in Paris.',
  15.00,
  'Sugar half the rim of a chilled coupe. Shake cognac, Cointreau, and lemon juice with ice. Double strain into the prepared glass. Garnish with an orange twist.',
  'Other',
  '[
    {"name": "Cognac", "pour": {"kind":"decimalOunces","ounces":2}, "order": 1},
    {"name": "Cointreau", "brand": "Cointreau", "pour": {"kind":"decimalOunces","ounces":0.75}, "order": 2},
    {"name": "Lemon Juice", "pour": {"kind":"decimalOunces","ounces":0.75}, "order": 3},
    {"name": "Sugar Rim", "pour": {"kind":"namedOunces","name":"Rim","ounces":0}, "order": 4},
    {"name": "Orange Twist", "pour": {"kind":"unitQuantity","unitType":"oneThing","name":"1 twist","quantity":1,"ounces":0}, "order": 5}
  ]'::jsonb
);


-- ============================================================
-- Done. Drop the helper function so it doesn''t pollute the schema.
-- ============================================================

DROP FUNCTION seed_library_recipe(TEXT, TEXT, NUMERIC, TEXT, TEXT, JSONB);
