import { View, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAppStore } from '@/src/stores/app-store';
import { useThemeColors, palette } from '@/src/contexts/ThemeContext';
import { PERFORMANCE_DISTANCE_THRESHOLDS } from '@/src/constants/appConstants';
import InfoIcon from './ui/InfoIcon';

const PERF_COLORS = {
  onTarget: palette.G3,
  close: palette.Y3,
  drifting: palette.O4,
  bad: palette.R3,
};

/** Map a pour-cost-to-goal ratio into a color + label (e.g. 1.0 = On Target).
 *  Exported so other components (e.g. performance badges on detail pages) can
 *  reuse the same thresholds without duplicating the color math. */
export function getPerformance(ratio: number) {
  if (ratio <= 0) return { color: PERF_COLORS.onTarget, label: 'On Target' };
  const distance = Math.abs(ratio - 1);
  if (distance <= PERFORMANCE_DISTANCE_THRESHOLDS.ON_TARGET)
    return { color: PERF_COLORS.onTarget, label: 'On Target' };
  if (distance <= PERFORMANCE_DISTANCE_THRESHOLDS.CLOSE)
    return { color: PERF_COLORS.close, label: ratio < 1 ? 'Slight Under' : 'Slight Over' };
  if (distance <= PERFORMANCE_DISTANCE_THRESHOLDS.DRIFTING)
    return { color: PERF_COLORS.drifting, label: ratio < 1 ? 'Under' : 'Over' };
  return { color: PERF_COLORS.bad, label: ratio < 1 ? 'Way Under' : 'Way Over' };
}

interface PourCostHeroProps {
  pourCostPercentage: number;
  className?: string;
}

/**
 * Open hero section framed by hairlines top + bottom with a subtle vertical
 * gold wash (transparent → barely gold → transparent) behind the number.
 *
 * Layout:
 *   [POUR COST label]                    [ON TARGET label]
 *   [big 16.0%]                          [target 18%]
 *                                        [2.0 under]
 *   [================== bar ==================]
 */
export default function PourCostHero({
  pourCostPercentage,
  className = '',
}: PourCostHeroProps) {
  const { pourCostGoal } = useAppStore();
  const colors = useThemeColors();

  const goal = pourCostGoal || 20;
  const ratio = pourCostPercentage > 0 ? pourCostPercentage / goal : 0;
  const perf = getPerformance(ratio);
  const delta = pourCostPercentage - goal;
  const absDelta = Math.abs(delta);
  const deltaWord =
    Math.abs(delta) < 0.05 ? null : delta < 0 ? 'under' : 'over';
  const maxScale = goal * 2;
  const fillPercent = Math.min(
    Math.max((pourCostPercentage / maxScale) * 100, 0),
    100
  );
  const goalPercent = 50;

  // Wash uses perf.color — shifts red→orange→yellow→green by severity.
  const washColors = [
    perf.color + '00',
    perf.color + '1A',
    perf.color + '00',
  ] as const;

  return (
    <View
      className={className}
      style={{
        borderTopWidth: 1,
        borderBottomWidth: 1,
        borderColor: colors.borderSubtle,
        backgroundColor: palette.B9 + '60',
      }}
    >
      <LinearGradient
        colors={washColors}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      >
        <View className="px-6 py-5 flex-col gap-3">
          {/* Top rows — label left muted / perf label right takes perf.color */}
          <View className="flex-row justify-between items-center">
            <View className="flex-row items-center gap-1">
              <Text
                className="text-[11px] tracking-widest uppercase"
                style={{ color: colors.textTertiary, fontWeight: '600' }}
              >
                Pour Cost
              </Text>
              <InfoIcon termKey="pourCost" size={13} />
            </View>
            <Text
              className="text-[11px] tracking-widest uppercase"
              style={{ color: perf.color, fontWeight: '700' }}
            >
              {perf.label}
            </Text>
          </View>

          {/* Big number + target/delta column — number matches bar color */}
          <View className="flex-row justify-between items-end">
            <View className="flex-row items-baseline gap-1">
              <Text
                style={{
                  color: perf.color,
                  fontSize: 32,
                  fontWeight: '700',
                  lineHeight: 36,
                }}
              >
                {pourCostPercentage.toFixed(1)}
              </Text>
              <Text
                style={{ color: perf.color, fontSize: 18, fontWeight: '600' }}
              >
                %
              </Text>
            </View>

            <View className="flex-row items-end">
              <Text className="text-xs" style={{ color: colors.textTertiary }}>
                target {goal}% -{` `}
              </Text>
              {deltaWord && (
                <Text
                  className="text-xs mt-0.5"
                  style={{ color: colors.textTertiary }}
                >
                  {absDelta.toFixed(1)}% {deltaWord}
                </Text>
              )}
            </View>
          </View>

          {/* Bar — thin */}
          <View className="relative">
            <View
              className="rounded-full overflow-hidden"
              style={{ height: 4, backgroundColor: colors.inputBg }}
            >
              <View
                className="h-full rounded-full"
                style={{
                  width: `${Math.max(fillPercent, 1)}%`,
                  backgroundColor: perf.color,
                }}
              />
            </View>
            {/* Goal marker */}
            <View
              className="absolute"
              style={{
                left: `${goalPercent}%`,
                top: -2,
                bottom: -2,
                marginLeft: -1,
              }}
            >
              <View
                style={{
                  width: 2,
                  height: '100%',
                  backgroundColor: colors.text,
                  opacity: 0.35,
                  borderRadius: 1,
                }}
              />
            </View>
          </View>
        </View>
      </LinearGradient>
    </View>
  );
}
