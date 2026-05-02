import { useShallow } from 'zustand/react/shallow';
import { useAuth } from '@/src/contexts/AuthContext';
import { useAppStore } from '@/src/stores/app-store';
import {
  getHeroTargetForIngredient,
  getHeroTargetForCocktail,
  HeroTargetInfo,
  IngredientLikeForTarget,
  PricingMode,
} from './pour-cost-tiers';

/** Single source for the gate. Pre-launch: admin-only. Post-launch this
 *  flips to `isAdmin || hasPaidEntitlement` once the paid tier ships. */
function usePricingMode(): PricingMode {
  const { isAdmin } = useAuth();
  return isAdmin ? 'pro' : 'free';
}

/** Resolve PourCostHero `targetGoal` + `targetLabel` for an ingredient,
 *  pulling the bar's goals + auth state automatically. */
export function useHeroTargetForIngredient(
  ingredient: IngredientLikeForTarget,
): HeroTargetInfo {
  const mode = usePricingMode();
  const goals = useAppStore(
    useShallow((s) => ({
      pourCostGoal: s.pourCostGoal,
      beerPourCostGoal: s.beerPourCostGoal,
      winePourCostGoal: s.winePourCostGoal,
      pourCostTiers: s.pourCostTiers,
      proModeEnabled: s.proModeEnabled,
    })),
  );
  return getHeroTargetForIngredient(ingredient, goals, mode);
}

/** Resolve PourCostHero `targetGoal` + `targetLabel` for a cocktail. */
export function useHeroTargetForCocktail(): HeroTargetInfo {
  const mode = usePricingMode();
  const pourCostGoal = useAppStore((s) => s.pourCostGoal);
  return getHeroTargetForCocktail({ pourCostGoal }, mode);
}
