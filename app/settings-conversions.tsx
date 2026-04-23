import { useLayoutEffect } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { useNavigation } from 'expo-router';
import GradientBackground from '@/src/components/ui/GradientBackground';
import Card from '@/src/components/ui/Card';
import ScreenTitle from '@/src/components/ui/ScreenTitle';
import { useThemeColors } from '@/src/contexts/ThemeContext';
import {
  CONVERSION_GROUPS,
  ConversionEntry,
  ConversionGroup,
} from '@/src/constants/conversions';

function ConversionRow({
  entry,
  colors,
  isLast,
}: {
  entry: ConversionEntry;
  colors: any;
  isLast: boolean;
}) {
  return (
    <View
      className="flex-row items-start py-2.5"
      style={
        isLast
          ? undefined
          : { borderBottomWidth: 1, borderBottomColor: colors.borderSubtle }
      }
    >
      <View className="flex-1 pr-3">
        <Text
          className="text-base"
          style={{ color: colors.text, fontWeight: '500' }}
        >
          {entry.from}
        </Text>
        {entry.note && (
          <Text
            className="text-xs mt-0.5"
            style={{ color: colors.textTertiary }}
          >
            {entry.note}
          </Text>
        )}
      </View>
      <Text
        className="text-base"
        style={{ color: colors.gold, fontWeight: '500' }}
      >
        {entry.to}
      </Text>
    </View>
  );
}

function GroupCard({ group, colors }: { group: ConversionGroup; colors: any }) {
  return (
    <Card padding="medium">
      <View className="flex-col">
        <Text
          className="text-base mb-1"
          style={{ color: colors.text, fontWeight: '700' }}
        >
          {group.title}
        </Text>
        {group.description && (
          <Text
            className="text-xs mb-2"
            style={{ color: colors.textTertiary }}
          >
            {group.description}
          </Text>
        )}

        <View className="flex-col">
          {group.entries.map((entry, i) => (
            <ConversionRow
              key={`${entry.from}-${i}`}
              entry={entry}
              colors={colors}
              isLast={i === group.entries.length - 1}
            />
          ))}
        </View>
      </View>
    </Card>
  );
}

export default function SettingsConversionsScreen() {
  const navigation = useNavigation();
  const colors = useThemeColors();

  useLayoutEffect(() => {
    navigation.setOptions({ title: 'Conversions' });
  }, [navigation]);

  return (
    <GradientBackground>
      <ScrollView className="flex-1">
        <View className="px-6 pt-4 pb-16 flex-col gap-5">
          <View className="flex-col gap-1.5">
            <ScreenTitle title="Quick Reference" variant="muted" />
            <Text
              className="text-sm leading-5"
              style={{ color: colors.textSecondary }}
            >
              Bottle sizes, pour measures, metric conversions, kitchen volumes,
              and keg yields. The numbers you keep almost-but-not-quite
              remembering.
            </Text>
          </View>

          <View className="flex-col gap-3">
            {CONVERSION_GROUPS.map((group) => (
              <GroupCard key={group.title} group={group} colors={colors} />
            ))}
          </View>
        </View>
      </ScrollView>
    </GradientBackground>
  );
}
