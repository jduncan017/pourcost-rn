import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput as RNTextInput,
} from 'react-native';
import { useNavigation } from 'expo-router';
import { useGuardedRouter } from '@/src/lib/guarded-router';
import { Ionicons } from '@expo/vector-icons';
import GradientBackground from '@/src/components/ui/GradientBackground';
import ScreenTitle from '@/src/components/ui/ScreenTitle';
import SectionDivider from '@/src/components/ui/SectionDivider';
import Toggle from '@/src/components/ui/Toggle';
import CustomSlider from '@/src/components/ui/CustomSlider';
import { palette, useThemeColors } from '@/src/contexts/ThemeContext';
import { useAppStore } from '@/src/stores/app-store';
import { useAuth } from '@/src/contexts/AuthContext';
import {
  PourCostTier,
  DEFAULT_TIERS,
  validateTiers,
} from '@/src/lib/pour-cost-tiers';
import { FeedbackService } from '@/src/services/feedback-service';
import { HapticService } from '@/src/services/haptic-service';

/**
 * Pour Cost Targets.
 *
 * Non-admin (free tier): single Cocktail pour cost goal. Beer / Wine / spirit
 * tier ladder all run on hardcoded defaults silently. Per-category goals and
 * the tier ladder are gated behind admin (will flip to paid post-launch).
 *
 * Admin: full page — cocktail / beer / wine bar-wide goals, spirit tier ladder
 * with Pro Mode toggle + inline tier editor.
 */
export default function SettingsTiersScreen() {
  const router = useGuardedRouter();
  const navigation = useNavigation();
  const colors = useThemeColors();
  const { isAdmin } = useAuth();
  const {
    pourCostGoal,
    setPourCostGoal,
    beerPourCostGoal,
    setBeerPourCostGoal,
    winePourCostGoal,
    setWinePourCostGoal,
    proModeEnabled,
    setProModeEnabled,
    pourCostTiers,
    setPourCostTiers,
    saveProfile,
  } = useAppStore();

  const [draft, setDraft] = useState<PourCostTier[]>(pourCostTiers);

  // Debounce profile writes from sliders so we're not firing a Supabase
  // update on every drag pixel. Flush on unmount so the user can leave the
  // screen mid-drag without losing the value.
  const saveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const debouncedSave = useCallback(() => {
    if (saveTimeout.current) clearTimeout(saveTimeout.current);
    saveTimeout.current = setTimeout(() => { saveProfile(); }, 800);
  }, [saveProfile]);

  useEffect(() => {
    return () => {
      if (saveTimeout.current) {
        clearTimeout(saveTimeout.current);
        saveProfile();
      }
    };
  }, [saveProfile]);

  useLayoutEffect(() => {
    navigation.setOptions({ title: isAdmin ? 'Pour Cost Targets' : 'Pour Cost Target' });
  }, [navigation, isAdmin]);

  // Re-sync local draft when store changes externally.
  useEffect(() => {
    setDraft(pourCostTiers);
  }, [pourCostTiers]);

  const updateTier = (idx: number, patch: Partial<PourCostTier>) => {
    setDraft((prev) => prev.map((t, i) => (i === idx ? { ...t, ...patch } : t)));
  };

  const addTier = () => {
    HapticService.selection();
    setDraft((prev) => {
      const lastIdx = prev.length - 1;
      const top = prev[lastIdx];
      if (!top || top.maxBottleCost != null) {
        const lastBoundedMax = prev[lastIdx]?.maxBottleCost ?? 0;
        return [
          ...prev,
          { minBottleCost: lastBoundedMax, maxBottleCost: null, targetPourCostPct: 30, label: 'New Tier' },
        ];
      }
      const prevTier = prev[lastIdx - 1];
      const splitPoint = prevTier ? prevTier.maxBottleCost ?? 0 : top.minBottleCost;
      const newTier: PourCostTier = {
        minBottleCost: splitPoint,
        maxBottleCost: splitPoint + 50,
        targetPourCostPct: 22,
        label: 'New Tier',
      };
      const updatedTop: PourCostTier = { ...top, minBottleCost: splitPoint + 50 };
      return [...prev.slice(0, lastIdx), newTier, updatedTop];
    });
  };

  const removeTier = (idx: number) => {
    HapticService.selection();
    setDraft((prev) => {
      if (prev.length <= 1) return prev;
      const next = prev.filter((_, i) => i !== idx);
      for (let i = 1; i < next.length; i++) {
        const prevMax = next[i - 1].maxBottleCost;
        if (prevMax != null) next[i] = { ...next[i], minBottleCost: prevMax };
      }
      const last = next[next.length - 1];
      if (last && last.maxBottleCost != null) {
        next[next.length - 1] = { ...last, maxBottleCost: null };
      }
      return next;
    });
  };

  const handleSaveTiers = () => {
    const err = validateTiers(draft);
    if (err) {
      FeedbackService.showError('Tiers Invalid', err);
      return;
    }
    setPourCostTiers(draft);
    FeedbackService.showSuccess('Saved', 'Your custom tiers are now in use.');
  };

  const handleResetTiers = () => {
    FeedbackService.showConfirmation({
      title: 'Reset to Defaults?',
      message: 'Your custom tiers will be replaced with the built-in ladder.',
      confirmText: 'Reset',
      destructive: true,
      onConfirm: () => {
        setPourCostTiers(DEFAULT_TIERS);
        setDraft(DEFAULT_TIERS);
      },
    });
  };

  const tiersDirty = JSON.stringify(draft) !== JSON.stringify(pourCostTiers);
  const tiersEditable = isAdmin && proModeEnabled;

  // Non-admin (free tier): single Cocktail pour cost goal. Per-category +
  // spirit tier controls hidden until paid tier ships.
  if (!isAdmin) {
    return (
      <GradientBackground>
        <ScrollView className="flex-1">
          <View className="px-6 pt-4 pb-8 flex-col gap-5">
            <View className="flex-col gap-4">
              <ScreenTitle variant="group" title="Pour Cost Goal" />
              <Text className="text-sm leading-5" style={{ color: palette.N3 }}>
                Target pour cost %. Drives Suggested Prices and the pour cost meter.
              </Text>

              <CustomSlider
                label="Pour Cost Goal"
                value={pourCostGoal}
                onValueChange={(v) => { setPourCostGoal(Math.round(v)); debouncedSave(); }}
                commitOn="release"
                minValue={5}
                maxValue={40}
                step={1}
                formatValue={(v) => `${Math.round(v)}%`}
              />
            </View>

            <View
              className="rounded-2xl p-3 flex-row items-start gap-2"
              style={{
                backgroundColor: palette.Y4 + '0E',
                borderWidth: 1,
                borderColor: palette.Y4 + '40',
              }}
            >
              <Ionicons name="lock-closed" size={16} color={palette.Y4} style={{ marginTop: 2 }} />
              <Text className="flex-1" style={{ color: palette.N2, fontSize: 13, lineHeight: 18 }}>
                Per-category goals (beer, wine) and per-tier spirit goals are coming soon as a paid feature. Sensible defaults apply today.
              </Text>
            </View>
          </View>
        </ScrollView>
      </GradientBackground>
    );
  }

  return (
    <GradientBackground>
      <ScrollView className="flex-1">
        <View className="px-6 pt-4 pb-8 flex-col gap-6">
          {/* Bar-wide goals: Cocktails, Beer, Wine */}
          <View className="flex-col gap-4">
            <ScreenTitle variant="group" title="Bar-Wide Goals" />
            <Text className="text-sm leading-5" style={{ color: palette.N3 }}>
              Targets that drive Suggested Prices and the pour cost meter. Cocktails, beer, and wine use these. Spirits use the price tiers below.
            </Text>

            <CustomSlider
              label="Cocktails Pour Cost Goal"
              value={pourCostGoal}
              onValueChange={(v) => { setPourCostGoal(Math.round(v)); debouncedSave(); }}
              commitOn="release"
              minValue={5}
              maxValue={40}
              step={1}
              formatValue={(v) => `${Math.round(v)}%`}
            />

            <CustomSlider
              label="Beer Pour Cost Goal"
              value={beerPourCostGoal}
              onValueChange={(v) => { setBeerPourCostGoal(Math.round(v)); debouncedSave(); }}
              commitOn="release"
              minValue={10}
              maxValue={40}
              step={1}
              formatValue={(v) => `${Math.round(v)}%`}
            />

            <CustomSlider
              label="Wine Pour Cost Goal"
              value={winePourCostGoal}
              onValueChange={(v) => { setWinePourCostGoal(Math.round(v)); debouncedSave(); }}
              commitOn="release"
              minValue={10}
              maxValue={45}
              step={1}
              formatValue={(v) => `${Math.round(v)}%`}
            />
          </View>

          <SectionDivider />

          {/* Spirits tier ladder */}
          <View className="flex-col gap-3">
            <ScreenTitle variant="group" title="Spirit Price Tiers" />
            <Text className="text-sm leading-5" style={{ color: palette.N3 }}>
              Pour cost % varies a lot across price tiers. Wells run lower, premium spirits higher. Each ingredient picks the right target based on its bottle cost.
            </Text>

            {/* Pro Mode section — admin only */}
            {isAdmin ? (
              <View
                className="rounded-2xl p-4 flex-row items-center justify-between"
                style={{
                  backgroundColor: palette.Y4 + '10',
                  borderWidth: 1,
                  borderColor: palette.Y4 + '40',
                }}
              >
                <View className="flex-1 pr-3">
                  <Text style={{ color: palette.Y4, fontSize: 13, fontWeight: '700', letterSpacing: 0.5 }}>
                    PRO MODE (ADMIN)
                  </Text>
                  <Text style={{ color: palette.N2, fontSize: 14, fontWeight: '600', marginTop: 4 }}>
                    Edit Custom Tiers
                  </Text>
                  <Text style={{ color: palette.N4, fontSize: 12, marginTop: 2 }}>
                    Toggle on to override the defaults below
                  </Text>
                </View>
                <Toggle value={proModeEnabled} onValueChange={setProModeEnabled} />
              </View>
            ) : (
              <View
                className="rounded-2xl p-3 flex-row items-start gap-2"
                style={{
                  backgroundColor: palette.Y4 + '0E',
                  borderWidth: 1,
                  borderColor: palette.Y4 + '40',
                }}
              >
                <Ionicons name="lock-closed" size={16} color={palette.Y4} style={{ marginTop: 2 }} />
                <Text className="flex-1" style={{ color: palette.N2, fontSize: 13, lineHeight: 18 }}>
                  Custom tiers are coming soon as a paid feature. The defaults below apply to your bar today.
                </Text>
              </View>
            )}

            {draft.map((tier, idx) => (
              <TierRow
                key={idx}
                tier={tier}
                index={idx}
                isLast={idx === draft.length - 1}
                editable={tiersEditable}
                onChange={(patch) => updateTier(idx, patch)}
                onRemove={() => removeTier(idx)}
              />
            ))}

            {tiersEditable && (
              <Pressable
                onPress={addTier}
                className="flex-row items-center justify-center gap-2 py-3 mt-2 rounded-xl"
                style={{
                  borderWidth: 1,
                  borderColor: palette.B5 + '60',
                  borderStyle: 'dashed',
                  backgroundColor: palette.B5 + '0E',
                }}
              >
                <Ionicons name="add-circle-outline" size={18} color={palette.B5} />
                <Text style={{ color: palette.B5, fontSize: 14, fontWeight: '600' }}>
                  Add Tier
                </Text>
              </Pressable>
            )}

            {tiersEditable && (
              <View className="flex-col gap-2 mt-2">
                <Pressable
                  onPress={handleSaveTiers}
                  disabled={!tiersDirty}
                  style={[styles.primaryButton, !tiersDirty && styles.disabled]}
                >
                  <Text style={styles.primaryButtonText}>
                    {tiersDirty ? 'Save Tiers' : 'Saved'}
                  </Text>
                </Pressable>
                <Pressable onPress={handleResetTiers} className="py-3 items-center">
                  <Text style={{ color: palette.N4, fontSize: 14 }}>
                    Reset To Defaults
                  </Text>
                </Pressable>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </GradientBackground>
  );
}

// ============================================================
// TierRow — inline editable tier
// ============================================================

interface TierRowProps {
  tier: PourCostTier;
  index: number;
  isLast: boolean;
  editable: boolean;
  onChange: (patch: Partial<PourCostTier>) => void;
  onRemove: () => void;
}

function TierRow({ tier, index, isLast, editable, onChange, onRemove }: TierRowProps) {
  const [labelText, setLabelText] = useState(tier.label ?? '');
  const [minText, setMinText] = useState(String(tier.minBottleCost));
  const [maxText, setMaxText] = useState(
    tier.maxBottleCost == null ? '' : String(tier.maxBottleCost),
  );
  const [pctText, setPctText] = useState(String(tier.targetPourCostPct));

  useEffect(() => {
    setMinText(String(tier.minBottleCost));
    setMaxText(tier.maxBottleCost == null ? '' : String(tier.maxBottleCost));
    setPctText(String(tier.targetPourCostPct));
    setLabelText(tier.label ?? '');
  }, [tier.minBottleCost, tier.maxBottleCost, tier.targetPourCostPct, tier.label]);

  const commitMin = () => {
    const n = parseFloat(minText);
    if (Number.isFinite(n) && n >= 0) onChange({ minBottleCost: n });
    else setMinText(String(tier.minBottleCost));
  };
  const commitMax = () => {
    if (maxText.trim() === '' || maxText.trim().toLowerCase() === 'unbounded') {
      onChange({ maxBottleCost: null });
      return;
    }
    const n = parseFloat(maxText);
    if (Number.isFinite(n) && n > 0) onChange({ maxBottleCost: n });
    else setMaxText(tier.maxBottleCost == null ? '' : String(tier.maxBottleCost));
  };
  const commitPct = () => {
    const n = parseFloat(pctText);
    if (Number.isFinite(n) && n >= 1 && n <= 100) onChange({ targetPourCostPct: n });
    else setPctText(String(tier.targetPourCostPct));
  };
  const commitLabel = () => onChange({ label: labelText.trim() || undefined });

  const inputStyle = {
    color: palette.N1,
    fontSize: 14,
    paddingVertical: 6,
    paddingHorizontal: 8,
    minWidth: 60,
    backgroundColor: editable ? 'rgba(255,255,255,0.06)' : 'transparent',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: editable ? 'rgba(255,255,255,0.18)' : 'transparent',
  } as const;

  return (
    <View
      className="rounded-2xl p-4 flex-col gap-3"
      style={{
        backgroundColor: 'rgba(255,255,255,0.04)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.12)',
      }}
    >
      <View className="flex-row items-center justify-between">
        <Text style={{ color: palette.N4, fontSize: 11, fontWeight: '600', letterSpacing: 0.5 }}>
          TIER {index + 1}{tier.label ? ` · ${tier.label.toUpperCase()}` : ''}
        </Text>
        {editable && !isLast && (
          <Pressable onPress={onRemove} hitSlop={8}>
            <Ionicons name="trash-outline" size={16} color={palette.R3} />
          </Pressable>
        )}
      </View>

      {editable && (
        <View className="flex-row items-center gap-2">
          <Text style={{ color: palette.N3, fontSize: 13, width: 60 }}>Label</Text>
          <RNTextInput
            value={labelText}
            onChangeText={setLabelText}
            onBlur={commitLabel}
            onSubmitEditing={commitLabel}
            placeholder="e.g. Well Priced"
            placeholderTextColor={palette.N4 + '80'}
            style={[inputStyle, { flex: 1 }]}
          />
        </View>
      )}

      <View className="flex-row items-center gap-2">
        <Text style={{ color: palette.N3, fontSize: 13, width: 60 }}>Range</Text>
        <View className="flex-row items-center gap-1 flex-1">
          <Text style={{ color: palette.N3, fontSize: 13 }}>$</Text>
          {editable ? (
            <RNTextInput
              value={minText}
              onChangeText={setMinText}
              onBlur={commitMin}
              onSubmitEditing={commitMin}
              keyboardType="decimal-pad"
              style={inputStyle}
            />
          ) : (
            <Text style={{ color: palette.N1, fontSize: 14 }}>{tier.minBottleCost}</Text>
          )}
          <Text style={{ color: palette.N3, fontSize: 13 }}>to</Text>
          <Text style={{ color: palette.N3, fontSize: 13 }}>$</Text>
          {editable ? (
            <RNTextInput
              value={maxText}
              onChangeText={setMaxText}
              onBlur={commitMax}
              onSubmitEditing={commitMax}
              keyboardType="decimal-pad"
              placeholder={isLast ? '∞' : ''}
              placeholderTextColor={palette.N4 + '80'}
              style={inputStyle}
            />
          ) : (
            <Text style={{ color: palette.N1, fontSize: 14 }}>
              {tier.maxBottleCost == null ? '∞' : tier.maxBottleCost}
            </Text>
          )}
        </View>
      </View>

      <View className="flex-row items-center gap-2">
        <Text style={{ color: palette.N3, fontSize: 13, width: 60 }}>Target</Text>
        {editable ? (
          <RNTextInput
            value={pctText}
            onChangeText={setPctText}
            onBlur={commitPct}
            onSubmitEditing={commitPct}
            keyboardType="decimal-pad"
            style={inputStyle}
          />
        ) : (
          <Text style={{ color: palette.N1, fontSize: 14, fontWeight: '600' }}>
            {tier.targetPourCostPct}
          </Text>
        )}
        <Text style={{ color: palette.N3, fontSize: 13 }}>%</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  primaryButton: {
    backgroundColor: palette.B5,
    paddingVertical: 16,
    borderRadius: 999,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: palette.N1,
    fontSize: 16,
    fontWeight: '600',
  },
  disabled: {
    opacity: 0.4,
  },
});
