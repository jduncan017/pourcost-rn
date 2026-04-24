/**
 * Invoice Ingredient Setup — Walkthrough
 *
 * After the mapping screen, walks the user through creating each new
 * ingredient one by one. Styled to match the ingredient form.
 *
 * Shows: name, type, volume, cost breakdown, suggested retail (rounded up),
 * retail price input with live pour cost meter.
 *
 * Save & Next → (or Save for the last item) creates the ingredient and
 * moves to the next one.
 */

import { useState, useCallback, useLayoutEffect, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useNavigation } from 'expo-router';
import { useGuardedRouter } from '@/src/lib/guarded-router';
import { useIngredientsStore } from '@/src/stores/ingredients-store';
import { useAppStore } from '@/src/stores/app-store';
import { useThemeColors } from '@/src/contexts/ThemeContext';
import { supabase } from '@/src/lib/supabase';
import { updateInvoiceStatus } from '@/src/lib/invoice-data';
import { FeedbackService } from '@/src/services/feedback-service';
import GradientBackground from '@/src/components/ui/GradientBackground';
import TextInput from '@/src/components/ui/TextInput';
import Button from '@/src/components/ui/Button';
import Card from '@/src/components/ui/Card';
import MetricRow from '@/src/components/ui/MetricRow';
import ScreenTitle from '@/src/components/ui/ScreenTitle';
import AiSuggestionRow from '@/src/components/ui/AiSuggestionRow';
import PourCostHero from '@/src/components/PourCostHero';
import ChipSelector from '@/src/components/ui/ChipSelector';
import {
  SUBTYPES_BY_TYPE,
  type IngredientType,
} from '@/src/constants/appConstants';
import { type Volume, volumeLabel } from '@/src/types/models';
import {
  calculateCostPerOz,
  calculateCostPerPour,
  calculateSuggestedPrice,
  formatCurrency,
} from '@/src/services/calculation-service';

// ==========================================
// TYPES
// ==========================================

interface SetupItem {
  lineItemId: string;
  name: string;
  volume: Volume;
  packSize: number;
  perBottlePrice: number;
  category: string | null;
  subcategory: string | null;
  sku: string | null;
}

// ==========================================
// MAIN SCREEN
// ==========================================

export default function InvoiceIngredientSetupScreen() {
  const router = useGuardedRouter();
  const navigation = useNavigation();
  const colors = useThemeColors();
  const { addIngredient } = useIngredientsStore();
  const { defaultPourSize, pourCostGoal } = useAppStore();

  const params = useLocalSearchParams<{ invoiceId: string; items: string }>();
  const invoiceId = params.invoiceId;

  const items: SetupItem[] = useMemo(() => {
    try {
      return JSON.parse(params.items ?? '[]');
    } catch {
      return [];
    }
  }, [params.items]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isSaving, setIsSaving] = useState(false);

  const item = items[currentIndex];
  const isLast = currentIndex === items.length - 1;
  const total = items.length;

  // Form state for current item
  const [name, setName] = useState(item?.name ?? '');
  const [ingredientType, setIngredientType] = useState<IngredientType>(
    (item?.category as IngredientType) ?? 'Spirit'
  );
  const [subType, setSubType] = useState(item?.subcategory ?? '');
  const [retailPriceText, setRetailPriceText] = useState(() => {
    if (!item) return '8.00';
    // Default to suggested retail rounded up to nearest dollar
    const pourSizeVol: Volume = defaultPourSize;
    const costPerPour = calculateCostPerPour(item.volume, item.perBottlePrice, pourSizeVol);
    const suggested = calculateSuggestedPrice(costPerPour, 0.2);
    const rounded = Math.ceil(suggested);
    return rounded > 0 ? String(rounded) : '8.00';
  });

  // Reset form state when index changes
  const resetFormForIndex = useCallback((idx: number) => {
    const itm = items[idx];
    if (!itm) return;
    setName(itm.name);
    setIngredientType((itm.category as IngredientType) ?? 'Spirit');
    setSubType(itm.subcategory ?? '');

    const pourSizeVol: Volume = defaultPourSize;
    const costPerPour = calculateCostPerPour(itm.volume, itm.perBottlePrice, pourSizeVol);
    const suggested = calculateSuggestedPrice(costPerPour, 0.2);
    const rounded = Math.ceil(suggested);
    setRetailPriceText(rounded > 0 ? String(rounded) : '8.00');
  }, [items, defaultPourSize]);

  // Header
  useLayoutEffect(() => {
    navigation.setOptions({
      title: `New Ingredient (${currentIndex + 1}/${total})`,
    });
  }, [currentIndex, total, navigation]);

  if (!item) {
    return (
      <GradientBackground>
        <View className="flex-1 items-center justify-center">
          <Text style={{ color: colors.text }}>No items to set up</Text>
        </View>
      </GradientBackground>
    );
  }

  // Calculations
  const retailPrice = parseFloat(retailPriceText) || 0;
  const pourSizeVolume: Volume = defaultPourSize;
  const costPerOz = calculateCostPerOz(item.volume, item.perBottlePrice);
  const costPerPour = calculateCostPerPour(item.volume, item.perBottlePrice, pourSizeVolume);
  const pourCostPercentage = retailPrice > 0 ? (costPerPour / retailPrice) * 100 : 0;
  const suggestedRetail = calculateSuggestedPrice(costPerPour, 0.2);
  const pourCostMargin = retailPrice - costPerPour;

  const subtypes = SUBTYPES_BY_TYPE[ingredientType] ?? [];

  const handleSave = useCallback(async () => {
    if (!name.trim()) {
      Alert.alert('Name Required', 'Please enter an ingredient name.');
      return;
    }

    setIsSaving(true);
    try {
      // Create the ingredient
      const newIngredient = await addIngredient({
        name: name.trim(),
        productSize: item.volume,
        productCost: item.perBottlePrice,
        retailPrice: retailPrice > 0 ? retailPrice : undefined,
        pourSize: pourSizeVolume,
        type: ingredientType,
        subType: subtypes.length > 0 ? subType || undefined : undefined,
      });

      // Create initial ingredient_configuration from invoice data
      const packSize = item.packSize ?? 1;
      await supabase
        .from('ingredient_configurations')
        .insert({
          ingredient_id: newIngredient.id,
          product_size: item.volume,
          product_cost: item.perBottlePrice,
          pack_size: packSize,
          pack_cost: Math.round(packSize * item.perBottlePrice * 100) / 100,
          is_default: true,
          source: 'invoice',
          last_updated_price_at: new Date().toISOString(),
        });

      // Link line item to the new ingredient
      await supabase
        .from('invoice_line_items')
        .update({
          matched_ingredient_id: newIngredient.id,
          match_status: 'confirmed',
          match_method: 'manual',
          match_confidence: 1.0,
        })
        .eq('id', item.lineItemId);

      if (isLast) {
        // All done — mark invoice complete
        if (invoiceId) {
          await updateInvoiceStatus(invoiceId, 'complete', {
            matchedItems: total,
          });
        }
        FeedbackService.showSuccess(
          'All Set!',
          `${total} ingredient${total > 1 ? 's' : ''} created from invoice`
        );
        router.replace('/(drawer)/invoices' as any);
      } else {
        // Move to next item
        const nextIndex = currentIndex + 1;
        setCurrentIndex(nextIndex);
        resetFormForIndex(nextIndex);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to save';
      Alert.alert('Error', msg);
    } finally {
      setIsSaving(false);
    }
  }, [name, item, retailPrice, ingredientType, subType, isLast, currentIndex, invoiceId, total, router, addIngredient, resetFormForIndex, pourSizeVolume, subtypes]);

  // Type chips
  const typeOptions = ['Spirit', 'Wine', 'Beer', 'Mixer', 'Other'];

  return (
    <GradientBackground>
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          className="flex-1"
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: 120 }}
        >
          <View className="px-6 pt-4 pb-6 flex-col gap-6">

            {/* Progress indicator */}
            <View className="flex-row items-center gap-2">
              {items.map((_, i) => (
                <View
                  key={i}
                  className="flex-1 h-1 rounded-full"
                  style={{
                    backgroundColor: i <= currentIndex ? colors.gold : colors.border,
                  }}
                />
              ))}
            </View>

            {/* Name */}
            <View style={{ borderBottomWidth: 1, borderBottomColor: colors.border, paddingBottom: 4 }}>
              <ScreenTitle title="NAME & TYPE" variant="group" />
            </View>

            <View className="flex-col gap-5">
              <TextInput
                label="Ingredient Name *"
                value={name}
                onChangeText={setName}
                placeholder="e.g., Espolon Tequila Reposado"
              />

              <View>
                <Text className="text-sm mb-2" style={{ color: colors.textSecondary }}>Type</Text>
                <ChipSelector
                  options={typeOptions}
                  selectedOption={ingredientType}
                  onSelectionChange={(val) => {
                    setIngredientType(val as IngredientType);
                    setSubType('');
                  }}
                  variant="compact"
                />
              </View>

              {subtypes.length > 0 && (
                <View>
                  <Text className="text-sm mb-2" style={{ color: colors.textSecondary }}>Subcategory</Text>
                  <ChipSelector
                    options={subtypes}
                    selectedOption={subType}
                    onSelectionChange={setSubType}
                    variant="compact"
                  />
                </View>
              )}
            </View>

            {/* Product details */}
            <View style={{ borderBottomWidth: 1, borderBottomColor: colors.border, paddingBottom: 4 }}>
              <ScreenTitle title="FROM INVOICE" variant="group" />
            </View>

            <Card displayClasses="flex flex-col gap-3" padding="medium">
              <MetricRow label="Bottle Size:" value={volumeLabel(item.volume)} />
              {item.packSize > 1 && (
                <MetricRow label="Pack Size:" value={`${item.packSize}-pack case`} />
              )}
              <MetricRow label="Cost / Bottle:" value={formatCurrency(item.perBottlePrice)} />
              {item.sku && (
                <MetricRow label="SKU:" value={item.sku} />
              )}
            </Card>

            {/* Pricing & Cost Analysis */}
            <View style={{ borderBottomWidth: 1, borderBottomColor: colors.border, paddingBottom: 4 }}>
              <ScreenTitle title="PRICING & COST ANALYSIS" variant="group" />
            </View>

            <Card displayClasses="flex flex-col gap-6" padding="large">
              <TextInput
                label="Retail Price *"
                value={retailPriceText}
                onChangeText={(text) => {
                  if (text === '' || /^\d*\.?\d*$/.test(text)) {
                    setRetailPriceText(text);
                  }
                }}
                placeholder="0.00"
                keyboardType="decimal-pad"
                prefix="$"
              />

              <AiSuggestionRow
                label="Suggested Retail"
                value={formatCurrency(suggestedRetail)}
              />

              {/* Bleed Hero to card edges — Hero paints its own top/bottom hairlines. */}
              <View className="-mx-6">
                <PourCostHero pourCostPercentage={pourCostPercentage} />
              </View>

              <Text className="text-lg mb-2" style={{ color: colors.textSecondary, fontWeight: '500' }}>
                Cost Analysis
              </Text>

              <MetricRow label="Cost / Oz:" value={`$${costPerOz.toFixed(3)}`} />
              <MetricRow label="Cost / Pour:" value={formatCurrency(costPerPour)} />
              <MetricRow label="Margin:" value={formatCurrency(pourCostMargin)} />
            </Card>
          </View>
        </ScrollView>

        {/* Bottom action */}
        <View
          className="absolute bottom-0 left-0 right-0 px-4 pb-8 pt-4"
          style={{ backgroundColor: colors.background + 'E0' }}
        >
          <Button
            variant="primary"
            onPress={handleSave}
            loading={isSaving}
            disabled={isSaving || !name.trim()}
            icon={isLast ? undefined : 'arrow-forward'}
            iconPosition="right"
          >
            {isSaving
              ? 'Saving...'
              : isLast
                ? 'Save'
                : 'Save & Next'}
          </Button>
        </View>
      </KeyboardAvoidingView>
    </GradientBackground>
  );
}
