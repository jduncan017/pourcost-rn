/**
 * Bar staples — items every cocktail program assumes you have on hand.
 *
 * The cocktail picker auto-includes any of these that a selected recipe needs.
 * Each staple has a typical cost + size estimate baked in (see
 * STAPLE_DEFAULTS) so the user lands in the app with a working bar instead
 * of $0-cost juice and salt rows. Bar managers don't know the cost of a
 * single cherry, but everyone knows roughly what a jar costs.
 *
 * Match is by canonical product NAME (case-insensitive). Brands aren't
 * considered — Angostura Aromatic Bitters is a staple regardless of which
 * canonical row it points to.
 */
import { Volume } from '@/src/types/models';

export const STAPLE_NAMES: ReadonlySet<string> = new Set(
  [
    // Citrus
    'Lime Juice',
    'Fresh Lime Juice',
    'Lemon Juice',
    'Fresh Lemon Juice',
    'Orange Juice',
    'Grapefruit Juice',
    // Sweeteners / syrups (basic)
    'Simple Syrup',
    'Demerara Syrup',
    'Rich Simple Syrup',
    'Honey Syrup',
    // Bitters (only the universal one — Peychaud's is recipe-specific)
    'Angostura Aromatic Bitters',
    // Mixers
    'Club Soda',
    'Soda Water',
    'Tonic Water',
    'Ginger Beer',
    // Pantry
    'Sugar',
    'Sugar Cube',
    'Salt',
    // Egg
    'Egg White',
    // Garnishes (no-cost garnishes; don't ask the user to price these)
    'Lime Wedge',
    'Lemon Wedge',
    'Orange Peel',
    'Orange Twist',
    'Lemon Twist',
    'Lemon Peel',
    'Mint Sprig',
    'Mint Leaves',
    // Cherries (priced per jar, see STAPLE_DEFAULTS)
    'Maraschino Cherry',
  ].map((s) => s.toLowerCase()),
);

export function isStapleName(name: string | null | undefined): boolean {
  if (!name) return false;
  return STAPLE_NAMES.has(name.toLowerCase());
}

// ============================================================
// Default purchase size + cost per staple
// ============================================================

export interface StapleDefault {
  /** Storage unit — what the bar buys, NOT what the recipe pours. */
  productSize: Volume;
  /** Realistic wholesale cost in USD for that purchase unit. */
  productCost: number;
  /** Override the staple's not_for_sale default. Most staples are not sold
   *  standalone (they're inputs to cocktails), so true unless noted. */
  notForSale?: boolean;
}

const oz = (n: number): Volume => ({ kind: 'decimalOunces', ounces: n });
const ml = (n: number): Volume => ({ kind: 'milliliters', ml: n });
/** Build a unitQuantity Volume for jars / packs of countable items. */
const jar = (count: number, name: string): Volume => ({
  kind: 'unitQuantity',
  unitType: 'oneCanOrBottle',
  name,
  quantity: count,
  ounces: 0,
});

/**
 * Per-staple default storage size + cost. All values are USD wholesale
 * ballpark. Bars edit from My Inventory if their actual costs differ.
 *
 * Match is case-insensitive on the canonical name. Anything not in this
 * map falls back to canonical default_size + $0.
 */
export const STAPLE_DEFAULTS: Record<string, StapleDefault> = {
  // Citrus juices — 32 oz container is the common bar prep batch.
  'lime juice': { productSize: oz(32), productCost: 8, notForSale: true },
  'fresh lime juice': { productSize: oz(32), productCost: 8, notForSale: true },
  'lemon juice': { productSize: oz(32), productCost: 7, notForSale: true },
  'fresh lemon juice': { productSize: oz(32), productCost: 7, notForSale: true },
  'orange juice': { productSize: oz(32), productCost: 5, notForSale: true },
  'grapefruit juice': { productSize: oz(32), productCost: 6, notForSale: true },

  // Syrups — also 32 oz batches. Sugar + water is cheap; labor + flavored
  // ingredients push the more elaborate syrups higher.
  'simple syrup': { productSize: oz(32), productCost: 3, notForSale: true },
  'rich simple syrup': { productSize: oz(32), productCost: 4, notForSale: true },
  'demerara syrup': { productSize: oz(32), productCost: 5, notForSale: true },
  'honey syrup': { productSize: oz(32), productCost: 6, notForSale: true },

  // Bitters — bottles run small. Angostura's standard 4oz at ~$10.
  'angostura aromatic bitters': { productSize: oz(4), productCost: 10, notForSale: true },

  // Mixers — 1L bottle is common bar SKU.
  'club soda': { productSize: ml(1000), productCost: 2, notForSale: true },
  'soda water': { productSize: ml(1000), productCost: 2, notForSale: true },
  'tonic water': { productSize: ml(1000), productCost: 3, notForSale: true },
  'ginger beer': { productSize: ml(1000), productCost: 4, notForSale: true },

  // Pantry — sold by weight but used by pinch / cube. Coarse estimates.
  sugar: { productSize: oz(16), productCost: 1, notForSale: true },
  'sugar cube': { productSize: jar(100, '100 cubes'), productCost: 4, notForSale: true },
  salt: { productSize: oz(16), productCost: 2, notForSale: true },

  // Egg — priced per egg (one dozen ~$5).
  'egg white': {
    productSize: { kind: 'namedOunces', name: '1 egg', ounces: 1 },
    productCost: 0.42,
    notForSale: true,
  },

  // Garnishes — effectively zero cost. Wedges/peels come from the same fruit
  // already counted under juice; mint is a few dollars per bunch.
  'lime wedge': { productSize: jar(8, '1 lime, 8 wedges'), productCost: 0.5, notForSale: true },
  'lemon wedge': { productSize: jar(8, '1 lemon, 8 wedges'), productCost: 0.5, notForSale: true },
  'orange peel': { productSize: jar(10, '1 orange, 10 peels'), productCost: 0.5, notForSale: true },
  'orange twist': { productSize: jar(10, '1 orange, 10 twists'), productCost: 0.5, notForSale: true },
  'lemon twist': { productSize: jar(10, '1 lemon, 10 twists'), productCost: 0.4, notForSale: true },
  'lemon peel': { productSize: jar(10, '1 lemon, 10 peels'), productCost: 0.4, notForSale: true },
  'mint sprig': { productSize: jar(20, '1 bunch (~20 sprigs)'), productCost: 3, notForSale: true },
  'mint leaves': { productSize: jar(40, '1 bunch (~40 leaves)'), productCost: 3, notForSale: true },

  // Cherries — jar of 40 at typical mid-tier pricing. Luxardo runs higher
  // ($20+) but the generic Maraschino canonical maps here; users with
  // Luxardo update the cost or pick the Luxardo canonical specifically.
  'maraschino cherry': { productSize: jar(40, '1 jar (~40 cherries)'), productCost: 8, notForSale: true },
};

/**
 * Look up a staple's default size + cost by canonical name. Returns null
 * if the name isn't in the map (caller falls back to canonical default_size
 * + $0).
 */
export function getStapleDefault(name: string | null | undefined): StapleDefault | null {
  if (!name) return null;
  return STAPLE_DEFAULTS[name.toLowerCase()] ?? null;
}
