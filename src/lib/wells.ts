/**
 * Well-tier setup data.
 *
 * "Wells" are the bar's standard house pours. Each WellCategory drives one
 * row in the onboarding screen and one row in Settings → Manage Wells.
 *
 * Two-tier disclosure:
 *   - defaultExpanded=true rows render up front (the 6 most universal)
 *   - defaultExpanded=false rows live behind an "Add more wells" expander
 *     for bars that differentiate (Rye, Scotch, Sweet/Dry Vermouth, etc.)
 *
 * Each row's bottom-sheet picker is scoped to the row's canonical filter:
 *   - canonicalCategory   → category column (default 'Spirit')
 *   - canonicalSubcategories → subcategory IN (...) filter
 *   - nameKeyword (optional) → AND name ILIKE %keyword%, used for granular
 *     wells until the canonical seed breaks out finer subcategories. Lets
 *     a Bourbon row return only bourbons (not all whiskeys) without a
 *     re-seed.
 *
 * Curated `quickPicks` skip the canonical lookup entirely. They no longer
 * carry a ballpark price — the user enters cost for every selection (quick
 * pick or canonical), so what bars see in the app reflects their real cost.
 */
import { Volume } from '@/src/types/models';

export interface WellQuickPick {
  name: string;
  /** Default size to pre-fill on the tile. User can change via the size picker. */
  productSize: Volume;
}

export interface WellCategory {
  /** Stable key for telemetry, persisted state, and sub-keying selections. */
  key: string;
  /** Header label shown to the user (e.g. "Well Vodka"). */
  label: string;
  /** Maps to the ingredient row's `sub_type` and the cocktail picker's
   *  exact-match lookup. */
  subType: string;
  /** Canonical category filter. Defaults to 'Spirit'. Set to 'Vermouth' for
   *  vermouth rows (Vermouth lives outside the Spirit category in canonicals). */
  canonicalCategory?: string;
  /** Canonical subcategories searched in this row's picker. */
  canonicalSubcategories: string[];
  /** Optional name keyword AND'd into the canonical query. Use for granular
   *  rows whose subcategory hasn't been broken out in the canonical seed
   *  yet (e.g. Bourbon row: subcategories=['Whiskey'], nameKeyword='bourbon'). */
  nameKeyword?: string;
  /** True for the universal categories shown by default. False for granular
   *  add-ons revealed via the "Add more wells" expander. */
  defaultExpanded: boolean;
  /** Curated popular brands shown above canonical search results. */
  quickPicks: WellQuickPick[];
}

/**
 * Spirit family map for the V1.1 cocktail picker substitution walk.
 *
 * When a recipe slot says "Bourbon" and the bar has no Bourbon well, the
 * picker walks the family: any well with subType in WHISKEY_FAMILY can fill
 * the slot, with a "substituted" indicator surfaced to the bartender.
 *
 * Single-member families (Vodka, Gin) are intentionally absent.
 */
export const SPIRIT_FAMILIES: Record<string, string[]> = {
  Whiskey: ['Whiskey', 'Bourbon', 'Rye', 'Scotch', 'Irish', 'Japanese', 'Canadian'],
  Rum: ['Rum', 'White Rum', 'Light Rum', 'Dark Rum', 'Aged Rum', 'Spiced Rum', 'Overproof Rum'],
  // Tequila and Mezcal are NOT auto-substituted for each other — Mezcal cocktails
  // are their own thing in the bartender's mind. Listed as siblings here so a
  // future "willing fallback" mode can opt in if the bar wants it.
  Agave: ['Tequila', 'Mezcal'],
  Vermouth: ['Sweet Vermouth', 'Dry Vermouth', 'Vermouth'],
};

export function familyFallbacks(subType: string): string[] {
  for (const members of Object.values(SPIRIT_FAMILIES)) {
    if (members.includes(subType)) {
      return members.filter((m) => m !== subType);
    }
  }
  return [];
}

const bottle = (ml: number): Volume => ({ kind: 'milliliters', ml });

export const WELL_CATEGORIES: WellCategory[] = [
  // ---- DEFAULT (6 universal categories) ----
  {
    key: 'vodka',
    label: 'Well Vodka',
    subType: 'Vodka',
    canonicalSubcategories: ['Vodka'],
    defaultExpanded: true,
    quickPicks: [
      { name: 'Smirnoff Vodka', productSize: bottle(1000) },
      { name: 'Absolut Vodka', productSize: bottle(1000) },
      { name: 'New Amsterdam Vodka', productSize: bottle(1000) },
      { name: 'Skyy Vodka', productSize: bottle(1000) },
    ],
  },
  {
    key: 'gin',
    label: 'Well Gin',
    subType: 'Gin',
    canonicalSubcategories: ['Gin'],
    defaultExpanded: true,
    quickPicks: [
      { name: 'Beefeater Gin', productSize: bottle(1000) },
      { name: 'Bombay Dry Gin', productSize: bottle(1000) },
      { name: 'Seagram’s Gin', productSize: bottle(1000) },
      { name: 'Gordon’s Gin', productSize: bottle(1000) },
    ],
  },
  {
    key: 'rum',
    label: 'Well Rum',
    subType: 'Rum',
    canonicalSubcategories: ['Rum'],
    defaultExpanded: true,
    quickPicks: [
      { name: 'Cruzan Light Rum', productSize: bottle(1000) },
      { name: 'Castillo Silver Rum', productSize: bottle(1000) },
      { name: 'Captain Morgan Spiced Rum', productSize: bottle(1000) },
      { name: 'Myers’s Dark Rum', productSize: bottle(1000) },
    ],
  },
  {
    key: 'tequila',
    label: 'Well Tequila',
    subType: 'Tequila',
    canonicalSubcategories: ['Tequila'],
    defaultExpanded: true,
    quickPicks: [
      { name: 'Jose Cuervo Especial Silver', productSize: bottle(1000) },
      { name: 'Sauza Silver Tequila', productSize: bottle(1000) },
      { name: 'Camarena Silver Tequila', productSize: bottle(1000) },
      { name: 'Lunazul Blanco Tequila', productSize: bottle(1000) },
    ],
  },
  {
    key: 'whiskey',
    label: 'Well Whiskey',
    subType: 'Whiskey',
    canonicalSubcategories: ['Whiskey'],
    defaultExpanded: true,
    quickPicks: [
      { name: 'Seagram’s 7 Crown', productSize: bottle(1000) },
      { name: 'Canadian Club Whisky', productSize: bottle(1000) },
      { name: 'Jameson Irish Whiskey', productSize: bottle(1000) },
      { name: 'Dewar’s White Label', productSize: bottle(1000) },
    ],
  },
  {
    key: 'bourbon',
    label: 'Well Bourbon',
    subType: 'Bourbon',
    canonicalSubcategories: ['Whiskey'],
    nameKeyword: 'bourbon',
    defaultExpanded: true,
    quickPicks: [
      { name: 'Jim Beam Bourbon', productSize: bottle(1000) },
      { name: 'Evan Williams Bourbon', productSize: bottle(1000) },
      { name: 'Old Crow Bourbon', productSize: bottle(1000) },
      { name: 'Wild Turkey 81 Bourbon', productSize: bottle(1000) },
    ],
  },
  // ---- ADD MORE WELLS (granular, opt-in) ----
  {
    key: 'rye',
    label: 'Well Rye',
    subType: 'Rye',
    canonicalSubcategories: ['Whiskey'],
    nameKeyword: 'rye',
    defaultExpanded: false,
    quickPicks: [
      { name: 'Old Overholt Rye', productSize: bottle(1000) },
      { name: 'Rittenhouse Rye', productSize: bottle(1000) },
      { name: 'Bulleit Rye', productSize: bottle(1000) },
    ],
  },
  {
    key: 'scotch',
    label: 'Well Scotch',
    subType: 'Scotch',
    canonicalSubcategories: ['Whiskey'],
    nameKeyword: 'scotch',
    defaultExpanded: false,
    quickPicks: [
      { name: 'Dewar’s White Label', productSize: bottle(1000) },
      { name: 'Famous Grouse', productSize: bottle(1000) },
      { name: 'Cutty Sark', productSize: bottle(1000) },
      { name: 'J&B Rare', productSize: bottle(1000) },
    ],
  },
  {
    key: 'irish',
    label: 'Well Irish Whiskey',
    subType: 'Irish',
    canonicalSubcategories: ['Whiskey'],
    nameKeyword: 'irish',
    defaultExpanded: false,
    quickPicks: [
      { name: 'Jameson Irish Whiskey', productSize: bottle(1000) },
      { name: 'Tullamore Dew', productSize: bottle(1000) },
      { name: 'Bushmills Original', productSize: bottle(1000) },
    ],
  },
  {
    key: 'japanese',
    label: 'Well Japanese Whisky',
    subType: 'Japanese',
    canonicalSubcategories: ['Whiskey'],
    nameKeyword: 'japan',
    defaultExpanded: false,
    quickPicks: [
      { name: 'Suntory Toki', productSize: bottle(1000) },
      { name: 'Nikka Coffey Grain', productSize: bottle(1000) },
    ],
  },
  // Rum sub-types — same nameKeyword trick until canonical seed breaks rum out
  {
    key: 'white_rum',
    label: 'Well White Rum',
    subType: 'White Rum',
    canonicalSubcategories: ['Rum'],
    nameKeyword: 'white',
    defaultExpanded: false,
    quickPicks: [
      { name: 'Bacardi Superior', productSize: bottle(1000) },
      { name: 'Cruzan Light Rum', productSize: bottle(1000) },
      { name: 'Don Q Cristal', productSize: bottle(1000) },
    ],
  },
  {
    key: 'dark_rum',
    label: 'Well Dark Rum',
    subType: 'Dark Rum',
    canonicalSubcategories: ['Rum'],
    nameKeyword: 'dark',
    defaultExpanded: false,
    quickPicks: [
      { name: 'Myers’s Dark Rum', productSize: bottle(1000) },
      { name: 'Goslings Black Seal', productSize: bottle(1000) },
      { name: 'Cruzan Black Strap', productSize: bottle(1000) },
    ],
  },
  {
    key: 'aged_rum',
    label: 'Well Aged Rum',
    subType: 'Aged Rum',
    canonicalSubcategories: ['Rum'],
    nameKeyword: 'aged',
    defaultExpanded: false,
    quickPicks: [
      { name: 'Mount Gay Eclipse', productSize: bottle(1000) },
      { name: 'El Dorado 8 Year', productSize: bottle(1000) },
      { name: 'Appleton Estate Signature', productSize: bottle(1000) },
    ],
  },
  {
    key: 'overproof_rum',
    label: 'Well Overproof Rum',
    subType: 'Overproof Rum',
    canonicalSubcategories: ['Rum'],
    nameKeyword: 'overproof',
    defaultExpanded: false,
    quickPicks: [
      { name: 'Wray & Nephew Overproof', productSize: bottle(1000) },
      { name: 'Bacardi 151', productSize: bottle(1000) },
    ],
  },
  {
    key: 'mezcal',
    label: 'Well Mezcal',
    subType: 'Mezcal',
    canonicalSubcategories: ['Mezcal'],
    defaultExpanded: false,
    quickPicks: [
      { name: 'Del Maguey Vida', productSize: bottle(1000) },
      { name: 'Banhez Joven', productSize: bottle(1000) },
      { name: 'Ilegal Joven', productSize: bottle(1000) },
    ],
  },
  {
    key: 'brandy',
    label: 'Well Brandy / Cognac',
    subType: 'Brandy',
    canonicalSubcategories: ['Brandy'],
    defaultExpanded: false,
    quickPicks: [
      { name: 'E&J VS Brandy', productSize: bottle(1000) },
      { name: 'Hennessy VS', productSize: bottle(1000) },
      { name: 'Courvoisier VS', productSize: bottle(1000) },
    ],
  },
  // Vermouth lives in its own canonical category, not Spirit.
  {
    key: 'sweet_vermouth',
    label: 'Well Sweet Vermouth',
    subType: 'Sweet Vermouth',
    canonicalCategory: 'Vermouth',
    canonicalSubcategories: ['Sweet'],
    defaultExpanded: false,
    quickPicks: [
      { name: 'Cinzano Rosso', productSize: bottle(1000) },
      { name: 'Martini & Rossi Sweet Vermouth', productSize: bottle(1000) },
      { name: 'Dolin Rouge', productSize: bottle(1000) },
    ],
  },
  {
    key: 'dry_vermouth',
    label: 'Well Dry Vermouth',
    subType: 'Dry Vermouth',
    canonicalCategory: 'Vermouth',
    canonicalSubcategories: ['Dry'],
    defaultExpanded: false,
    quickPicks: [
      { name: 'Martini & Rossi Extra Dry', productSize: bottle(1000) },
      { name: 'Dolin Dry Vermouth', productSize: bottle(1000) },
      { name: 'Noilly Prat Original Dry', productSize: bottle(1000) },
    ],
  },
];

/** Bottle sizes shown by default in the wells size picker. Ascending order
 *  (smallest → largest). Restricted to sizes that actually appear in the
 *  canonical seed (500/750/1000/1750). */
export const COMMON_WELL_SIZES: { value: Volume; label: string }[] = [
  { value: { kind: 'milliliters', ml: 500 }, label: '500 ml' },
  { value: { kind: 'milliliters', ml: 750 }, label: '750 ml' },
  { value: { kind: 'milliliters', ml: 1000 }, label: '1 L' },
  { value: { kind: 'milliliters', ml: 1750 }, label: '1.75 L (handle)' },
];

/** Less common sizes — minis, splits, magnums. Revealed via "Other sizes". */
export const EXTENDED_WELL_SIZES: { value: Volume; label: string }[] = [
  { value: { kind: 'milliliters', ml: 50 }, label: '50 ml (mini)' },
  { value: { kind: 'milliliters', ml: 200 }, label: '200 ml' },
  { value: { kind: 'milliliters', ml: 375 }, label: '375 ml' },
  { value: { kind: 'milliliters', ml: 1500 }, label: '1.5 L (magnum)' },
  { value: { kind: 'milliliters', ml: 3000 }, label: '3 L' },
];

/** Default well bottle size — 1L preferred, 750mL fallback. Used by the
 *  quick-pick onSelect and canonical-pick onSelect to choose a starting
 *  size when none is explicitly set. */
export const PREFERRED_WELL_SIZE: Volume = { kind: 'milliliters', ml: 1000 };
export const FALLBACK_WELL_SIZE: Volume = { kind: 'milliliters', ml: 750 };

/**
 * Pick the best default size from a canonical product's default_sizes.
 * Prefers 1L, then 750mL, then the first listed.
 */
export function bestSizeFromCanonical(defaultSizes: Volume[]): Volume {
  const findMl = (ml: number) =>
    defaultSizes.find((s) => s.kind === 'milliliters' && (s as { ml: number }).ml === ml);
  return findMl(1000) ?? findMl(750) ?? defaultSizes[0] ?? FALLBACK_WELL_SIZE;
}
