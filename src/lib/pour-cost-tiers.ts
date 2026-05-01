/**
 * Pour cost tiers — bottle-cost brackets with target pour cost percentages.
 *
 * Bar-wide pour cost goals (typically 16-18%) work for the middle of the
 * inventory but break at the extremes:
 *
 *   - Wells ($12 well vodka sold at $7) sit at ~6-9% pour cost. Looks "way
 *     under target" against an 18% goal but it's correct — wells are pure
 *     margin engines.
 *   - Premium spirits ($300 Pappy at 18% pour cost = $20 pour) is wildly
 *     unrealistic. Real bars charge $80-150/pour, which lands the bottle
 *     at 30-50% pour cost.
 *
 * Tiered targets fix this. The default ladder below was sanity-checked
 * against Denver bar program norms (per Joshua, 2026-04-30):
 *   - 10% on wells
 *   - 18% on $20-40 bottles (call brands)
 *   - tiered up from there
 *
 * Bottle cost = `ingredients.product_cost` (the user's purchase price for
 * one container, however they buy it). 1L vs 750ml vs 1.75L is NOT
 * normalized — bars buying handles see slightly higher bottle costs that
 * push tier boundaries; advanced users adjust their tiers in Pro Mode.
 *
 * Cocktails do NOT use tiers — they use the bar-wide pourCostGoal. Cocktail
 * recipes are adjustable so a single bar-wide target stays meaningful.
 */

export interface PourCostTier {
  /** Inclusive lower bound on bottle cost in USD. */
  minBottleCost: number;
  /** Exclusive upper bound. null = unbounded (top tier). */
  maxBottleCost: number | null;
  /** Target pour cost as a percentage (e.g. 18 means 18%). */
  targetPourCostPct: number;
  /** Optional human-readable label for the editor UI. */
  label?: string;
}

export const DEFAULT_TIERS: PourCostTier[] = [
  { minBottleCost: 0, maxBottleCost: 25, targetPourCostPct: 10, label: 'Wells' },
  { minBottleCost: 25, maxBottleCost: 45, targetPourCostPct: 18, label: 'Call' },
  { minBottleCost: 45, maxBottleCost: 80, targetPourCostPct: 22, label: 'Premium' },
  { minBottleCost: 80, maxBottleCost: 150, targetPourCostPct: 25, label: 'Top Shelf' },
  { minBottleCost: 150, maxBottleCost: null, targetPourCostPct: 30, label: 'Allocated' },
];

/**
 * Resolve the target pour cost % for an ingredient based on its bottle cost.
 * Falls back to the bar-wide pourCostGoal when no tier matches (defensive —
 * shouldn't happen with the default ladder since the top tier is unbounded).
 */
export function targetForBottleCost(
  bottleCost: number,
  tiers: PourCostTier[],
  fallbackPct: number,
): number {
  if (bottleCost < 0) return fallbackPct;
  for (const t of tiers) {
    const aboveMin = bottleCost >= t.minBottleCost;
    const belowMax = t.maxBottleCost == null || bottleCost < t.maxBottleCost;
    if (aboveMin && belowMax) return t.targetPourCostPct;
  }
  return fallbackPct;
}

/**
 * Resolve the active tier brackets — Pro Mode user's custom tiers when
 * enabled, otherwise the default ladder.
 */
export function getActiveTiers(
  proModeEnabled: boolean,
  customTiers: PourCostTier[],
): PourCostTier[] {
  if (proModeEnabled && customTiers.length > 0) return customTiers;
  return DEFAULT_TIERS;
}

/**
 * Resolve the pour cost target for any ingredient, accounting for type.
 * Beer and wine use their own bar-wide goals (since they're priced as a
 * category, not by bottle cost). Spirits run through the tier ladder.
 * Everything else (juices, syrups, prepped) falls back to the bar-wide goal.
 */
export interface IngredientLikeForTarget {
  type?: string;
  productCost: number;
}

export interface PourCostGoals {
  pourCostGoal: number;
  beerPourCostGoal: number;
  winePourCostGoal: number;
  pourCostTiers: PourCostTier[];
  proModeEnabled: boolean;
}

export function getTargetForIngredient(
  ingredient: IngredientLikeForTarget,
  goals: PourCostGoals,
): number {
  const type = ingredient.type ?? '';
  if (type === 'Beer') return goals.beerPourCostGoal;
  if (type === 'Wine') return goals.winePourCostGoal;
  if (type === 'Spirit') {
    const tiers = getActiveTiers(goals.proModeEnabled, goals.pourCostTiers);
    return targetForBottleCost(ingredient.productCost, tiers, goals.pourCostGoal);
  }
  return goals.pourCostGoal;
}

/**
 * Validate a custom tier set. Returns an error message when invalid, null
 * when good. Used by the Pro Mode editor before save.
 *
 * Rules:
 *   - At least one tier
 *   - Tiers ordered ascending by minBottleCost
 *   - No gaps and no overlaps between adjacent tiers
 *   - First tier starts at 0
 *   - Top tier has null maxBottleCost (unbounded)
 *   - Each targetPourCostPct between 1 and 100
 */
export function validateTiers(tiers: PourCostTier[]): string | null {
  if (tiers.length === 0) return 'Add at least one tier.';
  if (tiers[0].minBottleCost !== 0) return 'First tier must start at $0.';
  if (tiers[tiers.length - 1].maxBottleCost !== null) {
    return 'Top tier must be unbounded (no max).';
  }
  for (let i = 0; i < tiers.length; i++) {
    const t = tiers[i];
    if (t.targetPourCostPct < 1 || t.targetPourCostPct > 100) {
      return `Tier ${i + 1}: target % must be between 1 and 100.`;
    }
    if (i > 0) {
      const prev = tiers[i - 1];
      if (prev.maxBottleCost == null) {
        return `Tier ${i}: cannot have a tier above an unbounded one.`;
      }
      if (t.minBottleCost !== prev.maxBottleCost) {
        return `Tier ${i + 1}: must start where tier ${i} ended ($${prev.maxBottleCost}).`;
      }
    }
    if (t.maxBottleCost != null && t.maxBottleCost <= t.minBottleCost) {
      return `Tier ${i + 1}: max must be greater than min.`;
    }
  }
  return null;
}
