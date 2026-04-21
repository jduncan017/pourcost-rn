/**
 * Invoice Review Screen — Mapping Confirmation
 *
 * After extraction, shows each line item with its auto-detected action:
 *   - Create (new ingredient)
 *   - Merge (add pack size to existing ingredient)
 *   - Update (update price on matching size)
 *   - Skip (non-product or user dismissed)
 *
 * User can change actions, pick different ingredients, then Apply.
 * After Apply, "Create" items go through the ingredient walkthrough.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useInvoicesStore } from '@/src/stores/invoices-store';
import { useIngredientsStore } from '@/src/stores/ingredients-store';
import { useThemeColors } from '@/src/contexts/ThemeContext';
import { FeedbackService } from '@/src/services/feedback-service';
import GradientBackground from '@/src/components/ui/GradientBackground';
import Button from '@/src/components/ui/Button';
import SearchBar from '@/src/components/ui/SearchBar';
import { buildMappings, type LineItemMapping, type MappingAction } from '@/src/services/invoice-mapping-service';
import { applyInvoicePriceUpdates, type PriceUpdateInput } from '@/src/services/cost-cascade-service';
import { updateInvoiceStatus } from '@/src/lib/invoice-data';
import { supabase } from '@/src/lib/supabase';
import { formatCurrency } from '@/src/services/calculation-service';
import { volumeLabel } from '@/src/types/models';

// ==========================================
// ACTION BADGE
// ==========================================

function ActionBadge({ action }: { action: MappingAction }) {
  const colors = useThemeColors();

  const config: Record<MappingAction, { label: string; color: string; bg: string; icon: keyof typeof Ionicons.glyphMap }> = {
    create: { label: 'Create', color: colors.gold, bg: colors.warningSubtle, icon: 'add-circle' },
    merge: { label: 'New Size', color: '#8B5CF6', bg: '#8B5CF620', icon: 'git-merge' },
    update: { label: 'Update', color: colors.success, bg: colors.successSubtle, icon: 'refresh-circle' },
    skip: { label: 'Skip', color: colors.textTertiary, bg: colors.border, icon: 'remove-circle-outline' },
  };

  const c = config[action];

  return (
    <View className="flex-row items-center gap-1 px-2 py-0.5 rounded-full" style={{ backgroundColor: c.bg }}>
      <Ionicons name={c.icon} size={12} color={c.color} />
      <Text style={{ color: c.color, fontSize: 11, fontWeight: '600' }}>{c.label}</Text>
    </View>
  );
}

// ==========================================
// MAPPING CARD
// ==========================================

function MappingCard({
  mapping,
  onChangeAction,
  onChangeIngredient,
}: {
  mapping: LineItemMapping;
  onChangeAction: (action: MappingAction) => void;
  onChangeIngredient: () => void;
}) {
  const colors = useThemeColors();
  const isLowConfidence = mapping.confidence > 0 && mapping.confidence < 0.85 && mapping.action !== 'create';

  const actionButtons: MappingAction[] = ['create', 'merge', 'update', 'skip'];

  return (
    <View
      className="MappingCard mx-4 mb-2.5 p-3.5 rounded-xl"
      style={{
        backgroundColor: colors.surface,
        borderLeftWidth: 3,
        borderLeftColor: isLowConfidence ? colors.warning : colors.border,
      }}
    >
      {/* Header: product name + action badge */}
      <View className="flex-row items-start justify-between">
        <View className="flex-1 mr-3">
          <Text className="text-sm font-semibold" style={{ color: colors.text }} numberOfLines={2}>
            {mapping.cleanName}
          </Text>
          <Text className="text-xs mt-0.5" style={{ color: colors.textTertiary }}>
            {volumeLabel(mapping.volume)}
            {mapping.packSize > 1 ? ` · ${mapping.packSize}-pack` : ''}
            {mapping.lineItem.sku ? ` · ${mapping.lineItem.sku}` : ''}
          </Text>
        </View>
        <View className="items-end gap-1">
          <Text className="text-sm font-semibold" style={{ color: colors.text }}>
            {formatCurrency(mapping.perBottlePrice)}/btl
          </Text>
          <ActionBadge action={mapping.action} />
        </View>
      </View>

      {/* Matched ingredient (for merge/update) */}
      {mapping.matchedIngredient && mapping.action !== 'create' && (
        <Pressable
          onPress={onChangeIngredient}
          className="flex-row items-center gap-1.5 mt-2 py-1.5 px-2.5 rounded-lg active:opacity-70"
          style={{ backgroundColor: colors.background }}
        >
          <Ionicons name="link" size={13} color={colors.success} />
          <Text className="flex-1 text-xs" style={{ color: colors.text }} numberOfLines={1}>
            {mapping.matchedIngredient.name}
          </Text>
          <Text className="text-xs" style={{ color: colors.textTertiary }}>
            {volumeLabel(mapping.matchedIngredient.productSize)} · {formatCurrency(mapping.matchedIngredient.productCost)}
          </Text>
          <Ionicons name="chevron-forward" size={12} color={colors.textTertiary} />
        </Pressable>
      )}

      {/* Low confidence warning */}
      {isLowConfidence && (
        <View className="flex-row items-center gap-1 mt-2">
          <Ionicons name="warning" size={12} color={colors.warning} />
          <Text className="text-xs" style={{ color: colors.warning }}>
            Low confidence match — verify this is correct
          </Text>
        </View>
      )}

      {/* Action selector */}
      <View className="flex-row items-center gap-1.5 mt-2.5">
        {actionButtons.map(a => {
          const isActive = mapping.action === a;
          // Only show merge/update if there's a matched ingredient (or they can switch to create/skip)
          if ((a === 'merge' || a === 'update') && !mapping.matchedIngredient && mapping.action !== a) return null;

          return (
            <Pressable
              key={a}
              onPress={() => onChangeAction(a)}
              className="px-2.5 py-1 rounded-md"
              style={{
                backgroundColor: isActive ? colors.gold + '25' : colors.background,
                borderWidth: isActive ? 1 : 0.5,
                borderColor: isActive ? colors.gold : colors.border,
              }}
            >
              <Text style={{
                fontSize: 11,
                fontWeight: isActive ? '600' : '400',
                color: isActive ? colors.gold : colors.textSecondary,
              }}>
                {a === 'create' ? 'Create' : a === 'merge' ? 'New Size' : a === 'update' ? 'Update' : 'Skip'}
              </Text>
            </Pressable>
          );
        })}

        <View className="flex-1" />

        {/* Change ingredient button (for merge/update) */}
        {mapping.action !== 'create' && mapping.action !== 'skip' && (
          <Pressable onPress={onChangeIngredient} hitSlop={8}>
            <Ionicons name="swap-horizontal" size={16} color={colors.textTertiary} />
          </Pressable>
        )}
      </View>
    </View>
  );
}

// ==========================================
// INGREDIENT SEARCH PANEL
// ==========================================

function IngredientSearchPanel({
  onSelect,
  onCancel,
}: {
  onSelect: (ingredientId: string) => void;
  onCancel: () => void;
}) {
  const colors = useThemeColors();
  const { ingredients } = useIngredientsStore();
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    if (!query) return ingredients.slice(0, 20);
    const q = query.toLowerCase();
    return ingredients.filter(i => i.name.toLowerCase().includes(q)).slice(0, 20);
  }, [query, ingredients]);

  return (
    <View className="IngredientSearch mx-4 mb-4 rounded-2xl overflow-hidden" style={{ backgroundColor: colors.surface }}>
      <View className="p-3">
        <SearchBar
          placeholder="Search ingredients..."
          value={query}
          onChangeText={setQuery}
          autoFocus
        />
      </View>
      <FlatList
        data={filtered}
        keyExtractor={i => i.id}
        style={{ maxHeight: 200 }}
        renderItem={({ item: ing }) => (
          <Pressable
            onPress={() => onSelect(ing.id)}
            className="flex-row items-center justify-between px-4 py-3 active:opacity-70"
            style={{ borderTopWidth: 0.5, borderTopColor: colors.border }}
          >
            <View className="flex-1">
              <Text className="text-sm" style={{ color: colors.text }}>{ing.name}</Text>
              <Text className="text-xs" style={{ color: colors.textTertiary }}>
                {ing.type} · {volumeLabel(ing.productSize)} · {formatCurrency(ing.productCost)}
              </Text>
            </View>
            <Ionicons name="add-circle-outline" size={20} color={colors.gold} />
          </Pressable>
        )}
        ListEmptyComponent={
          <View className="p-4 items-center">
            <Text className="text-sm" style={{ color: colors.textSecondary }}>No ingredients found</Text>
          </View>
        }
      />
      <Pressable
        onPress={onCancel}
        className="p-3 items-center"
        style={{ borderTopWidth: 0.5, borderTopColor: colors.border }}
      >
        <Text style={{ color: colors.textSecondary, fontSize: 13 }}>Cancel</Text>
      </Pressable>
    </View>
  );
}

// ==========================================
// MAIN SCREEN
// ==========================================

export default function InvoiceReviewScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const colors = useThemeColors();

  const { getInvoiceById, loadLineItems, getLineItemsForInvoice } = useInvoicesStore();
  const { ingredients } = useIngredientsStore();

  const [isLoading, setIsLoading] = useState(true);
  const [isApplying, setIsApplying] = useState(false);
  const [mappings, setMappings] = useState<LineItemMapping[]>([]);
  const [searchingForIndex, setSearchingForIndex] = useState<number | null>(null);

  const invoice = id ? getInvoiceById(id) : undefined;

  // Load line items and build mappings
  useEffect(() => {
    if (!id) return;
    (async () => {
      const items = await loadLineItems(id);
      if (items.length === 0) {
        setIsLoading(false);
        return;
      }

      // Get user ID
      const { data: inv } = await supabase
        .from('invoices')
        .select('user_id')
        .eq('id', id)
        .single();

      if (inv) {
        const m = await buildMappings(items, inv.user_id);
        setMappings(m);
      }
      setIsLoading(false);
    })();
  }, [id]);

  // Counts
  const counts = useMemo(() => {
    const c = { create: 0, merge: 0, update: 0, skip: 0 };
    for (const m of mappings) c[m.action]++;
    return c;
  }, [mappings]);

  // Handlers
  const handleChangeAction = useCallback((index: number, action: MappingAction) => {
    setMappings(prev => prev.map((m, i) => i === index ? { ...m, action } : m));
  }, []);

  const handleChangeIngredient = useCallback((index: number) => {
    setSearchingForIndex(index);
  }, []);

  const handleSelectIngredient = useCallback((ingredientId: string) => {
    if (searchingForIndex === null) return;
    const ing = ingredients.find(i => i.id === ingredientId);
    if (!ing) return;

    setMappings(prev => prev.map((m, i) => {
      if (i !== searchingForIndex) return m;
      // Determine if it's merge or update based on size match
      const extractedOz = require('@/src/types/models').volumeToOunces(m.volume);
      const ingOz = require('@/src/types/models').volumeToOunces(ing.productSize);
      const sameSize = Math.abs(extractedOz - ingOz) < 0.5;
      return {
        ...m,
        matchedIngredient: ing,
        action: sameSize ? 'update' : 'merge',
      };
    }));
    setSearchingForIndex(null);
  }, [searchingForIndex, ingredients]);

  const handleApply = useCallback(async () => {
    if (!id) return;

    const createItems = mappings.filter(m => m.action === 'create');
    const mergeItems = mappings.filter(m => m.action === 'merge');
    const updateItems = mappings.filter(m => m.action === 'update');

    const description = [
      createItems.length > 0 ? `Create ${createItems.length} new ingredient${createItems.length > 1 ? 's' : ''}` : null,
      mergeItems.length > 0 ? `Add ${mergeItems.length} new size${mergeItems.length > 1 ? 's' : ''}` : null,
      updateItems.length > 0 ? `Update ${updateItems.length} price${updateItems.length > 1 ? 's' : ''}` : null,
    ].filter(Boolean).join(', ');

    Alert.alert(
      'Apply Invoice',
      description + '.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Apply',
          onPress: async () => {
            setIsApplying(true);
            try {
              // Handle Merge and Update items
              const priceUpdates: PriceUpdateInput[] = [];

              for (const m of [...mergeItems, ...updateItems]) {
                if (!m.matchedIngredient) continue;
                priceUpdates.push({
                  ingredientId: m.matchedIngredient.id,
                  newProductCost: m.perBottlePrice,
                  newProductSize: m.volume,
                  packSize: m.packSize > 1 ? m.packSize : undefined,
                  invoiceLineItemId: m.lineItem.id,
                  invoiceId: id,
                });
              }

              if (priceUpdates.length > 0) {
                await applyInvoicePriceUpdates(priceUpdates);
              }

              // If there are Create items, navigate to walkthrough
              if (createItems.length > 0) {
                // Store create items in params for the walkthrough
                router.push({
                  pathname: '/invoice-ingredient-setup' as any,
                  params: {
                    invoiceId: id,
                    items: JSON.stringify(createItems.map(m => ({
                      lineItemId: m.lineItem.id,
                      name: m.cleanName,
                      volume: m.volume,
                      packSize: m.packSize,
                      perBottlePrice: m.perBottlePrice,
                      category: m.category,
                      subcategory: m.subcategory,
                      sku: m.lineItem.sku,
                    }))),
                  },
                });
              } else {
                // No creates — mark invoice complete
                await updateInvoiceStatus(id, 'complete', {
                  matchedItems: mergeItems.length + updateItems.length,
                });
                await useIngredientsStore.getState().loadIngredients(true);
                FeedbackService.showSuccess('Applied', `${priceUpdates.length} prices updated`);
                router.replace('/(drawer)/invoices' as any);
              }
            } catch (err) {
              const msg = err instanceof Error ? err.message : 'Failed to apply';
              FeedbackService.showError('Error', msg);
            } finally {
              setIsApplying(false);
            }
          },
        },
      ],
    );
  }, [id, mappings, router]);

  // Render
  if (isLoading) {
    return (
      <GradientBackground>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={colors.gold} />
          <Text className="mt-3 text-sm" style={{ color: colors.textSecondary }}>
            Analyzing line items...
          </Text>
        </View>
      </GradientBackground>
    );
  }

  return (
    <GradientBackground>
      {/* Summary bar */}
      <View className="ReviewSummary px-4 py-3" style={{ borderBottomWidth: 0.5, borderBottomColor: colors.border }}>
        <Text className="text-lg font-bold" style={{ color: colors.text }}>
          {invoice?.distributorName ?? 'Review Invoice'}
        </Text>
        <View className="flex-row items-center gap-3 mt-1.5">
          {counts.create > 0 && (
            <Text className="text-xs" style={{ color: colors.gold }}>{counts.create} new</Text>
          )}
          {counts.merge > 0 && (
            <Text className="text-xs" style={{ color: '#8B5CF6' }}>{counts.merge} new sizes</Text>
          )}
          {counts.update > 0 && (
            <Text className="text-xs" style={{ color: colors.success }}>{counts.update} updates</Text>
          )}
          {counts.skip > 0 && (
            <Text className="text-xs" style={{ color: colors.textTertiary }}>{counts.skip} skipped</Text>
          )}
        </View>
      </View>

      {/* Ingredient search panel */}
      {searchingForIndex !== null && (
        <IngredientSearchPanel
          onSelect={handleSelectIngredient}
          onCancel={() => setSearchingForIndex(null)}
        />
      )}

      {/* Mapping cards */}
      <FlatList
        data={mappings}
        keyExtractor={(_, i) => String(i)}
        contentContainerStyle={{ paddingTop: 12, paddingBottom: 120 }}
        renderItem={({ item: m, index }) => (
          <MappingCard
            mapping={m}
            onChangeAction={(action) => handleChangeAction(index, action)}
            onChangeIngredient={() => handleChangeIngredient(index)}
          />
        )}
      />

      {/* Bottom action bar */}
      <View
        className="absolute bottom-0 left-0 right-0 px-4 pb-8 pt-4"
        style={{ backgroundColor: colors.background + 'E0' }}
      >
        <Button
          onPress={handleApply}
          variant="primary"
          loading={isApplying}
          disabled={isApplying || mappings.every(m => m.action === 'skip')}
        >
          {counts.create > 0
            ? `Continue (${counts.create} to set up)`
            : `Apply (${counts.merge + counts.update} items)`}
        </Button>
      </View>
    </GradientBackground>
  );
}
