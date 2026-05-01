import { useGuardedRouter } from '@/src/lib/guarded-router';
import OnboardingIntro from '@/src/components/onboarding/OnboardingIntro';
import { palette } from '@/src/contexts/ThemeContext';
import { capture } from '@/src/services/analytics-service';

export default function OnboardingCocktailsIntro() {
  const router = useGuardedRouter();
  return (
    <OnboardingIntro
      step="Step 4 of 5"
      iconName="wine-outline"
      iconColor={palette.B5}
      title="Add Some Cocktails"
      body="Pick from 30 classic recipes. We'll wire each one up to your wells and only ask you to set prices for ingredients you don't already have."
      bullets={[
        'Spirit slots auto-match to your wells',
        'Pantry staples (lime juice, simple syrup, bitters) auto-add',
        "You'll set prices once for missing ingredients shared across recipes",
      ]}
      primaryLabel="Pick Cocktails"
      onPrimary={() => {
        capture('cocktails_intro_continue');
        router.push('/(auth)/onboarding-cocktails' as any);
      }}
      onSkip={() => {
        capture('cocktails_intro_skip');
        router.replace('/(auth)/onboarding-complete' as any);
      }}
    />
  );
}
