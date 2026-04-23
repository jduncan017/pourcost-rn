import { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import BottomSheet from './BottomSheet';
import { useThemeColors, palette } from '@/src/contexts/ThemeContext';
import { HapticService } from '@/src/services/haptic-service';
import { GLOSSARY, GlossaryKey, GlossaryTerm } from '@/src/constants/glossary';

interface InfoIconProps {
  /** Glossary term to look up. Takes precedence over inline title/content. */
  termKey?: GlossaryKey;
  /** Inline title (used when termKey is not provided). */
  title?: string;
  /** Inline content — 1-2 sentence explanation. */
  content?: string;
  /** Icon size. Default 14. */
  size?: number;
  /** Icon color override. Default textTertiary. */
  color?: string;
  /** Optional Pro Tip key — adds a "Learn More" button that opens the tip. */
  learnMoreTipKey?: string;
  className?: string;
}

/**
 * Small "?" icon that opens a BottomSheet with a term definition.
 *
 * Usage — glossary-backed (preferred, stays in sync with the Glossary screen):
 *   <InfoIcon termKey="pourCost" />
 *
 * Usage — inline one-off tip:
 *   <InfoIcon title="Note" content="Tax isn't included in suggested price." />
 */
export default function InfoIcon({
  termKey,
  title,
  content,
  size = 14,
  color,
  learnMoreTipKey,
  className = '',
}: InfoIconProps) {
  const colors = useThemeColors();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const term: GlossaryTerm | null = termKey ? GLOSSARY[termKey] : null;
  const sheetTitle = term?.term ?? title ?? 'Info';
  const sheetBody = term?.definition ?? content ?? '';

  return (
    <>
      <Pressable
        onPress={() => {
          HapticService.buttonPress();
          setOpen(true);
        }}
        hitSlop={8}
        className={className}
      >
        <Ionicons
          name="information-circle-outline"
          size={size}
          color={color ?? colors.textTertiary}
        />
      </Pressable>

      <BottomSheet visible={open} onClose={() => setOpen(false)} title={sheetTitle}>
        <View className="px-4 pb-6 flex-col gap-4">
          <Text className="text-base leading-6" style={{ color: colors.text }}>
            {sheetBody}
          </Text>

          {term?.example && (
            <View
              className="rounded-lg p-3"
              style={{ backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.borderSubtle }}
            >
              <Text
                className="text-[11px] tracking-widest uppercase mb-1"
                style={{ color: colors.textTertiary, fontWeight: '600' }}
              >
                Example
              </Text>
              <Text className="text-sm leading-5" style={{ color: colors.textSecondary }}>
                {term.example}
              </Text>
            </View>
          )}

          {term?.synonyms && term.synonyms.length > 0 && (
            <View className="flex-col gap-2">
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
                    style={{ backgroundColor: colors.inputBg, borderWidth: 1, borderColor: colors.borderSubtle }}
                  >
                    <Text className="text-xs" style={{ color: colors.textSecondary, fontWeight: '500' }}>
                      {s}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {learnMoreTipKey && (
            <Pressable
              onPress={() => {
                HapticService.navigation();
                setOpen(false);
                // Defer navigation until the sheet finishes its close animation.
                setTimeout(() => {
                  router.push({
                    pathname: '/settings-pro-tip',
                    params: { key: learnMoreTipKey },
                  } as any);
                }, 120);
              }}
              className="flex-row items-center justify-center gap-2 py-3 rounded-lg mt-2"
              style={{ backgroundColor: palette.B5 }}
            >
              <Ionicons name="book-outline" size={16} color={palette.N1} />
              <Text
                style={{ color: palette.N1, fontWeight: '600', fontSize: 15 }}
              >
                Learn More
              </Text>
            </Pressable>
          )}
        </View>
      </BottomSheet>
    </>
  );
}
