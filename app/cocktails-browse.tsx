import { useMemo } from 'react';
import { useGuardedRouter } from '@/src/lib/guarded-router';
import CocktailPicker from '@/src/components/onboarding/CocktailPicker';
import { useIngredientsStore } from '@/src/stores/ingredients-store';
import { useCocktailsStore } from '@/src/stores/cocktails-store';
import { analyzeRecipe, collectMissing } from '@/src/lib/library-recipes';
import { useOnboardingCocktailsStore } from '@/src/stores/onboarding-cocktails-store';

/**
 * Post-onboarding library browse. Same picker as onboarding, but routes
 * through the parallel /cocktails-browse-prices + /cocktails-browse-adopting
 * screens (which route back to /cocktails on completion instead of into the
 * onboarding-complete chain). Reuses the onboarding cocktails store so we
 * don't duplicate state plumbing — the store gets reset on adoption finish.
 */
export default function CocktailsBrowse() {
  const router = useGuardedRouter();
  const setOnboardingCocktails = useOnboardingCocktailsStore((s) => s.set);
  const cocktails = useCocktailsStore((s) => s.cocktails);

  // Hide library recipes the user already has (case-insensitive name match)
  // so they can't double-adopt and create duplicates.
  const excludeNames = useMemo(
    () => new Set(cocktails.map((c) => c.name.trim().toLowerCase())),
    [cocktails],
  );

  return (
    <CocktailPicker
      showBack={false}
      excludeNames={excludeNames}
      onContinue={(recipes) => {
        if (recipes.length === 0) {
          router.back();
          return;
        }
        const inventory = useIngredientsStore.getState().ingredients;
        const analyses = recipes.map((r) => analyzeRecipe(r, inventory));
        const missing = collectMissing(analyses);
        setOnboardingCocktails({ selectedRecipes: recipes, analyses, missing });
        if (missing.length === 0) {
          // No new ingredients required — skip the pricing step entirely.
          router.replace('/cocktails-browse-adopting' as any);
        } else {
          router.push('/cocktails-browse-prices' as any);
        }
      }}
    />
  );
}
