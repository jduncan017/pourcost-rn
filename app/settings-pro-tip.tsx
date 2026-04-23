import { useLayoutEffect } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { useLocalSearchParams, useNavigation } from 'expo-router';
import GradientBackground from '@/src/components/ui/GradientBackground';
import { useThemeColors } from '@/src/contexts/ThemeContext';
import { PRO_TIPS, TipBlock } from '@/src/constants/pro-tips';

function Paragraph({ text, colors }: { text: string; colors: any }) {
  return (
    <Text
      className="text-base leading-6"
      style={{ color: colors.textSecondary }}
    >
      {text}
    </Text>
  );
}

function BulletList({ items, colors }: { items: string[]; colors: any }) {
  return (
    <View className="flex-col gap-2">
      {items.map((item, i) => (
        <View key={i} className="flex-row gap-2 items-start">
          <Text
            className="text-base"
            style={{ color: colors.gold, fontWeight: '700', lineHeight: 22 }}
          >
            •
          </Text>
          <Text
            className="flex-1 text-base leading-6"
            style={{ color: colors.textSecondary }}
          >
            {item}
          </Text>
        </View>
      ))}
    </View>
  );
}

function ScenarioCard({
  label,
  bullets,
  colors,
}: {
  label: string;
  bullets: string[];
  colors: any;
}) {
  return (
    <View
      className="rounded-xl p-4"
      style={{
        backgroundColor: colors.inputBg,
        borderWidth: 1,
        borderColor: colors.borderSubtle,
      }}
    >
      <Text
        className="text-[11px] tracking-widest uppercase mb-3"
        style={{ color: colors.textTertiary, fontWeight: '600' }}
      >
        {label}
      </Text>
      <BulletList items={bullets} colors={colors} />
    </View>
  );
}

function renderBlock(block: TipBlock, index: number, colors: any) {
  switch (block.kind) {
    case 'paragraph':
      return <Paragraph key={index} text={block.text} colors={colors} />;
    case 'list':
      return <BulletList key={index} items={block.items} colors={colors} />;
    case 'scenario':
      return (
        <ScenarioCard
          key={index}
          label={block.label}
          bullets={block.bullets}
          colors={colors}
        />
      );
  }
}

export default function SettingsProTipScreen() {
  const navigation = useNavigation();
  const params = useLocalSearchParams();
  const colors = useThemeColors();

  const tipKey = params.key as string;
  const tip = PRO_TIPS.find((t) => t.key === tipKey);

  useLayoutEffect(() => {
    navigation.setOptions({ title: 'Pro Tip' });
  }, [navigation]);

  if (!tip) {
    return (
      <GradientBackground>
        <View className="flex-1 items-center justify-center px-6">
          <Text
            className="text-base text-center"
            style={{ color: colors.textTertiary }}
          >
            Tip not found.
          </Text>
        </View>
      </GradientBackground>
    );
  }

  return (
    <GradientBackground>
      <ScrollView className="flex-1">
        <View className="px-6 pt-4 pb-16 flex-col gap-5">
          <Text
            className="text-2xl"
            style={{ color: colors.text, fontWeight: '700', lineHeight: 30 }}
          >
            {tip.title}
          </Text>

          <View className="flex-col gap-5">
            {tip.blocks.map((block, i) => renderBlock(block, i, colors))}
          </View>

          {tip.takeaway && (
            <View
              className="mt-2 rounded-lg p-4"
              style={{
                backgroundColor: colors.inputBg,
                borderLeftWidth: 3,
                borderLeftColor: colors.gold,
              }}
            >
              <Text
                className="text-base italic leading-6"
                style={{ color: colors.text, fontWeight: '500' }}
              >
                “{tip.takeaway}”
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </GradientBackground>
  );
}
