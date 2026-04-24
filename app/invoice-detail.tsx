/**
 * Invoice Detail Screen
 *
 * Shows a processed invoice: image at top (tap to zoom), then each
 * line item as a gradient card. Cards are highlighted by change type:
 *   - Gold border  → new ingredient created from this scan
 *   - Blue border  → price updated on existing ingredient
 *   - Gray border  → skipped / credit line
 */

import { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Modal,
  Image,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { useGuardedRouter } from '@/src/lib/guarded-router';
import { Ionicons } from '@expo/vector-icons';
import { useInvoicesStore } from '@/src/stores/invoices-store';
import { useThemeColors } from '@/src/contexts/ThemeContext';
import { fetchLineItemsForInvoice, getInvoiceImageUrl } from '@/src/lib/invoice-data';
import GradientBackground from '@/src/components/ui/GradientBackground';
import { formatCurrency } from '@/src/services/calculation-service';
import { volumeLabel } from '@/src/types/models';
import { parseVolumeFromBpc } from '@/src/services/product-normalization-service';
import type { InvoiceLineItem } from '@/src/types/invoice-models';

// ==========================================
// TYPES
// ==========================================

type ChangeType = 'new' | 'price_update' | 'skipped' | 'credit' | 'unmatched';

function getChangeType(item: InvoiceLineItem): ChangeType {
  if (item.matchStatus === 'credit') return 'credit';
  if (item.matchStatus === 'skipped') return 'skipped';
  if (item.matchStatus === 'unmatched') return 'unmatched';
  if (item.matchMethod === 'manual' && item.matchedIngredientId) return 'new';
  return 'price_update';
}

// ==========================================
// FULLSCREEN IMAGE MODAL
// ==========================================

function ImageModal({
  visible,
  urls,
  onClose,
}: {
  visible: boolean;
  urls: string[];
  onClose: () => void;
}) {
  const [pageIndex, setPageIndex] = useState(0);
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} animationType="fade" statusBarTranslucent>
      <View className="flex-1 bg-black">
        <StatusBar barStyle="light-content" backgroundColor="black" />

        {/* Close button — pinned below the status bar using real safe-area insets */}
        <Pressable
          onPress={onClose}
          hitSlop={10}
          className="absolute z-10 w-10 h-10 rounded-full items-center justify-center"
          style={{
            top: insets.top + 12,
            right: 16,
            backgroundColor: 'rgba(255,255,255,0.15)',
          }}
        >
          <Ionicons name="close" size={22} color="white" />
        </Pressable>

        {/* Image */}
        <Image
          source={{ uri: urls[pageIndex] }}
          className="flex-1"
          resizeMode="contain"
        />

        {/* Page selector */}
        {urls.length > 1 && (
          <View
            className="flex-row items-center justify-center gap-3"
            style={{ paddingBottom: insets.bottom + 16, paddingTop: 16 }}
          >
            {urls.map((_, i) => (
              <Pressable key={i} onPress={() => setPageIndex(i)} hitSlop={8}>
                <View
                  className="w-2 h-2 rounded-full"
                  style={{
                    backgroundColor:
                      i === pageIndex ? 'white' : 'rgba(255,255,255,0.4)',
                  }}
                />
              </Pressable>
            ))}
          </View>
        )}
      </View>
    </Modal>
  );
}

// ==========================================
// LINE ITEM CARD
// ==========================================

function LineItemCard({ item }: { item: InvoiceLineItem }) {
  const colors = useThemeColors();
  const changeType = getChangeType(item);

  const borderColor = {
    new: colors.gold,
    price_update: '#60A5FA',
    skipped: colors.border,
    credit: colors.border,
    unmatched: colors.error,
  }[changeType];

  const badgeConfig = {
    new: { label: 'New Ingredient', color: colors.gold, bg: colors.warningSubtle },
    price_update: { label: 'Price Updated', color: '#60A5FA', bg: '#60A5FA20' },
    skipped: { label: 'Skipped', color: colors.textTertiary, bg: colors.border },
    credit: { label: 'Credit', color: colors.textTertiary, bg: colors.border },
    unmatched: { label: 'Unmatched', color: colors.error, bg: colors.errorSubtle },
  }[changeType];

  // Parse volume from raw_text BPC field
  let volumeDisplay = '';
  if (item.rawText) {
    const bpcMatch = item.rawText.match(/BPC:\s*(.+?)(?:\s+\d|$)/i);
    if (bpcMatch) {
      const parsed = parseVolumeFromBpc(bpcMatch[1]);
      if (parsed.volume) volumeDisplay = volumeLabel(parsed.volume);
    }
  }

  const qty = item.quantity ?? 1;
  const packSize = item.packSize ?? 1;
  const perBottle = item.unitPrice ?? 0;
  const lineTotal = item.totalPrice ?? (perBottle * qty);

  return (
    <View
      className="LineItemCard mx-4 mb-2.5 rounded-xl overflow-hidden"
      style={{
        backgroundColor: colors.surface,
        borderLeftWidth: 3,
        borderLeftColor: borderColor,
      }}
    >
      <View className="p-3.5">
        {/* Header: name + badge */}
        <View className="flex-row items-start justify-between gap-2">
          <Text
            className="flex-1 text-sm font-semibold"
            style={{ color: changeType === 'skipped' || changeType === 'credit' ? colors.textTertiary : colors.text }}
            numberOfLines={2}
          >
            {item.matchedIngredientName ?? item.productName ?? 'Unknown Product'}
          </Text>
          <View
            className="px-2 py-0.5 rounded-full shrink-0"
            style={{ backgroundColor: badgeConfig.bg }}
          >
            <Text style={{ color: badgeConfig.color, fontSize: 10, fontWeight: '600' }}>
              {badgeConfig.label}
            </Text>
          </View>
        </View>

        {/* Details row */}
        <View className="flex-row items-center justify-between mt-2">
          <Text className="text-xs" style={{ color: colors.textSecondary }}>
            {qty > 1 ? `${qty} × ` : ''}
            {packSize > 1 ? `${packSize}-pack` : volumeDisplay || '750ml'}
            {item.sku ? ` · ${item.sku}` : ''}
          </Text>

          <View className="flex-row items-center gap-2">
            {perBottle > 0 && (
              <Text className="text-xs" style={{ color: colors.textTertiary }}>
                {formatCurrency(perBottle)}/btl
              </Text>
            )}
            {lineTotal > 0 && (
              <Text className="text-sm font-semibold" style={{ color: colors.text }}>
                {formatCurrency(lineTotal)}
              </Text>
            )}
          </View>
        </View>
      </View>
    </View>
  );
}

// ==========================================
// MAIN SCREEN
// ==========================================

export default function InvoiceDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useGuardedRouter();
  const colors = useThemeColors();
  const { getInvoiceById } = useInvoicesStore();

  const [lineItems, setLineItems] = useState<InvoiceLineItem[]>([]);
  const [signedUrls, setSignedUrls] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [imageModalVisible, setImageModalVisible] = useState(false);
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);

  const invoice = id ? getInvoiceById(id) : undefined;

  useEffect(() => {
    if (!id || !invoice) return;

    (async () => {
      setIsLoading(true);
      try {
        const [items, urls] = await Promise.all([
          fetchLineItemsForInvoice(id),
          Promise.all(invoice.imageUrls.map(path => getInvoiceImageUrl(path))),
        ]);
        setLineItems(items);
        setSignedUrls(urls);
        if (urls.length > 0) setThumbnailUrl(urls[0]);
      } catch {
        // non-fatal — show what we have
      } finally {
        setIsLoading(false);
      }
    })();
  }, [id]);

  const date = invoice?.invoiceDate ?? invoice?.createdAt;
  const formattedDate = date?.toLocaleDateString(undefined, {
    month: 'long', day: 'numeric', year: 'numeric',
  });

  // Sort: actionable items first, skipped/credit last
  const sortedItems = [...lineItems].sort((a, b) => {
    const order: Record<string, number> = { new: 0, price_update: 1, unmatched: 2, skipped: 3, credit: 4 };
    return (order[getChangeType(a)] ?? 5) - (order[getChangeType(b)] ?? 5);
  });

  const newCount = lineItems.filter(i => getChangeType(i) === 'new').length;
  const updateCount = lineItems.filter(i => getChangeType(i) === 'price_update').length;

  if (!invoice) {
    return (
      <GradientBackground>
        <View className="flex-1 items-center justify-center">
          <Text style={{ color: colors.textSecondary }}>Invoice not found</Text>
        </View>
      </GradientBackground>
    );
  }

  return (
    <GradientBackground>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ---- Invoice Image ---- */}
        <Pressable
          onPress={() => signedUrls.length > 0 && setImageModalVisible(true)}
          className="mx-4 mt-4 mb-5 rounded-2xl overflow-hidden"
          style={{
            height: 200,
            backgroundColor: colors.surface,
          }}
        >
          {thumbnailUrl ? (
            <>
              <Image
                source={{ uri: thumbnailUrl }}
                className="absolute inset-0 w-full h-full"
                resizeMode="cover"
                style={{ opacity: 0.85 }}
              />
              <View
                className="absolute inset-0 items-center justify-center"
                style={{ backgroundColor: 'rgba(0,0,0,0.35)' }}
              >
                <View
                  className="flex-row items-center gap-2 px-4 py-2 rounded-full"
                  style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
                >
                  <Ionicons name="expand-outline" size={16} color="white" />
                  <Text style={{ color: 'white', fontSize: 13, fontWeight: '600' }}>
                    Tap to Zoom
                  </Text>
                </View>
              </View>
              {invoice.imageUrls.length > 1 && (
                <View
                  className="absolute bottom-2 right-2 px-2 py-0.5 rounded-full"
                  style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
                >
                  <Text style={{ color: 'white', fontSize: 11 }}>
                    {invoice.imageUrls.length} pages
                  </Text>
                </View>
              )}
            </>
          ) : (
            <View className="flex-1 items-center justify-center gap-2">
              <Ionicons name="document-text-outline" size={32} color={colors.textTertiary} />
              <Text style={{ color: colors.textTertiary, fontSize: 13 }}>No image</Text>
            </View>
          )}
        </Pressable>

        {/* ---- Invoice Meta ---- */}
        <View className="mx-4 mb-4 flex-col gap-1">
          <Text className="text-lg font-bold" style={{ color: colors.text }}>
            {invoice.distributorName ?? 'Unknown Distributor'}
          </Text>
          <Text className="text-sm" style={{ color: colors.textSecondary }}>
            {formattedDate}
            {invoice.invoiceNumber ? ` · Invoice #${invoice.invoiceNumber}` : ''}
          </Text>

          {/* Summary chips */}
          <View className="flex-row items-center gap-2 mt-1.5">
            {newCount > 0 && (
              <View className="flex-row items-center gap-1 px-2.5 py-1 rounded-full" style={{ backgroundColor: colors.warningSubtle }}>
                <Ionicons name="add-circle" size={12} color={colors.gold} />
                <Text style={{ color: colors.gold, fontSize: 11, fontWeight: '600' }}>
                  {newCount} new
                </Text>
              </View>
            )}
            {updateCount > 0 && (
              <View className="flex-row items-center gap-1 px-2.5 py-1 rounded-full" style={{ backgroundColor: '#60A5FA20' }}>
                <Ionicons name="trending-up" size={12} color="#60A5FA" />
                <Text style={{ color: '#60A5FA', fontSize: 11, fontWeight: '600' }}>
                  {updateCount} updated
                </Text>
              </View>
            )}
            <View className="flex-row items-center gap-1 px-2.5 py-1 rounded-full" style={{ backgroundColor: colors.surface }}>
              <Ionicons name="list" size={12} color={colors.textTertiary} />
              <Text style={{ color: colors.textTertiary, fontSize: 11 }}>
                {lineItems.length} items
              </Text>
            </View>
          </View>
        </View>

        {/* ---- Section header ---- */}
        <Text
          className="mx-4 mb-2 text-xs font-semibold uppercase tracking-wider"
          style={{ color: colors.textTertiary }}
        >
          Detected Invoice Items
        </Text>

        {/* ---- Line items ---- */}
        {isLoading ? (
          <View className="py-12 items-center">
            <ActivityIndicator color={colors.gold} />
          </View>
        ) : sortedItems.length === 0 ? (
          <View className="mx-4 py-8 items-center">
            <Text style={{ color: colors.textSecondary }}>No line items recorded</Text>
          </View>
        ) : (
          sortedItems.map(item => (
            <LineItemCard key={item.id} item={item} />
          ))
        )}
      </ScrollView>

      {/* ---- Fullscreen image modal ---- */}
      <ImageModal
        visible={imageModalVisible}
        urls={signedUrls}
        onClose={() => setImageModalVisible(false)}
      />
    </GradientBackground>
  );
}
