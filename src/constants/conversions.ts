/**
 * Common bar/kitchen conversions bartenders and managers look up in a pinch.
 * Grouped by category, ordered largest → smallest within each group.
 *
 * Values are rounded to the precision people actually use behind a bar —
 * e.g. 750ml shows as 25.4oz, not 25.3605oz.
 */

export interface ConversionEntry {
  /** Left-side label (what you have). */
  from: string;
  /** Right-side label (what it equals). */
  to: string;
  /** Optional short note. */
  note?: string;
}

export interface ConversionGroup {
  title: string;
  description?: string;
  entries: ConversionEntry[];
}

export const CONVERSION_GROUPS: ConversionGroup[] = [
  {
    title: 'Bottle Sizes',
    description: 'Spirits and wine',
    entries: [
      { from: '1.75 L', to: '59.2 oz', note: 'Handle' },
      { from: '1 L', to: '33.8 oz' },
      { from: '750 ml', to: '25.4 oz', note: 'Standard bottle' },
      { from: '500 ml', to: '16.9 oz' },
      { from: '375 ml', to: '12.7 oz', note: 'Half bottle' },
    ],
  },
  {
    title: 'Bar Pours',
    description: 'Common pour sizes and bar measures',
    entries: [
      { from: 'Beer pint (US)', to: '16 oz' },
      { from: 'Wine pour', to: '5–6 oz', note: 'Varies by program' },
      { from: 'Shot / jigger', to: '1.5 oz', note: '45 ml (standard)' },
      { from: 'Pony', to: '1 oz', note: '30 ml' },
      { from: 'Splash', to: '~1/4 oz' },
      { from: 'Bar spoon', to: '~1/6 oz', note: 'Roughly 5 ml' },
      { from: 'Dash', to: '~1/32 oz', note: 'Roughly 0.9 ml' },
    ],
  },
  {
    title: 'Kitchen / Prep',
    description: 'Syrup, juice, and prep conversions',
    entries: [
      { from: '1 gallon', to: '4 quarts', note: '128 oz / ~3.8 L' },
      { from: '1 quart', to: '4 cups', note: '32 oz / ~946 ml' },
      { from: '1 pint', to: '2 cups', note: '16 oz / ~473 ml' },
      { from: '1 cup', to: '8 oz', note: '~237 ml' },
      { from: '1 tbsp', to: '1/2 oz', note: '~15 ml' },
      { from: '1 tsp', to: '1/3 tbsp', note: '~5 ml' },
    ],
  },
  {
    title: 'Draft / Kegs',
    description: 'Pints per keg (before foam loss)',
    entries: [
      { from: 'Half barrel (1/2 bbl)', to: '124 pints', note: '15.5 gal / 1,984 oz' },
      { from: 'Pony keg (1/4 bbl)', to: '62 pints', note: '7.75 gal / 992 oz' },
      { from: 'Sixtel (1/6 bbl)', to: '41 pints', note: '5.17 gal / 662 oz' },
      { from: 'Tallboy', to: '16 oz' },
      { from: 'Can (standard)', to: '12 oz' },
    ],
  },
];
