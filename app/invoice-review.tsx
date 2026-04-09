/**
 * Invoice Review Screen
 *
 * Displays extracted line items in three groups:
 *   - Auto-matched (green) — high confidence, pre-confirmed
 *   - Needs confirmation (yellow) — medium confidence, user picks from suggestions
 *   - Unmatched (red) — no match, user searches or creates ingredient
 *
 * After review, triggers the cost cascade to update prices.
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
import { confirmAndApplyInvoice } from '@/src/services/invoice-pipeline-service';
import { FeedbackService } from '@/src/services/feedback-service';
import GradientBackground from '@/src/components/ui/GradientBackground';
import Button from '@/src/components/ui/Button';
import SearchBar from '@/src/components/ui/SearchBar';
import type { InvoiceLineItem, MatchStatus } from '@/src/types/invoice-models';
import { formatCurrency } from '@/src/services/calculation-service';
import { parseVolumeFromBpc } from '@/src/services/product-normalization-service';
import { volumeLabel } from '@/src/types/models';

// ==========================================
// GROUP HEADER
// ==========================================

function GroupHeader({
  title,
  count,
  color,
  icon,
}: {
  title: string;
  count: number;
  color: string;
  icon: keyof typeof Ionicons.glyphMap;
}) {
  const colors = useThemeColors();

  if (count === 0) return null;

  return (
    <View className="GroupHeader flex-row items-center gap-2 px-4 pt-5 pb-2">
      <Ionicons name={icon} size={18} color={color} />
      <Text className="text-base font-semibold flex-1" style={{ color: colors.text }}>
        {title}
      </Text>
      <View className="px-2 py-0.5 rounded-full" style={{ backgroundColor: color + '20' }}>
        <Text style={{ color, fontSize: 12, fontWeight: '700' }}>{count}</Text>
      </View>
    </View>
  );
}

// ==========================================
// LINE ITEM CARD
// ==========================================

function LineItemCard({
  item,
  onConfirm,
  onCorrect,
  onEdit,
  onSkip,
}: {
  item: InvoiceLineItem;
  onConfirm: () => void;
  onCorrect: () => void;
  onEdit: () => void;
  onSkip: () => void;
}) {
  const colors = useThemeColors();

  const statusConfig: Record<string, { borderColor: string; label: string }> = {
    auto_matched: { borderColor: colors.success, label: 'Auto-matched' },
    confirmed: { borderColor: colors.success, label: 'Confirmed' },
    corrected: { borderColor: colors.success, label: 'Corrected' },
    unmatched: { borderColor: colors.error, label: 'No match' },
    skipped: { borderColor: colors.textTertiary, label: 'Skipped' },
    credit: { borderColor: colors.warning, label: 'Credit' },
  };

  const isYellow = item.matchStatus === 'auto_matched' && (item.matchConfidence ?? 0) < 0.85;
  const config = isYellow
    ? { borderColor: colors.warning, label: 'Needs review' }
    : statusConfig[item.matchStatus] ?? statusConfig.unmatched;

  // Price display: show per-bottle price with context
  const packSize = item.packSize ?? 1;
  const qty = Number(item.quantity) || 1;
  const totalPrice = Number(item.totalPrice) || 0;
  const perBottle = packSize > 1 && qty > 0
    ? totalPrice / (qty * packSize)
    : (item.unitPrice ? Number(item.unitPrice) : totalPrice / qty);

  // Parse bottle volume from BPC in raw_text
  let bottleLabel: string | null = null;
  if (item.rawText) {
    const bpcMatch = item.rawText.match(/BPC:\s*(.+?)(?:\s+\d|$)/i);
    if (bpcMatch) {
      const parsed = parseVolumeFromBpc(bpcMatch[1]);
      if (parsed.volume) {
        bottleLabel = volumeLabel(parsed.volume);
      }
    }
  }

  const isActionable = item.matchStatus !== 'confirmed' &&
    item.matchStatus !== 'corrected' &&
    item.matchStatus !== 'skipped' &&
    item.matchStatus !== 'credit';

  return (
    <View
      className="LineItemCard mx-4 mb-2 p-3 rounded-xl"
      style={{
        backgroundColor: colors.surface,
        borderLeftWidth: 3,
        borderLeftColor: config.borderColor,
      }}
    >
      {/* Product info */}
      <View className="flex-row items-start justify-between">
        <View className="flex-1 gap-0.5 mr-3">
          <Text className="text-sm font-semibold" style={{ color: colors.text }} numberOfLines={2}>
            {item.productName ?? 'Unknown Product'}
          </Text>
          <Text className="text-xs" style={{ color: colors.textTertiary }}>
            {[
              bottleLabel,
              packSize > 1 ? `${packSize}-pack` : null,
              item.sku ? `SKU: ${item.sku}` : null,
            ].filter(Boolean).join(' · ')}
          </Text>
        </View>
        <View className="items-end gap-0.5">
          <Text className="text-sm font-semibold" style={{ color: colors.text }}>
            {formatCurrency(perBottle)}/{bottleLabel ? 'btl' : 'ea'}
          </Text>
          <Text className="text-xs" style={{ color: colors.textSecondary }}>
            {qty > 1 || packSize > 1
              ? `${qty}× ${packSize > 1 ? `${packSize}pk` : ''} = ${formatCurrency(totalPrice)}`
              : formatCurrency(totalPrice)}
          </Text>
        </View>
      </View>

      {/* Match info */}
      {item.matchedIngredientName && (
        <View className="flex-row items-center gap-1 mt-2">
          <Ionicons name="link-outline" size={13} color={colors.success} />
          <Text className="text-xs flex-1" style={{ color: colors.success }} numberOfLines={1}>
            → {item.matchedIngredientName}
          </Text>
          {item.matchConfidence != null && (
            <Text className="text-xs" style={{ color: colors.textTertiary }}>
              {Math.round(item.matchConfidence * 100)}%
            </Text>
          )}
        </View>
      )}

      {/* Action buttons */}
      {isActionable && (
        <View className="flex-row items-center gap-2 mt-2.5">
          {item.matchedIngredientId && (
            <Pressable
              onPress={onConfirm}
              className="flex-row items-center gap-1 px-3 py-1.5 rounded-lg"
              style={{ backgroundColor: colors.success + '20' }}
            >
              <Ionicons name="checkmark" size={14} color={colors.success} />
              <Text style={{ color: colors.success, fontSize: 12, fontWeight: '600' }}>Confirm</Text>
            </Pressable>
          )}

          <Pressable
            onPress={onCorrect}
            className="flex-row items-center gap-1 px-3 py-1.5 rounded-lg"
            style={{ backgroundColor: colors.gold + '20' }}
          >
            <Ionicons name="search" size={14} color={colors.gold} />
            <Text style={{ color: colors.gold, fontSize: 12, fontWeight: '600' }}>Match</Text>
          </Pressable>

          <Pressable
            onPress={onEdit}
            className="flex-row items-center gap-1 px-3 py-1.5 rounded-lg"
            style={{ backgroundColor: colors.border }}
          >
            <Ionicons name="create-outline" size={14} color={colors.textSecondary} />
            <Text style={{ color: colors.textSecondary, fontSize: 12 }}>Edit</Text>
          </Pressable>

          <View className="flex-1" />

          <Pressable onPress={onSkip} className="px-2 py-1.5" hitSlop={8}>
            <Text style={{ color: colors.textTertiary, fontSize: 12 }}>Skip</Text>
          </Pressable>
        </View>
      )}

      {/* Already handled */}
      {!isActionable && (
        <View className="flex-row items-center justify-between mt-2">
          <View className="flex-row items-center gap-1">
            <Ionicons
              name={item.matchStatus === 'skipped' ? 'remove-circle-outline' : 'checkmark-circle'}
              size={14}
              color={config.borderColor}
            />
            <Text className="text-xs" style={{ color: config.borderColor }}>
              {config.label}
            </Text>
          </View>
          <Pressable onPress={onEdit} hitSlop={8}>
            <Ionicons name="create-outline" size={14} color={colors.textTertiary} />
          </Pressable>
        </View>
      )}
    </View>
  );
}

// ==========================================
// INGREDIENT SEARCH MODAL (inline)
// ==========================================

function IngredientSearchPanel({
  onSelect,
  onCancel,
}: {
  onSelect: (ingredientId: string, ingredientName: string) => void;
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
            onPress={() => onSelect(ing.id, ing.name)}
            className="flex-row items-center justify-between px-4 py-3 active:opacity-70"
            style={{ borderTopWidth: 0.5, borderTopColor: colors.border }}
          >
            <View className="flex-1">
              <Text className="text-sm" style={{ color: colors.text }}>{ing.name}</Text>
              <Text className="text-xs" style={{ color: colors.textTertiary }}>{ing.type}</Text>
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

  const {
    getInvoiceById,
    loadLineItems,
    getLineItemsForInvoice,
    confirmLineItemMatch,
    skipLineItem,
  } = useInvoicesStore();

  const [isLoading, setIsLoading] = useState(true);
  const [isApplying, setIsApplying] = useState(false);
  const [searchingForItemId, setSearchingForItemId] = useState<string | null>(null);

  const invoice = id ? getInvoiceById(id) : undefined;
  const lineItems = id ? getLineItemsForInvoice(id) : undefined;

  // Load line items on mount
  useEffect(() => {
    if (!id) return;
    loadLineItems(id).finally(() => setIsLoading(false));
  }, [id]);

  // Group line items
  const groups = useMemo(() => {
    if (!lineItems) return { green: [], yellow: [], red: [], other: [] };

    const green: InvoiceLineItem[] = [];
    const yellow: InvoiceLineItem[] = [];
    const red: InvoiceLineItem[] = [];
    const other: InvoiceLineItem[] = [];

    for (const item of lineItems) {
      if (item.matchStatus === 'confirmed' || item.matchStatus === 'corrected') {
        green.push(item);
      } else if (item.matchStatus === 'auto_matched' && (item.matchConfidence ?? 0) >= 0.85) {
        green.push(item);
      } else if (item.matchStatus === 'auto_matched' || (item.matchConfidence ?? 0) >= 0.6) {
        yellow.push(item);
      } else if (item.matchStatus === 'skipped' || item.matchStatus === 'credit') {
        other.push(item);
      } else {
        red.push(item);
      }
    }

    return { green, yellow, red, other };
  }, [lineItems]);

  const allReviewed = groups.yellow.length === 0 && groups.red.length === 0;

  // Handlers
  const handleConfirm = useCallback(async (item: InvoiceLineItem) => {
    if (!item.matchedIngredientId) return;
    await confirmLineItemMatch({
      lineItemId: item.id,
      ingredientId: item.matchedIngredientId,
      matchStatus: 'confirmed',
      matchMethod: item.matchMethod,
      matchConfidence: item.matchConfidence,
    });
  }, [confirmLineItemMatch]);

  const handleCorrect = useCallback((itemId: string) => {
    setSearchingForItemId(itemId);
  }, []);

  const handleSelectIngredient = useCallback(async (ingredientId: string, ingredientName: string) => {
    if (!searchingForItemId) return;
    await confirmLineItemMatch({
      lineItemId: searchingForItemId,
      ingredientId,
      matchStatus: 'corrected',
      matchMethod: 'manual',
      matchConfidence: 1.0,
    });
    setSearchingForItemId(null);
  }, [searchingForItemId, confirmLineItemMatch]);

  const handleEdit = useCallback((item: InvoiceLineItem) => {
    router.push({
      pathname: '/invoice-line-edit' as any,
      params: {
        lineItemId: item.id,
        invoiceId: id,
        productName: item.productName ?? '',
        sku: item.sku ?? '',
        quantity: String(item.quantity ?? 1),
        unit: item.unit ?? 'each',
        unitPrice: String(item.unitPrice ?? ''),
        totalPrice: String(item.totalPrice ?? ''),
        packSize: String(item.packSize ?? 1),
      },
    });
  }, [router, id]);

  const handleSkip = useCallback(async (itemId: string) => {
    await skipLineItem(itemId);
  }, [skipLineItem]);

  const handleApplyAll = useCallback(async () => {
    if (!id) return;

    Alert.alert(
      'Apply Price Updates',
      'This will update ingredient prices from this invoice and recalculate all affected cocktail costs.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Apply',
          onPress: async () => {
            setIsApplying(true);
            try {
              const result = await confirmAndApplyInvoice(id);

              const { significantChanges, ingredientsUpdated, cocktailIngredientsUpdated } =
                result.cascadeResult;

              let message = `${ingredientsUpdated.length} ingredients updated`;
              if (cocktailIngredientsUpdated > 0) {
                message += `, ${cocktailIngredientsUpdated} cocktails recalculated`;
              }

              if (significantChanges.length > 0) {
                const changes = significantChanges
                  .map(c => `${c.ingredientName}: ${c.changePct > 0 ? '+' : ''}${c.changePct}%`)
                  .join('\n');
                message += `\n\nSignificant price changes:\n${changes}`;
              }

              FeedbackService.showSuccess('Prices Updated', message);
              router.replace('/(drawer)/invoices' as any);
            } catch (err) {
              const msg = err instanceof Error ? err.message : 'Failed to apply updates';
              FeedbackService.showError('Update Failed', msg);
            } finally {
              setIsApplying(false);
            }
          },
        },
      ],
    );
  }, [id, router]);

  // Render
  if (isLoading) {
    return (
      <GradientBackground>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={colors.gold} />
          <Text className="mt-3 text-sm" style={{ color: colors.textSecondary }}>
            Loading line items...
          </Text>
        </View>
      </GradientBackground>
    );
  }

  // Build flat list data with section separators
  type ListItem =
    | { type: 'header'; key: string; title: string; count: number; color: string; icon: keyof typeof Ionicons.glyphMap }
    | { type: 'item'; key: string; item: InvoiceLineItem }
    | { type: 'search'; key: string };

  const listData: ListItem[] = [];

  if (groups.yellow.length > 0) {
    listData.push({ type: 'header', key: 'h-yellow', title: 'Needs Confirmation', count: groups.yellow.length, color: colors.warning, icon: 'help-circle' });
    groups.yellow.forEach(item => listData.push({ type: 'item', key: item.id, item }));
  }

  if (groups.red.length > 0) {
    listData.push({ type: 'header', key: 'h-red', title: 'Unmatched', count: groups.red.length, color: colors.error, icon: 'close-circle' });
    groups.red.forEach(item => listData.push({ type: 'item', key: item.id, item }));
  }

  if (groups.green.length > 0) {
    listData.push({ type: 'header', key: 'h-green', title: 'Matched', count: groups.green.length, color: colors.success, icon: 'checkmark-circle' });
    groups.green.forEach(item => listData.push({ type: 'item', key: item.id, item }));
  }

  if (groups.other.length > 0) {
    listData.push({ type: 'header', key: 'h-other', title: 'Skipped / Credits', count: groups.other.length, color: colors.textTertiary, icon: 'remove-circle-outline' });
    groups.other.forEach(item => listData.push({ type: 'item', key: item.id, item }));
  }

  return (
    <GradientBackground>
      {/* Summary bar */}
      <View className="ReviewSummary flex-row items-center justify-between px-4 py-3" style={{ borderBottomWidth: 0.5, borderBottomColor: colors.border }}>
        <View>
          <Text className="text-lg font-bold" style={{ color: colors.text }}>
            {invoice?.distributorName ?? 'Invoice Review'}
          </Text>
          <Text className="text-xs" style={{ color: colors.textSecondary }}>
            {lineItems?.length ?? 0} items · {groups.green.length} matched
          </Text>
        </View>
        {invoice?.invoiceNumber && (
          <Text className="text-xs" style={{ color: colors.textTertiary }}>
            #{invoice.invoiceNumber}
          </Text>
        )}
      </View>

      {/* Ingredient search panel (shown when user taps "Match" / "Change") */}
      {searchingForItemId && (
        <IngredientSearchPanel
          onSelect={handleSelectIngredient}
          onCancel={() => setSearchingForItemId(null)}
        />
      )}

      {/* Line items list */}
      <FlatList
        data={listData}
        keyExtractor={d => d.key}
        contentContainerStyle={{ paddingBottom: 120 }}
        renderItem={({ item: d }) => {
          if (d.type === 'header') {
            return (
              <GroupHeader
                title={d.title}
                count={d.count}
                color={d.color}
                icon={d.icon}
              />
            );
          }
          if (d.type === 'item') {
            return (
              <LineItemCard
                item={d.item}
                onConfirm={() => handleConfirm(d.item)}
                onCorrect={() => handleCorrect(d.item.id)}
                onEdit={() => handleEdit(d.item)}
                onSkip={() => handleSkip(d.item.id)}
              />
            );
          }
          return null;
        }}
      />

      {/* Bottom action bar */}
      <View
        className="ReviewActions absolute bottom-0 left-0 right-0 px-4 pb-8 pt-4"
        style={{ backgroundColor: colors.background + 'E0' }}
      >
        <Button
          onPress={handleApplyAll}
          variant={allReviewed ? 'primary' : 'secondary'}
          loading={isApplying}
          disabled={isApplying}
        >
          {allReviewed
            ? 'Apply Price Updates'
            : `Apply (${groups.yellow.length + groups.red.length} items need review)`}
        </Button>
      </View>
    </GradientBackground>
  );
}
