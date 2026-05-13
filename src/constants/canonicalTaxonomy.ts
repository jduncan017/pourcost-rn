/**
 * Locked canonical taxonomy — single source of truth shared between Gemini
 * enrichment prompts and runtime validation. Mirrors docs/database_decisions.md.
 *
 * Any change here MUST be applied to:
 *   - docs/database_decisions.md decision log
 *   - supabase/seeds/*.sql (source-of-truth seed files)
 *   - migration that updates existing canonical_products rows
 */

export const CANONICAL_CATEGORIES = [
  'Spirit', 'Liqueur', 'Vermouth', 'Bitters',
  'Wine', 'Beer',
  'Juice', 'Syrup', 'Mixer',
  'Dairy', 'Egg', 'Spice', 'Herb',
  'Garnish', 'Prepped',
] as const;
export type CanonicalCategory = (typeof CANONICAL_CATEGORIES)[number];

/** Per-category subcategory vocabularies. Categories not listed are flat
 *  (no subcategory): Dairy, Egg, Spice, Herb. */
export const CANONICAL_SUBCATEGORIES: Record<string, readonly string[]> = {
  Spirit: [
    // Vodka
    'Plain', 'Flavored',
    // Whiskey family (9)
    'Bourbon', 'Tennessee Whiskey', 'Rye Whiskey', 'Scotch', 'Irish Whiskey',
    'Japanese Whisky', 'Canadian Whisky', 'American Whiskey', 'Other Whiskey',
    // Gin (6)
    'Gin: London Dry', 'Gin: Plymouth', 'Gin: Old Tom', 'Gin: Genever',
    'Gin: Navy Strength', 'Gin: Modern',
    // Tequila (5)
    'Tequila Blanco', 'Tequila Reposado', 'Tequila Anejo',
    'Tequila Extra Anejo', 'Tequila Cristalino',
    // Mezcal (3)
    'Mezcal Joven', 'Mezcal Reposado', 'Mezcal Anejo',
    // Other agave + adjacent (2)
    'Other Agave', 'Sotol',
    // Rum family (9)
    'White Rum', 'Gold Rum', 'Aged Rum', 'Dark Rum', 'Spiced Rum',
    'Overproof Rum', 'Rhum Agricole', 'Cachaça', 'Other Rum',
    // Brandy family (5)
    'Cognac', 'Armagnac', 'Calvados', 'Pisco', 'Brandy',
    // East Asian / Nordic (4)
    'Aquavit', 'Soju', 'Shochu', 'Baijiu',
    // Anise spirits (2)
    'Absinthe', 'Pastis',
    // Ready-to-drink: canned cocktails, premixed bottles (High Noon's
    // cocktail line, On The Rocks, Cutwater, etc. — NOT hard seltzers
    // which live under Beer > Hard Seltzer)
    'RTD',
    // Catchall
    'Other Spirit',
  ],
  Liqueur: [
    'Orange', 'Citrus', 'Cherry', 'Berry', 'Stone Fruit', 'Tropical',
    'Herbal', 'Anise', 'Coffee', 'Cream', 'Almond', 'Hazelnut', 'Cacao',
    'Floral', 'Mint', 'Vanilla', 'Spiced', 'Aperitif Bitter', 'Amaro', 'Other',
  ],
  Vermouth: ['Dry', 'Sweet', 'Bianco', 'Aperitif Wine'],
  Bitters: ['Aromatic', 'Orange', 'Chocolate', 'Other'],
  Wine: ['Red', 'White', 'Orange', 'Rosé', 'Sparkling', 'Fortified', 'Sake', 'Mead'],
  Beer: [
    'Lager', 'Pilsner', 'IPA', 'Pale Ale', 'Amber', 'Stout', 'Porter',
    'Wheat', 'Sour', 'Belgian', 'Ale',
    'Cider', 'Hard Seltzer', 'Hard Kombucha', 'Other',
  ],
  Juice: ['Citrus', 'Tropical', 'Berry', 'Vegetable', 'Other'],
  Syrup: ['Plain', 'Sweetener', 'Flavored', 'Spiced', 'Nut', 'Grenadine', 'Other'],
  Mixer: ['Soda', 'Energy', 'Cocktail Mix', 'Other'],
  Garnish: ['Citrus', 'Cherry', 'Olive', 'Onion', 'Herb', 'Rim', 'Other'],
  Prepped: ['Syrup', 'Infusion', 'Oleo Saccharum', 'Shrub', 'Tincture', 'Cordial', 'Other'],
};

/** Wine varietals — constrained vocabulary for Wine category enrichment. */
export const WINE_VARIETALS: readonly string[] = [
  // Red (19)
  'Cabernet Sauvignon', 'Merlot', 'Pinot Noir', 'Syrah/Shiraz', 'Zinfandel',
  'Malbec', 'Tempranillo', 'Sangiovese', 'Nebbiolo', 'Grenache', 'Petite Sirah',
  'Carménère', 'Mourvèdre', 'Barbera', 'Aglianico',
  'Bordeaux Blend', 'GSM Blend', 'Red Blend', 'Other Red',
  // White (14)
  'Chardonnay', 'Sauvignon Blanc', 'Riesling', 'Pinot Grigio', 'Albariño',
  'Gewürztraminer', 'Viognier', 'Chenin Blanc', 'Vermentino', 'Grüner Veltliner',
  'Sémillon', 'Moscato', 'White Blend', 'Other White',
  // Sparkling (4)
  'Champagne Blend', 'Glera', 'Macabeo Blend', 'Other Sparkling Blend',
];

/** 149-term controlled flavor-notes vocabulary, grouped by family.
 *  Gemini selects 5-10 tags per product from this list.
 *  Synced with docs/database_decisions.md "Flavor tags vocabulary". */
export const FLAVOR_NOTES_VOCAB: readonly string[] = [
  // Citrus (8)
  'citrus','lemon','lime','orange','grapefruit','bergamot','yuzu','tangerine',
  // Stone fruit (5)
  'stone-fruit','cherry','peach','apricot','plum',
  // Pome (3)
  'apple','pear','quince',
  // Berry (9)
  'berry','strawberry','raspberry','blackberry','blueberry','cranberry',
  'blackcurrant','redcurrant','gooseberry',
  // Tropical (7)
  'tropical','pineapple','mango','banana','coconut','passionfruit','lychee',
  // Dried fruit (5)
  'dried-fruit','raisin','fig','date','prune',
  // Cooked fruit (3)
  'cooked-fruit','jammy','stewed-fruit',
  // Herbal (10)
  'herbal','mint','basil','thyme','rosemary','sage','eucalyptus','tarragon',
  'fennel','lemongrass',
  // Spice (14)
  'spice','cinnamon','clove','cardamom','allspice','nutmeg','ginger',
  'black-pepper','white-pepper','pink-pepper','juniper','coriander','saffron',
  'star-anise',
  // Floral (9)
  'floral','rose','violet','elderflower','lavender','honeysuckle','jasmine',
  'orange-blossom','white-flower',
  // Nutty (5)
  'nutty','almond','hazelnut','walnut','pistachio',
  // Vegetal (5)
  'vegetal','grass','cucumber','bell-pepper','olive',
  // Earthy (7)
  'earthy','mushroom','tobacco','leather','forest-floor','truffle','blood',
  // Smoke/char (7)
  'smoky','peat','campfire','charred','ash','iodine','tar',
  // Wood (5)
  'wood','oak','cedar','pine','sandalwood',
  // Cocoa/coffee (5)
  'cocoa','dark-chocolate','milk-chocolate','coffee','espresso',
  // Dairy (3)
  'cream','buttery','caramel',
  // Sweet flavors (4)
  'vanilla','honey','molasses','maple',
  // Bread/yeast (3)
  'bread','brioche','yeast',
  // Anise (2)
  'anise','licorice',
  // Salt/mineral (7)
  'salty','briny','mineral','flint','chalky','iron','graphite',
  // Petrol (1)
  'petrol',
  // Funky/reductive (3)
  'barnyard','funky','struck-match',
  // Character/palate (19)
  'sweet','bitter','sour','dry','tannic','acidic','bright','rich','light',
  'crisp','smooth','warming','peppery','astringent','oily','effervescent',
  'silky','round','balanced',
];

/** Categories with no subcategory layer (flat). Gemini returns subcategory=null
 *  for products in these categories. */
export const FLAT_CATEGORIES = new Set(['Dairy', 'Egg', 'Spice', 'Herb']);

/** Quick validation that a (category, subcategory) pair is allowed by the
 *  locked taxonomy. */
export function isValidCanonicalTaxonomy(
  category: string,
  subcategory: string | null | undefined,
): boolean {
  if (!CANONICAL_CATEGORIES.includes(category as CanonicalCategory)) return false;
  if (FLAT_CATEGORIES.has(category)) return subcategory == null;
  const subs = CANONICAL_SUBCATEGORIES[category];
  if (!subs) return subcategory == null;
  return subcategory != null && subs.includes(subcategory);
}
