/**
 * Category-level wholesale cost priors.
 *
 * Used by the missing-ingredients pricing screen during onboarding to baseline
 * each row with a "typical wholesale" estimate. Users can keep the suggestion
 * (fast path) or type over it. Numbers are USD ballparks for a call-tier
 * bottle of the relevant subcategory at the indicated reference size — bars
 * with premium programs adjust on first invoice.
 *
 * Match priority:
 *   1. (canonicalCategory, canonicalSubcategory) exact match
 *   2. (canonicalCategory, '*') category-only fallback
 *   3. null — let the caller decide whether to leave the field empty
 *
 * Cost scales linearly with the volume the user selected vs the reference
 * size for the matched prior. A 1L pick on a 750ml prior multiplies cost by
 * 1.33; a 1.75L handle by ~2.33; etc. This is good enough for onboarding —
 * full nonlinear bottle-cost curves (where handles get a discount) are out
 * of scope.
 */
import { Volume, volumeToOunces } from '@/src/types/models';

interface CostPrior {
  /** Reference bottle size in ml the cost is anchored on. */
  referenceMl: number;
  /** Typical wholesale cost in USD at the reference size. */
  cost: number;
}

const ML_PER_OZ = 29.5735;

function volumeToMl(v: Volume): number {
  if (v.kind === 'milliliters') return v.ml;
  return volumeToOunces(v) * ML_PER_OZ;
}

/** Lookup table keyed by `${category}|${subcategory}` (lowercased). Use the
 *  literal string '*' for a category-only catch-all. */
const PRIORS: Record<string, CostPrior> = {
  // ========== Spirits ==========
  'spirit|whiskey': { referenceMl: 750, cost: 22 },
  'spirit|bourbon': { referenceMl: 750, cost: 22 },
  'spirit|rye': { referenceMl: 750, cost: 24 },
  'spirit|scotch': { referenceMl: 750, cost: 30 },
  'spirit|irish': { referenceMl: 750, cost: 25 },
  'spirit|japanese': { referenceMl: 750, cost: 45 },
  'spirit|vodka': { referenceMl: 750, cost: 18 },
  'spirit|gin': { referenceMl: 750, cost: 22 },
  'spirit|rum': { referenceMl: 750, cost: 20 },
  'spirit|tequila': { referenceMl: 750, cost: 28 },
  'spirit|mezcal': { referenceMl: 750, cost: 35 },
  'spirit|brandy': { referenceMl: 750, cost: 28 },
  'spirit|cognac': { referenceMl: 750, cost: 45 },
  'spirit|*': { referenceMl: 750, cost: 22 },

  // ========== Liqueurs / Vermouth / Bitters / Absinthe ==========
  // The canonical catalog treats these as their own categories (see
  // mapCanonicalToType). The form bucket is 'Spirit' but the prior keys off
  // the canonical category so we get the right anchor.
  'liqueur|*': { referenceMl: 750, cost: 25 },
  'vermouth|*': { referenceMl: 750, cost: 12 },
  'bitters|*': { referenceMl: 120, cost: 10 },
  'absinthe|*': { referenceMl: 750, cost: 45 },

  // ========== Wine ==========
  'wine|red': { referenceMl: 750, cost: 12 },
  'wine|white': { referenceMl: 750, cost: 11 },
  'wine|sparkling': { referenceMl: 750, cost: 16 },
  'wine|fortified': { referenceMl: 750, cost: 15 },
  'wine|*': { referenceMl: 750, cost: 12 },

  // ========== Beer ==========
  'beer|*': { referenceMl: 355, cost: 2 },

  // ========== Non-Alc ==========
  // Juices/syrups/mixers usually carry separate staple defaults; these are
  // the catch-alls when the canonical isn't a known staple.
  'juice|*': { referenceMl: 946, cost: 6 },
  'syrup|*': { referenceMl: 946, cost: 5 },
  'mixer|*': { referenceMl: 1000, cost: 3 },
};

/**
 * Resolve a wholesale cost estimate for a (category, subcategory) pair at
 * the user's selected size. Returns null when no prior matches — callers
 * should treat that as "no suggestion available" and leave the field empty.
 */
export function getCategoryCostPrior(
  category: string | null | undefined,
  subcategory: string | null | undefined,
  selectedSize: Volume,
): number | null {
  if (!category) return null;
  const cat = category.toLowerCase();
  const sub = (subcategory ?? '').toLowerCase();

  const prior =
    PRIORS[`${cat}|${sub}`] ??
    PRIORS[`${cat}|*`] ??
    null;
  if (!prior) return null;

  const selectedMl = volumeToMl(selectedSize);
  if (selectedMl <= 0) return prior.cost;

  const scaled = (prior.cost * selectedMl) / prior.referenceMl;
  return Math.round(scaled * 100) / 100;
}
