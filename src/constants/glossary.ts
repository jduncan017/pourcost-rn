/**
 * Central glossary of bar-finance terms used throughout PourCost.
 *
 * Each entry supports synonyms so users who learned the language as
 * "Cost %" / "Liquor Cost" / "COGS" find the same concept under whatever
 * name they know it by.
 *
 * Used by:
 *  - Settings → Glossary screen (grouped sections)
 *  - InfoIcon component (inline "?" tooltips — pass a `termKey`)
 */

export interface GlossaryTerm {
  /** Stable key — used by InfoIcon lookup. */
  key: GlossaryKey;
  /** Primary display name (the app's preferred term). */
  term: string;
  /** Short definition, 1–2 sentences. */
  definition: string;
  /** Alternate names the user may have heard. */
  synonyms?: string[];
  /** Short worked example using realistic bar numbers. */
  example?: string;
}

export interface GlossarySection {
  title: string;
  description?: string;
  keys: GlossaryKey[];
}

export type GlossaryKey =
  | 'pourCost'
  | 'cogs'
  | 'margin'
  | 'markup'
  | 'retailPrice'
  | 'suggestedPrice'
  | 'productSize'
  | 'pourSize'
  | 'costPerOz'
  | 'costPerPour'
  | 'variance';

export const GLOSSARY: Record<GlossaryKey, GlossaryTerm> = {
  pourCost: {
    key: 'pourCost',
    term: 'Pour Cost',
    definition:
      'The cost of a drink expressed as a percentage of what you sell it for. Most bars target 16-22% on spirits; beer and wine usually run higher, 25-30%.',
    synonyms: ['Cost %', 'Liquor Cost', 'Beverage Cost'],
    example: '$2 cost ÷ $10 price = 20% pour cost.',
  },
  cogs: {
    key: 'cogs',
    term: 'COGS',
    definition:
      'Cost of Goods Sold: what it costs to make one drink or dish.',
    synonyms: ['Cost of Goods', 'Beverage COGS'],
    example: '$2 in ingredients to make a cocktail that sells for $10.',
  },
  margin: {
    key: 'margin',
    term: 'Margin',
    definition:
      'What you keep after paying for ingredients. Margin = price minus cost.',
    synonyms: ['Gross Margin', 'Profit Margin'],
    example: '$10 price minus $2 cost = $8 margin.',
  },
  markup: {
    key: 'markup',
    term: 'Markup',
    definition:
      'How much you raise the price over cost, as a multiple or %.',
    example: '$2 cost × 5 = $10 price (400% markup).',
  },
  retailPrice: {
    key: 'retailPrice',
    term: 'Retail Price',
    definition: 'What the customer pays for a pour or cocktail, before tax.',
    synonyms: ['Menu Price', 'Sell Price'],
  },
  suggestedPrice: {
    key: 'suggestedPrice',
    term: 'Suggested Price',
    definition:
      'Price PourCost calculates from your cost and target pour cost %. It tells you what to charge to hit your goal.',
    example: '$2 cost at a 20% target = $10 suggested price.',
  },
  productSize: {
    key: 'productSize',
    term: 'Product Size',
    definition:
      'The container size you buy: a 750ml bottle, a 12oz can, a case of garnish.',
    synonyms: ['Container Size', 'Bottle Size'],
  },
  pourSize: {
    key: 'pourSize',
    term: 'Pour Size',
    definition:
      'How much you pour per drink. Standard spirit pour is 1.5oz; wine is 5-6oz; a dash is roughly 1/32oz.',
    synonyms: ['Serving Size'],
  },
  costPerOz: {
    key: 'costPerOz',
    term: 'Cost / Oz',
    definition:
      'What one ounce of the product costs you (product cost ÷ container ounces). Useful for comparing products across sizes.',
    example: '$25 bottle ÷ 25.4oz = $0.98/oz.',
  },
  costPerPour: {
    key: 'costPerPour',
    term: 'Cost / Pour',
    definition:
      'What it costs to make one pour (cost/oz × pour size). The ingredient cost of a single drink.',
    example: '$0.98/oz × 1.5oz = $1.47 / pour.',
  },
  variance: {
    key: 'variance',
    term: 'Variance',
    definition:
      'The gap between what you should have sold based on inventory and what actually rang up. High variance often points to overpouring, spillage, or theft.',
    synonyms: ['Shrinkage'],
  },
};

/** Glossary screen rendering order, grouped by idea. */
export const GLOSSARY_SECTIONS: GlossarySection[] = [
  {
    title: 'Core Concepts',
    description: 'The main profitability metrics',
    keys: ['pourCost', 'cogs', 'margin', 'markup'],
  },
  {
    title: 'Prices & Sizes',
    description: 'What you sell and how much of it',
    keys: ['retailPrice', 'suggestedPrice', 'productSize', 'pourSize'],
  },
  {
    title: 'Behind the Numbers',
    description: 'Per-unit breakdowns that feed the top-line metrics',
    keys: ['costPerOz', 'costPerPour', 'variance'],
  },
];
