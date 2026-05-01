import { View, ScrollView } from 'react-native';
import { useGuardedRouter } from '@/src/lib/guarded-router';
import GradientBackground from '@/src/components/ui/GradientBackground';
import SettingsCard from '@/src/components/ui/SettingsCard';

/**
 * Learn drawer screen — surfaces the costing primer, pro tips, and reference
 * material that previously lived inside Settings → Learn. Promoted to its own
 * drawer entry so first-time users can find it without going through Settings.
 */
export default function LearnScreen() {
  const router = useGuardedRouter();

  return (
    <GradientBackground>
      <ScrollView className="flex-1">
        <View className="px-6 pt-4 pb-6 flex-col gap-3">
          <SettingsCard
            title="Glossary"
            description="Bar finance terms: Pour Cost, COGS, Margin, etc."
            iconName="book-outline"
            onPress={() => router.push('/settings-glossary' as any)}
            showCaret
          />
          <SettingsCard
            title="Pro Tips"
            description="Pricing, pouring, and running the bar"
            iconName="bulb-outline"
            onPress={() => router.push('/settings-pro-tips' as any)}
            showCaret
          />
          <SettingsCard
            title="Conversions"
            description="Bottle sizes, pours, metric ↔ oz, keg yields"
            iconName="swap-horizontal-outline"
            onPress={() => router.push('/settings-conversions' as any)}
            showCaret
          />
        </View>
      </ScrollView>
    </GradientBackground>
  );
}
