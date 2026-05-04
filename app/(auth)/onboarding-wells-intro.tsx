import { useGuardedRouter } from '@/src/lib/guarded-router';
import OnboardingIntro from '@/src/components/onboarding/OnboardingIntro';
import { palette } from '@/src/contexts/ThemeContext';
import { capture } from '@/src/services/analytics-service';

export default function OnboardingWellsIntro() {
  const router = useGuardedRouter();
  return (
    <OnboardingIntro
      step="Step 3 of 5"
      iconName="beer-outline"
      iconColor={palette.Y4}
      title="Set Up Your Wells"
      body="Wells are the house pours your bar uses by default. The well vodka, the well whiskey, and so on. We'll use these for cocktails when no specific brand is called for."
      bullets={[
        'Pick brands you actually pour',
        'Enter the cost so we can price your cocktails',
        'You can skip and come back from Settings → Manage Wells anytime',
      ]}
      primaryLabel="Set Up Wells"
      onPrimary={() => {
        capture('wells_intro_continue');
        router.push('/(auth)/onboarding-wells' as any);
      }}
      onSkip={() => {
        capture('wells_intro_skip');
        router.replace('/(auth)/onboarding-cocktails-intro' as any);
      }}
    />
  );
}
