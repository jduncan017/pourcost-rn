import { useLayoutEffect } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { useNavigation } from 'expo-router';
import { useGuardedRouter } from '@/src/lib/guarded-router';
import { Ionicons } from '@expo/vector-icons';
import GradientBackground from '@/src/components/ui/GradientBackground';
import Card from '@/src/components/ui/Card';
import ScreenTitle from '@/src/components/ui/ScreenTitle';
import { useThemeColors } from '@/src/contexts/ThemeContext';
import { PRO_TIPS, ProTip } from '@/src/constants/pro-tips';
import { HapticService } from '@/src/services/haptic-service';

function TipIndexCard({
  tip,
  colors,
  onPress,
}: {
  tip: ProTip;
  colors: any;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress}>
      <Card padding="medium">
        <View className="flex-row items-center gap-3">
          <View className="flex-1 flex-col gap-1.5">
            <Text
              className="text-base"
              style={{ color: colors.text, fontWeight: '700' }}
            >
              {tip.title}
            </Text>
            <Text
              className="text-sm leading-5"
              style={{ color: colors.textSecondary }}
              numberOfLines={3}
            >
              {tip.tagline}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
        </View>
      </Card>
    </Pressable>
  );
}

export default function SettingsProTipsScreen() {
  const navigation = useNavigation();
  const router = useGuardedRouter();
  const colors = useThemeColors();

  useLayoutEffect(() => {
    navigation.setOptions({ title: 'Pro Tips' });
  }, [navigation]);

  return (
    <GradientBackground>
      <ScrollView className="flex-1">
        <View className="px-6 pt-4 pb-16 flex-col gap-5">
          <View className="flex-col gap-1.5">
            <ScreenTitle title="Working Smarter" variant="muted" />
            <Text
              className="text-sm leading-5"
              style={{ color: colors.textSecondary }}
            >
              Practical advice for pricing, pouring, and running the bar.
              The kind of thing you usually only learn by watching a good GM.
            </Text>
          </View>

          <View className="flex-col gap-3">
            {PRO_TIPS.map((tip) => (
              <TipIndexCard
                key={tip.key}
                tip={tip}
                colors={colors}
                onPress={() => {
                  HapticService.navigation();
                  router.push({
                    pathname: '/settings-pro-tip',
                    params: { key: tip.key },
                  } as any);
                }}
              />
            ))}
          </View>
        </View>
      </ScrollView>
    </GradientBackground>
  );
}
