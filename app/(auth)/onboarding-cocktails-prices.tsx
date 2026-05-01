import { useGuardedRouter } from '@/src/lib/guarded-router';
import MissingIngredientsForm from '@/src/components/onboarding/MissingIngredientsForm';
import { useOnboardingCocktailsStore } from '@/src/stores/onboarding-cocktails-store';

export default function OnboardingCocktailsPrices() {
  const router = useGuardedRouter();
  const { selectedRecipes, analyses, missing, setPricedMissing } = useOnboardingCocktailsStore();

  // Total staples being auto-added (deduped). Used in the footer copy.
  const stapleKeys = new Set<string>();
  for (const a of analyses) {
    for (const r of a.resolutions) {
      if (r.kind !== 'staple') continue;
      const key =
        r.ingredient.canonicalProductId ??
        (r.displayName ? `name:${r.displayName.toLowerCase()}` : `unknown:${r.ingredient.id}`);
      stapleKeys.add(key);
    }
  }

  return (
    <MissingIngredientsForm
      missing={missing}
      cocktailCount={selectedRecipes.length}
      stapleCount={stapleKeys.size}
      onBack={() => router.back()}
      onContinue={(priced) => {
        // Hand priced data to the loader screen via the store, then route.
        // The actual write happens in onboarding-adopting.tsx so the user
        // sees a phase-cycling loader instead of a frozen Continue button +
        // toast flood.
        setPricedMissing(priced);
        router.replace('/(auth)/onboarding-adopting' as any);
      }}
    />
  );
}
