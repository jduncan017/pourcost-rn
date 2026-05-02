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

export type PerfTier = 'onTarget' | 'close' | 'drifting' | 'bad';

/** Map a pour-cost-to-goal ratio into a color + label (e.g. 1.0 = On Target).
 *  Exported so other components (e.g. performance badges on detail pages) can
 *  reuse the same thresholds without duplicating the color math.
 *
 *  Pass `pctDelta` (current pour cost % minus goal %) to distinguish the
 *  exact-match "On Target" label from the band-but-not-exact "Within Target"
 *  label. Without it, anything inside the on-target band reads "On Target". */
export function getPerformance(ratio: number, pctDelta?: number) {
  if (ratio <= 0)
    return { color: PERF_COLORS.onTarget, label: 'On Target', tier: 'onTarget' as PerfTier };
  const distance = Math.abs(ratio - 1);
  if (distance <= PERFORMANCE_DISTANCE_THRESHOLDS.ON_TARGET) {
    const exact = pctDelta == null || Math.abs(pctDelta) < 0.05;
    return {
      color: PERF_COLORS.onTarget,
      label: exact ? 'On Target' : 'Within Target',
      tier: 'onTarget' as PerfTier,
    };
  }
  if (distance <= PERFORMANCE_DISTANCE_THRESHOLDS.CLOSE)
    return {
      color: PERF_COLORS.close,
      label: ratio < 1 ? 'Slight Under' : 'Slight Over',
      tier: 'close' as PerfTier,
    };
  if (distance <= PERFORMANCE_DISTANCE_THRESHOLDS.DRIFTING)
    return {
      color: PERF_COLORS.drifting,
      label: ratio < 1 ? 'Under' : 'Over',
      tier: 'drifting' as PerfTier,
    };
  return {
    color: PERF_COLORS.bad,
    label: ratio < 1 ? 'Way Under' : 'Way Over',
    tier: 'bad' as PerfTier,
  };
}

interface PourCostHeroProps {
  pourCostPercentage: number;
  /** Override the bar-wide pourCostGoal — used by ingredient-detail to
   *  compare against the tier-appropriate target instead of the bar's
   *  global default. When omitted, falls back to the store's pourCostGoal. */
  targetGoal?: number;
  /** Category prefix for the target readout (e.g. "Well Priced", "Call Priced",
   *  "Premium", "Beer", "Wine", "Cocktail"). Renders as "Well Priced Target 10%".
   *  When omitted, falls back to the generic "target {n}%" wording. */
  targetLabel?: string;
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
  targetGoal,
  targetLabel,
  className = '',
}: PourCostHeroProps) {
  const { pourCostGoal } = useAppStore();
  const colors = useThemeColors();

  const goal = targetGoal ?? pourCostGoal ?? 20;
  const ratio = pourCostPercentage > 0 ? pourCostPercentage / goal : 0;
  const delta = pourCostPercentage - goal;
  const perf = getPerformance(ratio, delta);
  const absDelta = Math.abs(delta);
  const deltaWord =
    Math.abs(delta) < 0.05 ? null : delta < 0 ? 'under' : 'over';
  const maxScale = goal * 2;
  const fillPercent = Math.min(
    Math.max((pourCostPercentage / maxScale) * 100, 0),
    100
  );

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
                {targetLabel ? `${targetLabel} Target` : 'target'} {goal}%
                {deltaWord ? ' - ' : ''}
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

          {/* Single-color fill capsule. Track is a darkened capsule, fill is
              left-to-right at the user's pour-cost position, color tied to
              perf state (green/yellow/orange/red). Neon glow shadow + glass
              top sheen + a subtle hairline marker at the goal position give
              the "you're here vs target" read at a glance — without rainbow
              busyness. Inspired by the original PourCost design, polished. */}
          <View className="flex-col">
            <PerformanceBar fillPercent={fillPercent} perfColor={perf.color} />
          </View>
        </View>
      </LinearGradient>
    </View>
  );
}

// ============================================================
// PerformanceBar — single-color fill capsule with neon glow
// ============================================================

function PerformanceBar({
  fillPercent,
  perfColor,
}: {
  fillPercent: number;
  perfColor: string;
}) {
  // Goal sits at 50% of bar width (bar spans 0 → 2× goal).
  const goalPercent = 50;

  return (
    <View style={{ height: 14, justifyContent: 'center' }}>
      {/* Track — dark capsule with subtle white border */}
      <View
        style={{
          height: 10,
          borderRadius: 5,
          backgroundColor: 'rgba(255,255,255,0.06)',
          borderWidth: 1,
          borderColor: 'rgba(255,255,255,0.14)',
          overflow: 'hidden',
        }}
      >
        {/* Single-color fill, neon-glow tinted to perf state */}
        <View
          style={{
            width: `${Math.max(fillPercent, 2)}%`,
            height: '100%',
            backgroundColor: perfColor,
            borderRadius: 5,
            // Neon glow that pulses with state — same color as the fill so
            // the tint reinforces the perf signal.
            shadowColor: perfColor,
            shadowOpacity: 0.85,
            shadowRadius: 6,
            shadowOffset: { width: 0, height: 0 },
            elevation: 4,
          }}
        >
          {/* Glass top sheen — bright at top, soft mid, slight darkening at
              bottom. Sits on top of the fill so the capsule reads as glassy. */}
          <LinearGradient
            colors={[
              'rgba(255,255,255,0.2)',
              'rgba(255,255,255,0.05)',
              'rgba(0,0,0,0.18)',
            ]}
            locations={[0, 0.55, 1]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              borderRadius: 5,
            }}
            pointerEvents="none"
          />
        </View>
      </View>

      {/* Goal marker — thin hairline at center (50% = goal), neutral so it
          doesn't compete with the perf-tinted fill. */}
      <View
        style={{
          position: 'absolute',
          left: `${goalPercent}%`,
          marginLeft: -0.5,
          top: -1,
          bottom: -1,
          width: 1,
          backgroundColor: 'rgba(255,255,255,0.45)',
        }}
        pointerEvents="none"
      />
    </View>
  );
}
