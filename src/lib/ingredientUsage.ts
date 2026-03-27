/**
 * Derives ingredient usage frequency from cocktail data.
 * No DB queries — computed from the in-memory cocktails store.
 */

import { Cocktail } from '@/src/types/models';

/**
 * Count how many cocktails each ingredient appears in.
 * Returns a Map of ingredientId → cocktail count.
 */
export function getIngredientUsageCounts(cocktails: Cocktail[]): Map<string, number> {
  const counts = new Map<string, number>();

  for (const cocktail of cocktails) {
    // Use a Set per cocktail so an ingredient appearing twice in one cocktail counts as 1
    const seen = new Set<string>();
    for (const ci of cocktail.ingredients) {
      if (!seen.has(ci.ingredientId)) {
        seen.add(ci.ingredientId);
        counts.set(ci.ingredientId, (counts.get(ci.ingredientId) ?? 0) + 1);
      }
    }
  }

  return counts;
}

/**
 * Sort ingredients by usage count (descending), then alphabetically.
 * Ingredients not in the counts map are treated as 0 uses.
 */
export function sortByUsage<T extends { id: string; name: string }>(
  items: T[],
  counts: Map<string, number>,
): T[] {
  return [...items].sort((a, b) => {
    const countDiff = (counts.get(b.id) ?? 0) - (counts.get(a.id) ?? 0);
    if (countDiff !== 0) return countDiff;
    return a.name.localeCompare(b.name);
  });
}
