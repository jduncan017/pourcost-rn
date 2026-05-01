-- ============================================================
-- Seed 001: Canonical ingredients (non-alcoholic)
--
-- Generic mixers, juices, syrups, dairy/egg, garnishes, herbs.
-- All brand = NULL since these are generic ingredient concepts.
-- enrichment_status = 'pending' so the Tier 2 enrichment job
-- picks them up to populate education_data.
--
-- Run AFTER migration 011_canonical_library_foundation.sql.
-- Apply via supabase SQL editor or `supabase db push` (uses
-- service role, bypasses RLS on INSERT).
-- ============================================================

-- ============================================================
-- JUICES (category = 'Juice')
-- ============================================================

INSERT INTO canonical_products (name, brand, category, subcategory, default_sizes, abv, origin, description, flavor_notes, enrichment_status)
VALUES
  ('Lime Juice', NULL, 'Juice', 'Citrus', '[{"kind":"namedOunces","name":"Fresh Squeezed","ounces":1}]'::jsonb, 0, NULL,
   'Fresh-squeezed juice from limes. The most common acid in modern cocktails.',
   '["bright","tart","floral","fresh"]'::jsonb, 'pending'),
  ('Lemon Juice', NULL, 'Juice', 'Citrus', '[{"kind":"namedOunces","name":"Fresh Squeezed","ounces":1}]'::jsonb, 0, NULL,
   'Fresh-squeezed juice from lemons. Slightly less tart than lime, with more sweetness.',
   '["bright","tart","clean"]'::jsonb, 'pending'),
  ('Orange Juice', NULL, 'Juice', 'Citrus', '[{"kind":"milliliters","ml":1000}]'::jsonb, 0, NULL,
   'Juice from oranges. Used in screwdrivers, tequila sunrises, and tiki drinks.',
   '["sweet","citrus","fruity"]'::jsonb, 'pending'),
  ('Grapefruit Juice', NULL, 'Juice', 'Citrus', '[{"kind":"milliliters","ml":1000}]'::jsonb, 0, NULL,
   'Juice from grapefruits. Bitter-tart character; common in palomas and salty dogs.',
   '["bitter","tart","floral"]'::jsonb, 'pending'),
  ('Pineapple Juice', NULL, 'Juice', 'Tropical', '[{"kind":"milliliters","ml":1000}]'::jsonb, 0, NULL,
   'Juice from pineapples. Foamy when shaken; central to tiki drinks like the Pina Colada.',
   '["sweet","tropical","tangy"]'::jsonb, 'pending'),
  ('Cranberry Juice', NULL, 'Juice', 'Berry', '[{"kind":"milliliters","ml":1000}]'::jsonb, 0, NULL,
   'Juice from cranberries, typically sweetened. Used in cosmopolitans and cape codders.',
   '["tart","fruity","sweet"]'::jsonb, 'pending'),
  ('Apple Juice', NULL, 'Juice', 'Pome', '[{"kind":"milliliters","ml":1000}]'::jsonb, 0, NULL,
   'Juice from apples. Used in fall cocktails and applejack drinks.',
   '["sweet","crisp","fruity"]'::jsonb, 'pending'),
  ('Tomato Juice', NULL, 'Juice', 'Vegetable', '[{"kind":"milliliters","ml":1000}]'::jsonb, 0, NULL,
   'Juice from tomatoes, typically with salt. Foundation of the Bloody Mary.',
   '["savory","umami","tangy"]'::jsonb, 'pending');


-- ============================================================
-- SYRUPS (category = 'Syrup')
-- ============================================================

INSERT INTO canonical_products (name, brand, category, subcategory, default_sizes, abv, origin, description, flavor_notes, enrichment_status)
VALUES
  ('Simple Syrup', NULL, 'Syrup', 'Plain', '[{"kind":"milliliters","ml":500}]'::jsonb, 0, NULL,
   'Equal parts sugar and water dissolved into a syrup. The default sweetener in most cocktails.',
   '["sweet","neutral"]'::jsonb, 'pending'),
  ('Rich Simple Syrup', NULL, 'Syrup', 'Plain', '[{"kind":"milliliters","ml":500}]'::jsonb, 0, NULL,
   '2:1 sugar to water syrup. Sweeter and thicker than standard simple, common in tiki and stirred drinks.',
   '["sweet","viscous","neutral"]'::jsonb, 'pending'),
  ('Demerara Syrup', NULL, 'Syrup', 'Sugar', '[{"kind":"milliliters","ml":500}]'::jsonb, 0, NULL,
   'Syrup made from demerara sugar. Adds molasses depth; standard in tiki and stirred whiskey drinks.',
   '["caramel","molasses","rich"]'::jsonb, 'pending'),
  ('Honey Syrup', NULL, 'Syrup', 'Honey', '[{"kind":"milliliters","ml":500}]'::jsonb, 0, NULL,
   'Honey thinned with water (typically 3:1 honey to water). Used in Bee''s Knees and Gold Rush.',
   '["floral","sweet","viscous"]'::jsonb, 'pending'),
  ('Ginger Syrup', NULL, 'Syrup', 'Spice', '[{"kind":"milliliters","ml":500}]'::jsonb, 0, NULL,
   'Sugar syrup infused with fresh ginger. Adds warmth and bite to sours and tiki drinks.',
   '["spicy","warm","sweet"]'::jsonb, 'pending'),
  ('Orgeat', NULL, 'Syrup', 'Nut', '[{"kind":"milliliters","ml":500}]'::jsonb, 0, NULL,
   'Almond syrup with hints of orange flower water. Essential in the Mai Tai and Japanese Cocktail.',
   '["nutty","floral","sweet"]'::jsonb, 'pending'),
  ('Grenadine', NULL, 'Syrup', 'Fruit', '[{"kind":"milliliters","ml":500}]'::jsonb, 0, NULL,
   'Pomegranate syrup. Real grenadine is made from pomegranate, not the artificial cherry-flavored version.',
   '["tart","sweet","fruity"]'::jsonb, 'pending'),
  ('Agave Syrup', NULL, 'Syrup', 'Plant', '[{"kind":"milliliters","ml":500}]'::jsonb, 0, NULL,
   'Syrup from agave plant. Common sweetener in tequila and mezcal drinks; sweeter than sugar.',
   '["sweet","earthy","mild"]'::jsonb, 'pending'),
  ('Falernum', NULL, 'Syrup', 'Spiced', '[{"kind":"milliliters","ml":500}]'::jsonb, 0, NULL,
   'Caribbean syrup of lime, ginger, almond, and clove. Tiki staple; some versions are lightly alcoholic.',
   '["spicy","citrus","almond"]'::jsonb, 'pending'),
  ('Maple Syrup', NULL, 'Syrup', 'Plant', '[{"kind":"milliliters","ml":500}]'::jsonb, 0, NULL,
   'Boiled maple sap. Adds woodsy sweetness; pairs especially well with whiskey and rye.',
   '["caramel","woodsy","sweet"]'::jsonb, 'pending'),
  ('Cinnamon Syrup', NULL, 'Syrup', 'Spice', '[{"kind":"milliliters","ml":500}]'::jsonb, 0, NULL,
   'Sugar syrup infused with cinnamon. Tiki and fall cocktail staple.',
   '["warm","spicy","sweet"]'::jsonb, 'pending'),
  ('Vanilla Syrup', NULL, 'Syrup', 'Spice', '[{"kind":"milliliters","ml":500}]'::jsonb, 0, NULL,
   'Sugar syrup with vanilla bean. Used in espresso martinis, brunch drinks, and dessert cocktails.',
   '["floral","creamy","sweet"]'::jsonb, 'pending'),
  ('Raspberry Syrup', NULL, 'Syrup', 'Fruit', '[{"kind":"milliliters","ml":500}]'::jsonb, 0, NULL,
   'Sugar syrup with raspberries. Used in clovers, French martinis, and modern berry cocktails.',
   '["fruity","tart","sweet"]'::jsonb, 'pending');


-- ============================================================
-- MIXERS (category = 'Mixer')
-- ============================================================

INSERT INTO canonical_products (name, brand, category, subcategory, default_sizes, abv, origin, description, flavor_notes, enrichment_status)
VALUES
  ('Club Soda', NULL, 'Mixer', 'Carbonated', '[{"kind":"milliliters","ml":1000}]'::jsonb, 0, NULL,
   'Carbonated water with added minerals. Used in highballs, spritzes, and to top sours.',
   '["mineral","crisp","clean"]'::jsonb, 'pending'),
  ('Tonic Water', NULL, 'Mixer', 'Carbonated', '[{"kind":"milliliters","ml":1000}]'::jsonb, 0, NULL,
   'Carbonated water with quinine and sugar. Bitter-sweet; the classic gin partner.',
   '["bitter","floral","sweet"]'::jsonb, 'pending'),
  ('Ginger Beer', NULL, 'Mixer', 'Carbonated', '[{"kind":"milliliters","ml":355}]'::jsonb, 0, NULL,
   'Spicy fermented (or carbonated) ginger drink. Essential in the Moscow Mule and Dark and Stormy.',
   '["spicy","sweet","sharp"]'::jsonb, 'pending'),
  ('Ginger Ale', NULL, 'Mixer', 'Carbonated', '[{"kind":"milliliters","ml":355}]'::jsonb, 0, NULL,
   'Sweeter and milder than ginger beer. Used in highballs and as a soft mixer.',
   '["sweet","mild","spicy"]'::jsonb, 'pending'),
  ('Cola', NULL, 'Mixer', 'Carbonated', '[{"kind":"milliliters","ml":355}]'::jsonb, 0, NULL,
   'Sweet caramel-flavored carbonated drink. Mixer in Cuba Libres, Long Islands, and Whiskey Cokes.',
   '["sweet","caramel","spiced"]'::jsonb, 'pending'),
  ('Lemon-Lime Soda', NULL, 'Mixer', 'Carbonated', '[{"kind":"milliliters","ml":355}]'::jsonb, 0, NULL,
   'Sweet citrus-flavored soda. Used in Tom Collins (commercially), Vodka Sodas with citrus profile.',
   '["sweet","citrus","crisp"]'::jsonb, 'pending'),
  ('Soda Water', NULL, 'Mixer', 'Carbonated', '[{"kind":"milliliters","ml":1000}]'::jsonb, 0, NULL,
   'Plain carbonated water. Functionally similar to club soda without added minerals.',
   '["neutral","crisp"]'::jsonb, 'pending'),
  ('Champagne (mixer use)', NULL, 'Mixer', 'Wine', '[{"kind":"milliliters","ml":750}]'::jsonb, 12, NULL,
   'Sparkling wine used to top spritzes, French 75s, and brunch cocktails. See Wine seed for varietal canonicals.',
   '["dry","crisp","floral"]'::jsonb, 'pending');


-- ============================================================
-- DAIRY + EGG (category = 'Dairy', 'Egg')
-- ============================================================

INSERT INTO canonical_products (name, brand, category, subcategory, default_sizes, abv, origin, description, flavor_notes, enrichment_status)
VALUES
  ('Heavy Cream', NULL, 'Dairy', 'Cream', '[{"kind":"milliliters","ml":480}]'::jsonb, 0, NULL,
   'High-fat dairy cream (~36% fat). Used in dessert cocktails like White Russians and Brandy Alexanders.',
   '["rich","creamy","mild"]'::jsonb, 'pending'),
  ('Half and Half', NULL, 'Dairy', 'Cream', '[{"kind":"milliliters","ml":480}]'::jsonb, 0, NULL,
   'Equal parts whole milk and cream. Lighter alternative to heavy cream in cocktails.',
   '["mild","creamy"]'::jsonb, 'pending'),
  ('Whole Milk', NULL, 'Dairy', 'Milk', '[{"kind":"milliliters","ml":1000}]'::jsonb, 0, NULL,
   'Standard cow''s milk. Used in milk punches and creamy cocktails.',
   '["mild","sweet","creamy"]'::jsonb, 'pending'),
  ('Coconut Cream', NULL, 'Dairy', 'Plant Cream', '[{"kind":"milliliters","ml":425}]'::jsonb, 0, NULL,
   'Sweetened coconut cream. The cornerstone of the Pina Colada.',
   '["sweet","tropical","creamy"]'::jsonb, 'pending'),
  ('Coconut Milk', NULL, 'Dairy', 'Plant Cream', '[{"kind":"milliliters","ml":400}]'::jsonb, 0, NULL,
   'Unsweetened coconut milk. Lighter than coconut cream; used in tiki and modern tropical drinks.',
   '["mild","tropical","creamy"]'::jsonb, 'pending'),
  ('Egg White', NULL, 'Egg', 'White', '[{"kind":"namedOunces","name":"One Whole Egg","ounces":1}]'::jsonb, 0, NULL,
   'White portion of a chicken egg. Adds frothy texture to sours; typically 1 egg = ~1 oz white.',
   '["neutral","texture"]'::jsonb, 'pending'),
  ('Whole Egg', NULL, 'Egg', 'Whole', '[{"kind":"namedOunces","name":"One Whole Egg","ounces":1.7}]'::jsonb, 0, NULL,
   'Whole chicken egg. Used in flips and cream-rich cocktails.',
   '["rich","creamy","neutral"]'::jsonb, 'pending'),
  ('Egg Yolk', NULL, 'Egg', 'Yolk', '[{"kind":"namedOunces","name":"One Whole Egg","ounces":0.7}]'::jsonb, 0, NULL,
   'Yolk portion of a chicken egg. Used in flips for richness.',
   '["rich","fatty","creamy"]'::jsonb, 'pending');


-- ============================================================
-- GARNISHES (category = 'Garnish')
-- ============================================================

INSERT INTO canonical_products (name, brand, category, subcategory, default_sizes, abv, origin, description, flavor_notes, enrichment_status)
VALUES
  ('Lime Wheel', NULL, 'Garnish', 'Citrus', '[{"kind":"unitQuantity","unitType":"oneThing","name":"1 wheel","quantity":1,"ounces":0}]'::jsonb, 0, NULL,
   'Slice of lime cut crosswise. Floats on a drink as garnish.',
   '["bright","aromatic"]'::jsonb, 'pending'),
  ('Lime Wedge', NULL, 'Garnish', 'Citrus', '[{"kind":"unitQuantity","unitType":"oneThing","name":"1 wedge","quantity":1,"ounces":0}]'::jsonb, 0, NULL,
   'Lime cut into wedges. For squeezing or perching on the rim.',
   '["bright","aromatic"]'::jsonb, 'pending'),
  ('Lemon Wheel', NULL, 'Garnish', 'Citrus', '[{"kind":"unitQuantity","unitType":"oneThing","name":"1 wheel","quantity":1,"ounces":0}]'::jsonb, 0, NULL,
   'Slice of lemon cut crosswise. Standard whiskey-sour and lemonade garnish.',
   '["bright","aromatic"]'::jsonb, 'pending'),
  ('Lemon Twist', NULL, 'Garnish', 'Citrus', '[{"kind":"unitQuantity","unitType":"oneThing","name":"1 twist","quantity":1,"ounces":0}]'::jsonb, 0, NULL,
   'Strip of lemon peel expressed over the drink. Standard for martinis and stirred classics.',
   '["aromatic","oils"]'::jsonb, 'pending'),
  ('Orange Wheel', NULL, 'Garnish', 'Citrus', '[{"kind":"unitQuantity","unitType":"oneThing","name":"1 wheel","quantity":1,"ounces":0}]'::jsonb, 0, NULL,
   'Slice of orange. Common in Old Fashioned and tiki garnishes.',
   '["sweet","aromatic"]'::jsonb, 'pending'),
  ('Orange Twist', NULL, 'Garnish', 'Citrus', '[{"kind":"unitQuantity","unitType":"oneThing","name":"1 twist","quantity":1,"ounces":0}]'::jsonb, 0, NULL,
   'Strip of orange peel expressed over the drink. Adds bright citrus oils.',
   '["aromatic","oils","sweet"]'::jsonb, 'pending'),
  ('Orange Peel', NULL, 'Garnish', 'Citrus', '[{"kind":"unitQuantity","unitType":"oneThing","name":"1 peel","quantity":1,"ounces":0}]'::jsonb, 0, NULL,
   'Wider strip of orange peel, often flamed over the drink. Classic Old Fashioned garnish.',
   '["aromatic","oils","sweet"]'::jsonb, 'pending'),
  ('Grapefruit Twist', NULL, 'Garnish', 'Citrus', '[{"kind":"unitQuantity","unitType":"oneThing","name":"1 twist","quantity":1,"ounces":0}]'::jsonb, 0, NULL,
   'Strip of grapefruit peel. Common in palomas and modern stirred drinks.',
   '["aromatic","bitter","floral"]'::jsonb, 'pending'),
  ('Maraschino Cherry', NULL, 'Garnish', 'Cherry', '[{"kind":"unitQuantity","unitType":"oneThing","name":"1 cherry","quantity":1,"ounces":0}]'::jsonb, 0, NULL,
   'Bright red preserved cherry. The classic American garnish for whiskey sours and Manhattans.',
   '["sweet","fruity"]'::jsonb, 'pending'),
  ('Luxardo Cherry', 'Luxardo', 'Garnish', 'Cherry', '[{"kind":"unitQuantity","unitType":"oneThing","name":"1 cherry","quantity":1,"ounces":0}]'::jsonb, 0, 'Italy',
   'Premium Italian preserved cherry in dark syrup. Standard at modern cocktail bars.',
   '["dark fruit","sweet","syrupy"]'::jsonb, 'pending'),
  ('Brandied Cherry', NULL, 'Garnish', 'Cherry', '[{"kind":"unitQuantity","unitType":"oneThing","name":"1 cherry","quantity":1,"ounces":0}]'::jsonb, 0, NULL,
   'Cherry preserved in brandy. Classic Manhattan garnish.',
   '["sweet","boozy","fruity"]'::jsonb, 'pending'),
  ('Cocktail Onion', NULL, 'Garnish', 'Vegetable', '[{"kind":"unitQuantity","unitType":"oneThing","name":"1 onion","quantity":1,"ounces":0}]'::jsonb, 0, NULL,
   'Pickled pearl onion. Distinguishes a Gibson from a Martini.',
   '["briny","sharp"]'::jsonb, 'pending'),
  ('Olive', NULL, 'Garnish', 'Vegetable', '[{"kind":"unitQuantity","unitType":"oneThing","name":"1 olive","quantity":1,"ounces":0}]'::jsonb, 0, NULL,
   'Brined olive (typically green; Castelvetrano or Manzanilla preferred). Standard martini garnish.',
   '["briny","savory","fruity"]'::jsonb, 'pending'),
  ('Mint Sprig', NULL, 'Garnish', 'Herb', '[{"kind":"unitQuantity","unitType":"oneThing","name":"1 sprig","quantity":1,"ounces":0}]'::jsonb, 0, NULL,
   'Fresh mint top. Slap to release oils. Essential for Mojitos, Mint Juleps, and tiki tins.',
   '["fresh","cooling","herbal"]'::jsonb, 'pending'),
  ('Basil Leaf', NULL, 'Garnish', 'Herb', '[{"kind":"unitQuantity","unitType":"oneThing","name":"1 leaf","quantity":1,"ounces":0}]'::jsonb, 0, NULL,
   'Fresh basil. Used in basil smashes and modern gin drinks.',
   '["herbal","sweet","aromatic"]'::jsonb, 'pending'),
  ('Rosemary Sprig', NULL, 'Garnish', 'Herb', '[{"kind":"unitQuantity","unitType":"oneThing","name":"1 sprig","quantity":1,"ounces":0}]'::jsonb, 0, NULL,
   'Fresh rosemary. Adds woodsy aroma; popular in gin and bourbon cocktails.',
   '["piney","resinous","herbal"]'::jsonb, 'pending'),
  ('Thyme Sprig', NULL, 'Garnish', 'Herb', '[{"kind":"unitQuantity","unitType":"oneThing","name":"1 sprig","quantity":1,"ounces":0}]'::jsonb, 0, NULL,
   'Fresh thyme. Adds savory, earthy aroma to stirred and gin drinks.',
   '["earthy","savory","herbal"]'::jsonb, 'pending'),
  ('Salt Rim', NULL, 'Garnish', 'Rim', '[{"kind":"namedOunces","name":"Pinch","ounces":0}]'::jsonb, 0, NULL,
   'Salt-rimmed glass. Standard for margaritas and salty dogs.',
   '["salty","mineral"]'::jsonb, 'pending'),
  ('Sugar Rim', NULL, 'Garnish', 'Rim', '[{"kind":"namedOunces","name":"Pinch","ounces":0}]'::jsonb, 0, NULL,
   'Sugar-rimmed glass. Standard for sidecars and lemon drops.',
   '["sweet"]'::jsonb, 'pending'),
  ('Tajin', 'Tajin', 'Garnish', 'Rim', '[{"kind":"namedOunces","name":"Pinch","ounces":0}]'::jsonb, 0, 'Mexico',
   'Mexican chili-lime salt blend. Increasingly common rim for palomas, micheladas, and modern margaritas.',
   '["spicy","salty","tart"]'::jsonb, 'pending');


-- ============================================================
-- HERBS + SPICES (category = 'Herb', 'Spice')
-- ============================================================

INSERT INTO canonical_products (name, brand, category, subcategory, default_sizes, abv, origin, description, flavor_notes, enrichment_status)
VALUES
  ('Nutmeg (Grated)', NULL, 'Spice', 'Whole', '[{"kind":"namedOunces","name":"Pinch","ounces":0}]'::jsonb, 0, NULL,
   'Freshly grated nutmeg. Classic top for flips, eggnog, and Painkillers.',
   '["warm","earthy","sweet"]'::jsonb, 'pending'),
  ('Cinnamon Stick', NULL, 'Spice', 'Whole', '[{"kind":"unitQuantity","unitType":"oneThing","name":"1 stick","quantity":1,"ounces":0}]'::jsonb, 0, NULL,
   'Whole cinnamon. Used as garnish on hot drinks and tiki cocktails.',
   '["warm","sweet","woody"]'::jsonb, 'pending'),
  ('Black Pepper', NULL, 'Spice', 'Ground', '[{"kind":"namedOunces","name":"Pinch","ounces":0}]'::jsonb, 0, NULL,
   'Freshly ground black pepper. Used on Bloody Mary tops and savory cocktails.',
   '["spicy","earthy"]'::jsonb, 'pending'),
  ('Star Anise', NULL, 'Spice', 'Whole', '[{"kind":"unitQuantity","unitType":"oneThing","name":"1 pod","quantity":1,"ounces":0}]'::jsonb, 0, NULL,
   'Star-shaped spice pod. Adds anise aroma to mulled drinks and stirred classics.',
   '["licorice","warm","aromatic"]'::jsonb, 'pending');


-- ============================================================
-- PREPPED TEMPLATES (category = 'Prepped')
-- These are recipe references for the Prepped Ingredient builder
-- (see feature-list.md). User builds a prep ingredient using one
-- of these templates; cost rolls up from component ingredients.
-- ============================================================

INSERT INTO canonical_products (name, brand, category, subcategory, default_sizes, abv, origin, description, flavor_notes, enrichment_status)
VALUES
  ('Oleo Saccharum', NULL, 'Prepped', 'Citrus Sugar', '[{"kind":"milliliters","ml":250}]'::jsonb, 0, NULL,
   'Sugar muddled with citrus peel and rested. Releases citrus oils into sugar; classic punch ingredient.',
   '["citrus","sweet","aromatic"]'::jsonb, 'pending'),
  ('Cordial (Lime)', NULL, 'Prepped', 'Cordial', '[{"kind":"milliliters","ml":500}]'::jsonb, 0, NULL,
   'Sweetened, preserved lime mixture. Modern bar staple; longer shelf life than fresh juice.',
   '["bright","sweet","preserved"]'::jsonb, 'pending'),
  ('Shrub (Berry)', NULL, 'Prepped', 'Drinking Vinegar', '[{"kind":"milliliters","ml":500}]'::jsonb, 0, NULL,
   'Fruit, sugar, and vinegar reduction. Tart-sweet syrup substitute that pairs with most spirits.',
   '["tart","fruity","vinegar"]'::jsonb, 'pending'),
  ('Bitters Tincture', NULL, 'Prepped', 'Tincture', '[{"kind":"milliliters","ml":150}]'::jsonb, 35, NULL,
   'House bitters made by infusing high-proof spirit with botanicals. Customizable to bar style.',
   '["bitter","aromatic","complex"]'::jsonb, 'pending');
