import { useGuardedRouter } from '@/src/lib/guarded-router';
import CocktailPicker from '@/src/components/onboarding/CocktailPicker';
import { useIngredientsStore } from '@/src/stores/ingredients-store';
import { analyzeRecipe, collectMissing } from '@/src/lib/library-recipes';
import { useOnboardingCocktailsStore } from '@/src/stores/onboarding-cocktails-store';

export default function OnboardingCocktails() {
  const router = useGuardedRouter();
  const setOnboardingCocktails = useOnboardingCocktailsStore((s) => s.set);

  return (
    <CocktailPicker
      onContinue={(recipes) => {
        // 0 picks = skip; jump straight to onboarding-complete (no missing
        // ingredients to price, no cocktails to adopt).
        if (recipes.length === 0) {
          router.replace('/(auth)/onboarding-complete' as any);
          return;
        }
        // Analyze against the user's current inventory (wells just added).
        const inventory = useIngredientsStore.getState().ingredients;
        const analyses = recipes.map((r) => analyzeRecipe(r, inventory));
        const missing = collectMissing(analyses);
        setOnboardingCocktails({ selectedRecipes: recipes, analyses, missing });
        router.push('/(auth)/onboarding-cocktails-prices' as any);
      }}
    />
  );
}
