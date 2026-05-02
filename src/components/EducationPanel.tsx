import { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import ScreenTitle from '@/src/components/ui/ScreenTitle';
import { useThemeColors, palette } from '@/src/contexts/ThemeContext';
import {
  getCanonicalProductDetail,
  type CanonicalProductDetail,
} from '@/src/lib/canonical-products';

interface EducationPanelProps {
  /** The ingredient's link to the canonical catalog. When null/undefined,
   *  the panel renders nothing — caller can decide whether to prompt the
   *  user to relink via the form. */
  canonicalProductId?: string;
  /** Optional per-ingredient overrides. When present, these take precedence
   *  over the canonical's values. Lets a user customize brand / flavor notes
   *  for their specific bottle without forking the canonical. */
  overrides?: {
    description?: string;
    brand?: string;
    origin?: string;
    flavorNotes?: string[];
    parentCompany?: string;
    foundedYear?: number;
    productionRegion?: string;
    agingYears?: number;
    educationData?: Record<string, unknown>;
  };
}

export default function EducationPanel({ canonicalProductId, overrides }: EducationPanelProps) {
  const colors = useThemeColors();
  const [detail, setDetail] = useState<CanonicalProductDetail | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!canonicalProductId) {
      setDetail(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    getCanonicalProductDetail(canonicalProductId).then((d) => {
      if (!cancelled) {
        setDetail(d);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [canonicalProductId]);

  // Resolve display values — override wins, canonical fallback. Allows the
  // panel to render with overrides alone (no canonical link) for fully
  // user-typed ingredients that still want education-style metadata.
  const description = overrides?.description ?? detail?.description ?? null;
  const brand = overrides?.brand ?? detail?.brand ?? null;
  const origin = overrides?.origin ?? detail?.origin ?? null;
  const productionRegion = overrides?.productionRegion ?? detail?.productionRegion ?? null;
  const foundedYear = overrides?.foundedYear ?? detail?.foundedYear ?? null;
  const parentCompany = overrides?.parentCompany ?? detail?.parentCompany ?? null;
  const agingYears = overrides?.agingYears ?? detail?.agingYears ?? null;
  const flavorNotes =
    overrides?.flavorNotes && overrides.flavorNotes.length > 0
      ? overrides.flavorNotes
      : detail?.flavorNotes ?? [];
  const educationData = overrides?.educationData ?? detail?.educationData ?? {};

  const hasAnyContent =
    !!description ||
    !!brand ||
    !!origin ||
    !!productionRegion ||
    foundedYear != null ||
    !!parentCompany ||
    agingYears != null ||
    flavorNotes.length > 0 ||
    Object.keys(educationData).length > 0;

  if (!canonicalProductId && !hasAnyContent) return null;

  if (loading && !overrides) {
    return (
      <View className="EducationPanel px-6 flex-row items-center gap-2">
        <ActivityIndicator size="small" color={colors.textSecondary} />
        <Text className="text-sm" style={{ color: colors.textTertiary }}>
          Loading catalog details...
        </Text>
      </View>
    );
  }

  if (!hasAnyContent) return null;

  return (
    <View className="EducationPanel px-6 flex-col gap-4">
      <ScreenTitle title="About" variant="muted" className="mb-1" />

      {description ? (
        <Text className="text-base leading-6" style={{ color: colors.textSecondary }}>
          {description}
        </Text>
      ) : null}

      {/* Identity facts row — origin, region, parent company. Wraps. */}
      <View className="flex-row flex-wrap gap-2">
        {brand ? (
          <FactChip label="Brand" value={brand} colors={colors} />
        ) : null}
        {origin ? (
          <FactChip label="Origin" value={origin} colors={colors} />
        ) : null}
        {productionRegion ? (
          <FactChip label="Region" value={productionRegion} colors={colors} />
        ) : null}
        {foundedYear ? (
          <FactChip label="Founded" value={String(foundedYear)} colors={colors} />
        ) : null}
        {parentCompany ? (
          <FactChip label="Owner" value={parentCompany} colors={colors} />
        ) : null}
        {agingYears != null ? (
          <FactChip
            label="Aging"
            value={`${agingYears} year${agingYears === 1 ? '' : 's'}`}
            colors={colors}
          />
        ) : null}
      </View>

      {/* Flavor notes — same header treatment as the About title via
          ScreenTitle so the section hierarchy reads consistently. */}
      {flavorNotes.length > 0 ? (
        <View className="flex-col gap-2">
          <ScreenTitle title="Flavor Notes" variant="muted" />
          <View className="flex-row flex-wrap gap-2">
            {flavorNotes.map((note) => (
              <View
                key={note}
                className="rounded-full px-3 py-1.5"
                style={{
                  backgroundColor: palette.B9 + '60',
                  borderWidth: 1,
                  borderColor: colors.borderSubtle,
                }}
              >
                <Text className="text-sm" style={{ color: colors.text }}>
                  {note}
                </Text>
              </View>
            ))}
          </View>
        </View>
      ) : null}

      {/* Tier 2 educational fields. Render whichever are present in
          education_data; key set varies by category. The enrichment job
          populates these asynchronously so any subset is valid. */}
      {Object.keys(educationData).length > 0 ? (
        <View className="flex-col gap-3">
          <EducationField data={educationData} keyName="production_method" label="Production" colors={colors} />
          <EducationField data={educationData} keyName="mash_bill" label="Mash Bill" colors={colors} />
          <EducationField data={educationData} keyName="aging" label="Aging" colors={colors} />
          <EducationField data={educationData} keyName="master_distiller" label="Master Distiller" colors={colors} />
          <EducationField data={educationData} keyName="history" label="History" colors={colors} />
          <EducationListField data={educationData} keyName="signature_serves" label="Signature Serves" colors={colors} />
          <EducationListField data={educationData} keyName="food_pairings" label="Food Pairings" colors={colors} />
          <EducationField data={educationData} keyName="service_notes" label="How to Serve" colors={colors} />
          <EducationField data={educationData} keyName="grape_varietals" label="Varietals" colors={colors} />
          <EducationField data={educationData} keyName="terroir" label="Terroir" colors={colors} />
          <EducationField data={educationData} keyName="style_notes" label="Style" colors={colors} />
          <EducationField data={educationData} keyName="brewery" label="Brewery" colors={colors} />
        </View>
      ) : null}

    </View>
  );
}

interface FactChipProps {
  label: string;
  value: string;
  colors: ReturnType<typeof useThemeColors>;
}

function FactChip({ label, value, colors }: FactChipProps) {
  return (
    <View
      className="FactChip rounded-lg px-3 py-2"
      style={{
        backgroundColor: colors.elevated,
        borderWidth: 1,
        borderColor: colors.borderSubtle,
      }}
    >
      <Text
        className="text-xs"
        style={{ color: colors.textTertiary, letterSpacing: 0.4 }}
      >
        {label}
      </Text>
      <Text className="text-base" style={{ color: colors.text, fontWeight: '600' }}>
        {value}
      </Text>
    </View>
  );
}

interface EducationFieldProps {
  data: Record<string, unknown>;
  keyName: string;
  label: string;
  colors: ReturnType<typeof useThemeColors>;
}

function EducationField({ data, keyName, label, colors }: EducationFieldProps) {
  const value = data[keyName];
  if (typeof value !== 'string' || !value.trim()) return null;
  return (
    <View className="flex-col gap-1">
      <Text
        className="text-xs uppercase"
        style={{ color: colors.textTertiary, letterSpacing: 1 }}
      >
        {label}
      </Text>
      <Text className="text-sm leading-5" style={{ color: colors.textSecondary }}>
        {value}
      </Text>
    </View>
  );
}

function EducationListField({ data, keyName, label, colors }: EducationFieldProps) {
  const raw = data[keyName];
  if (!Array.isArray(raw) || raw.length === 0) return null;
  const items = raw.filter((v): v is string => typeof v === 'string');
  if (items.length === 0) return null;
  return (
    <View className="flex-col gap-1">
      <Text
        className="text-xs uppercase"
        style={{ color: colors.textTertiary, letterSpacing: 1 }}
      >
        {label}
      </Text>
      <Text className="text-sm leading-5" style={{ color: colors.textSecondary }}>
        {items.join(', ')}
      </Text>
    </View>
  );
}
