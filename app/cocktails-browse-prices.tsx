import { useGuardedRouter } from '@/src/lib/guarded-router';
import MissingIngredientsForm from '@/src/components/onboarding/MissingIngredientsForm';
import { useOnboardingCocktailsStore } from '@/src/stores/onboarding-cocktails-store';

export default function CocktailsBrowsePrices() {
  const router = useGuardedRouter();
  const { selectedRecipes, analyses, missing, setPricedMissing } = useOnboardingCocktailsStore();

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
        setPricedMissing(priced);
        router.replace('/cocktails-browse-adopting' as any);
      }}
    />
  );
}
