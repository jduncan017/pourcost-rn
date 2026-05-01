import { useGuardedRouter } from '@/src/lib/guarded-router';
import WellsPicker from '@/src/components/onboarding/WellsPicker';

export default function OnboardingWells() {
  const router = useGuardedRouter();
  return (
    <WellsPicker
      onFinish={() => router.replace('/(auth)/onboarding-wells-success' as any)}
    />
  );
}
