/**
 * Pro Tips — curated bar-management wisdom that doesn't fit in the glossary.
 *
 * Each tip has a short tagline for the index card and a set of structured
 * blocks that render on the detail screen.
 */

export type TipBlock =
  | { kind: 'paragraph'; text: string }
  | { kind: 'list'; items: string[] }
  | {
      kind: 'scenario';
      /** Label shown above the bullets (e.g. "At 28% pour cost"). */
      label: string;
      bullets: string[];
    };

export interface ProTip {
  /** Stable key — used for routing and potential cross-screen links. */
  key: string;
  /** Short, scannable title. */
  title: string;
  /** One-line preview shown on the Pro Tips index card. */
  tagline: string;
  /** Ordered body blocks rendered on the detail screen. */
  blocks: TipBlock[];
  /** Optional quote or punchline rendered as a gold-accent callout. */
  takeaway?: string;
}

export const PRO_TIPS: ProTip[] = [
  {
    key: 'chaseDollarsNotPercent',
    title: 'Chase Dollars, Not Percentages',
    tagline: 'A strict 20% pour cost prices premium drinks off the menu. Margin dollars pay the bills, not percentages.',
    blocks: [
      {
        kind: 'paragraph',
        text: 'Pour cost % is the industry benchmark, but it breaks down on high-cost ingredients. Forcing a 20% target on a premium spirit prices the drink out of reach.',
      },
      {
        kind: 'paragraph',
        text: 'Say you sell a 1.5oz pour of a spirit that costs you $20.',
      },
      {
        kind: 'scenario',
        label: 'At 28% Pour Cost',
        bullets: [
          'Drink retails for $71',
          'You walk with $51 in margin',
          'Compares favorably to a standard cocktail that nets $10–$12',
        ],
      },
      {
        kind: 'scenario',
        label: 'At a Traditional 20% Pour Cost',
        bullets: [
          'Drink retails for $100',
          'You walk with $80 in margin',
          'Fewer guests actually order it',
        ],
      },
      {
        kind: 'paragraph',
        text: 'The 20% version makes more per sale on paper, but only if someone buys it. The 28% version sells more often and still prints money. The goal is balancing margin (money in the bank) with whether guests will actually order the drink.',
      },
    ],
    takeaway: "You can't take percentage to the bank. Only dollars.",
  },

  {
    key: 'portionBeatsPricing',
    title: 'Portion Control Leaks Faster Than Pricing Fixes',
    tagline: 'A 0.25oz overpour on every drink is nearly a full bottle of lost revenue every shift.',
    blocks: [
      {
        kind: 'paragraph',
        text: 'Free-pouring feels fast, but the math behind small overpours gets ugly quickly. Think about it as missed revenue, not missed cost. That framing makes it stick.',
      },
      {
        kind: 'scenario',
        label: 'A Bartender Overpouring by 0.25oz',
        bullets: [
          '100 drinks/shift × 0.25oz = 25oz of liquor poured away',
          "That's nearly an entire 750ml bottle (25.4oz) every shift",
          'On a $20 bottle priced at a 20% pour cost, that bottle represents $100 in retail revenue',
          '$80–$100/shift × 5 shifts/week × 52 weeks ≈ $20,000–$26,000/year in missed sales',
        ],
      },
      {
        kind: 'paragraph',
        text: 'No price tweak recovers that. Spec pours with a jigger, spot-check bottle-to-sales variance weekly, and retrain anyone who defaults to free-pouring.',
      },
    ],
    takeaway: 'Pricing optimizes revenue. Portion control protects it.',
  },

  {
    key: 'garnishIsntFree',
    title: "Garnish Isn't Free. Count It",
    tagline: 'A $0.30 peel on every drink is a five-figure hidden cost over a year.',
    blocks: [
      {
        kind: 'paragraph',
        text: "Bartenders routinely leave garnish out of the recipe because 'it's just a peel.' Do the math.",
      },
      {
        kind: 'scenario',
        label: 'A $0.30 Garnish per Cocktail',
        bullets: [
          '50 cocktails/night × $0.30 = $15/night',
          '$15 × 6 nights/week × 52 weeks = ~$4,700/year',
          "Add citrus, herbs, bitters drops, salt rims, and it's easily $10-20k/year unaccounted",
        ],
      },
      {
        kind: 'paragraph',
        text: "Cost every garnish in PourCost, even if you mark it not-for-sale. When your cost-per-pour is honest, your pour cost % is too.",
      },
    ],
  },

  {
    key: 'happyHourMath',
    title: 'Happy Hour: Know the Math Before You Commit',
    tagline: 'A small discount can drive big volume, or quietly erase margin. Check both before running the deal.',
    blocks: [
      {
        kind: 'paragraph',
        text: "Happy hour is a real lever. It pulls new guests in, builds neighborhood regulars, drives food tickets, and fills otherwise-dead hours. But the math shifts fast when you discount, and it's worth seeing the breakeven side-by-side with the upside.",
      },
      {
        kind: 'scenario',
        label: 'Cocktail Normally $12 / $3 Cost / $9 Margin',
        bullets: [
          'Drop to $10: need 29% more volume to keep profit flat',
          'Drop to $8: need 50% more volume',
          'Drop to $6: need 100% more volume',
        ],
      },
      {
        kind: 'scenario',
        label: 'When Happy Hour Wins',
        bullets: [
          'Brings in guests who wouldn\'t have come (new demand, not shifted demand)',
          'Drives food tickets (food typically carries higher margin than liquor)',
          'Turns into a second or third round at full price',
          'Fills slow hours so labor is already paid for',
        ],
      },
      {
        kind: 'paragraph',
        text: "The failure mode is discounting for regulars who would have paid full price anyway. That's pure margin given away. Track incremental guests and food-to-drink ratio during the promo. If both go up, you're winning.",
      },
    ],
    takeaway: 'Discounts are deals when they drive incremental volume, not when they just shift who pays less.',
  },

  {
    key: 'categoryMix',
    title: 'Benchmark Against Your Bar Type, Not the Industry',
    tagline: "Spirit bars, wine bars, and beer halls should all target different pour costs. Don't apply one number to everything.",
    blocks: [
      {
        kind: 'paragraph',
        text: "The 'good pour cost' number depends on what you sell. Blended COGS across a program with very different category margins is a lagging indicator at best, and misleading at worst.",
      },
      {
        kind: 'scenario',
        label: 'Realistic Targets by Bar Type',
        bullets: [
          'Spirit-forward cocktail program: 16-22% pour cost',
          'Beer & wine focused program: 25-30% pour cost',
          'Mixed program: look at each category separately, not just the blended number',
        ],
      },
      {
        kind: 'paragraph',
        text: "If your bar runs 28% blended pour cost and a spirit-heavy competitor runs 20%, you might actually be ahead on spirits alone. Your 28% pour cost could just reflect a big beer/wine mix doing exactly what it should. Dig into categories before deciding you have a problem.",
      },
    ],
    takeaway: 'One target fits all is the fastest way to misread your own business.',
  },

  {
    key: 'compsCostMore',
    title: 'Comps Cost More Than You Think',
    tagline: 'One comped cocktail erases the margin from several full-price sales. Track them like a budget.',
    blocks: [
      {
        kind: 'paragraph',
        text: "Comping a drink feels small in the moment. It's one cocktail. The math of replacing it is what makes most managers flinch.",
      },
      {
        kind: 'scenario',
        label: 'A Single Comped $30 Cocktail',
        bullets: [
          'You still paid ~$9 for the ingredients',
          'You lose the $21 margin you would have earned',
          'Replacing the profit takes 3–4 more full-price sales',
          '2 comps/night × 5 nights × 52 weeks ≈ $15,000/year in margin given away',
        ],
      },
      {
        kind: 'paragraph',
        text: "Comps can absolutely pay for themselves: fixing a bad experience, surprising a regular who brings new guests, building goodwill for reviews. The failure mode is untracked comps: staff drinks that never get logged, 'a round on me' with no owner oversight, friends who've stopped being guests.",
      },
      {
        kind: 'paragraph',
        text: "Track comps in their own line, separate from variance and spill. Set a weekly budget (say, 2% of beverage sales) and review who's using it and why.",
      },
    ],
    takeaway: 'Comps are marketing. Give them a budget, not a free pass.',
  },

  {
    key: 'preDiluteBatches',
    title: 'Pre-Diluting Batched Cocktails',
    tagline: 'Serving up? Add water. Serving over ice? Leave it alone. The rule that saves prep from tasting watery or harsh.',
    blocks: [
      {
        kind: 'paragraph',
        text: "Dave Arnold's research in Liquid Intelligence measured what actually happens to a cocktail between the shaker and the glass. Turns out the ice is doing real work: adding water, lowering temperature, and changing the drink's body.",
      },
      {
        kind: 'scenario',
        label: 'How much water ice adds',
        bullets: [
          'Stirred cocktails: ~15-20% water added',
          'Shaken cocktails: ~20-25% water added',
          "Most batching rule of thumb: 20% dilution for a stirred spec served up",
        ],
      },
      {
        kind: 'paragraph',
        text: "Pre-batching skips the ice step, so if you're serving the batch up or straight from a chilled bottle, you need to replicate that water yourself. If you don't, the drink tastes harsh, hot, and unbalanced.",
      },
      {
        kind: 'scenario',
        label: 'When to pre-dilute',
        bullets: [
          'Serving up or chilled without ice — YES, pre-dilute (~20%)',
          'Serving over ice or on the rocks — NO, the ice at service will dilute it',
          "Serving 'up' from a kegged tap cocktail — YES, pre-dilute before carbonating",
        ],
      },
      {
        kind: 'paragraph',
        text: "Keep batches refrigerator-cold during service. Warm batches dilute faster once poured, which breaks the balance you calibrated.",
      },
    ],
    takeaway: "Ice is an ingredient. If you skip it, replace it.",
  },

  {
    key: 'menuPlacement',
    title: 'Menu Placement and Anchoring',
    tagline: "Where a cocktail sits on the menu, and what sits next to it, changes how often it sells.",
    blocks: [
      {
        kind: 'paragraph',
        text: "Guests don't read menus left-to-right top-to-bottom like a book. They scan, anchor on the first or most-expensive item they see, and decide from there. You can design for that.",
      },
      {
        kind: 'scenario',
        label: 'Anchoring With a Premium Option',
        bullets: [
          "List a $22 top-shelf cocktail next to your $14 signature, and the $14 suddenly feels like a deal",
          "Without the $22, the $14 looks 'expensive'; with it, it looks 'reasonable'",
          "You don't have to sell many of the anchor; its job is to make the rest of the menu look smart",
        ],
      },
      {
        kind: 'scenario',
        label: 'Placement Moves Volume',
        bullets: [
          "Top-right of a printed menu and top of a list are the highest-attention spots",
          "Put your highest-margin cocktail there, not your newest, not your favorite",
          "The cocktail that prints the most money per sale should be the one guests see first",
        ],
      },
      {
        kind: 'paragraph',
        text: "These aren't tricks. They're acknowledging how people actually read. A menu is a sales tool; design it like one.",
      },
    ],
    takeaway: "What's on top of the page sells more than what's buried in the middle.",
  },
];
