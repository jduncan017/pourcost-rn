import { useLayoutEffect } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { useNavigation } from 'expo-router';
import GradientBackground from '@/src/components/ui/GradientBackground';
import Card from '@/src/components/ui/Card';
import ScreenTitle from '@/src/components/ui/ScreenTitle';
import { useThemeColors } from '@/src/contexts/ThemeContext';
import {
  GLOSSARY,
  GLOSSARY_SECTIONS,
  GlossarySection,
  GlossaryTerm,
} from '@/src/constants/glossary';

function GlossaryCard({ term, colors }: { term: GlossaryTerm; colors: any }) {
  return (
    <Card padding="medium">
      <View className="flex-col gap-2">
        <Text
          className="text-base"
          style={{ color: colors.text, fontWeight: '700' }}
        >
          {term.term}
        </Text>
        <Text
          className="text-sm leading-5"
          style={{ color: colors.textSecondary }}
        >
          {term.definition}
        </Text>

        {term.example && (
          <View
            className="mt-1 rounded-lg p-3"
            style={{
              backgroundColor: colors.inputBg,
              borderWidth: 1,
              borderColor: colors.borderSubtle,
            }}
          >
            <Text
              className="text-[11px] tracking-widest uppercase mb-1"
              style={{ color: colors.textTertiary, fontWeight: '600' }}
            >
              Example
            </Text>
            <Text
              className="text-sm leading-5"
              style={{ color: colors.textSecondary }}
            >
              {term.example}
            </Text>
          </View>
        )}

        {term.synonyms && term.synonyms.length > 0 && (
          <View className="flex-col gap-1.5 mt-1">
            <Text
              className="text-[11px] tracking-widest uppercase"
              style={{ color: colors.textTertiary, fontWeight: '600' }}
            >
              Also called
            </Text>
            <View className="flex-row flex-wrap gap-1.5">
              {term.synonyms.map((s) => (
                <View
                  key={s}
                  className="px-2.5 py-1 rounded-full"
                  style={{
                    backgroundColor: colors.inputBg,
                    borderWidth: 1,
                    borderColor: colors.borderSubtle,
                  }}
                >
                  <Text
                    className="text-xs"
                    style={{ color: colors.textSecondary, fontWeight: '500' }}
                  >
                    {s}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </View>
    </Card>
  );
}

function SectionBlock({
  section,
  colors,
}: {
  section: GlossarySection;
  colors: any;
}) {
  return (
    <View className="flex-col gap-3">
      <View className="flex-col gap-1">
        <ScreenTitle title={section.title} variant="muted" />
        {section.description && (
          <Text
            className="text-xs"
            style={{ color: colors.textTertiary }}
          >
            {section.description}
          </Text>
        )}
      </View>
      <View className="flex-col gap-3">
        {section.keys.map((key) => (
          <GlossaryCard key={key} term={GLOSSARY[key]} colors={colors} />
        ))}
      </View>
    </View>
  );
}

export default function SettingsGlossaryScreen() {
  const navigation = useNavigation();
  const colors = useThemeColors();

  useLayoutEffect(() => {
    navigation.setOptions({ title: 'Glossary' });
  }, [navigation]);

  return (
    <GradientBackground>
      <ScrollView className="flex-1">
        <View className="px-6 pt-4 pb-16 flex-col gap-7">
          <View className="flex-col gap-1.5">
            <Text
              className="text-sm leading-5"
              style={{ color: colors.textSecondary }}
            >
              Quick reference for the vocabulary PourCost uses, and the other
              names you may have heard for the same ideas.
            </Text>
          </View>

          {GLOSSARY_SECTIONS.map((section) => (
            <SectionBlock
              key={section.title}
              section={section}
              colors={colors}
            />
          ))}
        </View>
      </ScrollView>
    </GradientBackground>
  );
}
