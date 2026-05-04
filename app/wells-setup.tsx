import { useEffect } from 'react';
import { useNavigation } from 'expo-router';
import { useGuardedRouter } from '@/src/lib/guarded-router';
import WellsPicker from '@/src/components/onboarding/WellsPicker';

/**
 * Settings → Manage Wells entry point. Pre-populates with the user's existing
 * wells (is_well=true ingredients), supports inventory picks, and writes
 * changes via diff (untag old, insert/tag new) on Save.
 */
export default function WellsSetup() {
  const router = useGuardedRouter();
  const navigation = useNavigation();

  useEffect(() => {
    navigation.setOptions({ title: 'Manage Wells' });
  }, [navigation]);

  return (
    <WellsPicker
      onFinish={() => router.back()}
      skippable={false}
      showBack={false}
      mode="settings"
      title="Manage Wells"
      subtitle="Update your house pours. Pick from your inventory, the Spirit Database, or add a custom brand."
    />
  );
}
