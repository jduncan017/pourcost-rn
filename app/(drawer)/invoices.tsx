import { useEffect, useCallback, useState } from 'react';
import { View, Text, FlatList, Pressable, ActivityIndicator, Alert, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useInvoicesStore } from '@/src/stores/invoices-store';
import { useThemeColors } from '@/src/contexts/ThemeContext';
import GradientBackground from '@/src/components/ui/GradientBackground';
import EmptyState from '@/src/components/EmptyState';
import type { Invoice } from '@/src/types/invoice-models';

// ==========================================
// STATUS BADGE
// ==========================================

function StatusBadge({ status }: { status: Invoice['status'] }) {
  const colors = useThemeColors();

  const config: Record<Invoice['status'], { label: string; color: string; bg: string }> = {
    processing: { label: 'Processing', color: colors.warning, bg: colors.warningSubtle },
    review:     { label: 'Needs Review', color: colors.gold, bg: colors.warningSubtle },
    complete:   { label: 'Complete', color: colors.success, bg: colors.successSubtle },
    failed:     { label: 'Failed', color: colors.error, bg: colors.errorSubtle },
  };

  const { label, color, bg } = config[status] ?? config.processing;

  return (
    <View className="px-2 py-0.5 rounded-full" style={{ backgroundColor: bg }}>
      <Text style={{ color, fontSize: 11, fontWeight: '600' }}>{label}</Text>
    </View>
  );
}

// ==========================================
// INVOICE CARD
// ==========================================

function InvoiceCard({
  invoice,
  onPress,
  onDelete,
  onRetry,
}: {
  invoice: Invoice;
  onPress: () => void;
  onDelete: () => void;
  onRetry: () => void;
}) {
  const colors = useThemeColors();

  const date = invoice.invoiceDate ?? invoice.createdAt;
  const formattedDate = date.toLocaleDateString(undefined, {
    month: 'short', day: 'numeric', year: 'numeric',
  });

  const matchProgress = invoice.totalItems > 0
    ? Math.round((invoice.matchedItems / invoice.totalItems) * 100)
    : 0;

  const isProcessing = invoice.status === 'processing';
  const showActions = !isProcessing;

  return (
    <Pressable
      onPress={onPress}
      className="InvoiceCard mx-4 mb-3 p-4 rounded-2xl active:opacity-70"
      style={{ backgroundColor: colors.surface }}
    >
      <View className="flex-row items-start justify-between">
        <View className="flex-1 gap-1">
          <Text className="text-base font-semibold" style={{ color: colors.text }}>
            {invoice.distributorName ?? 'Unknown Distributor'}
          </Text>
          <Text className="text-sm" style={{ color: colors.textSecondary }}>
            {formattedDate}
            {invoice.invoiceNumber ? ` · #${invoice.invoiceNumber}` : ''}
          </Text>
        </View>
        {isProcessing ? (
          <View className="flex-row items-center gap-1.5 px-2 py-0.5 rounded-full" style={{ backgroundColor: colors.warningSubtle }}>
            <ActivityIndicator size="small" color={colors.warning} style={{ transform: [{ scale: 0.7 }] }} />
            <Text style={{ color: colors.warning, fontSize: 11, fontWeight: '600' }}>Processing</Text>
          </View>
        ) : (
          <StatusBadge status={invoice.status} />
        )}
      </View>

      {invoice.totalItems > 0 && (
        <View className="flex-row items-center gap-2 mt-3">
          <View className="flex-1 h-1.5 rounded-full" style={{ backgroundColor: colors.border }}>
            <View
              className="h-1.5 rounded-full"
              style={{
                width: `${matchProgress}%` as `${number}%`,
                backgroundColor: matchProgress === 100 ? colors.success : colors.gold,
              }}
            />
          </View>
          <Text className="text-xs" style={{ color: colors.textSecondary }}>
            {invoice.matchedItems}/{invoice.totalItems} matched
          </Text>
        </View>
      )}

      <View className="flex-row items-center justify-between mt-2">
        <View className="flex-row items-center gap-1">
          <Ionicons name="images-outline" size={13} color={colors.textTertiary} />
          <Text className="text-xs" style={{ color: colors.textTertiary }}>
            {invoice.imageUrls.length} {invoice.imageUrls.length === 1 ? 'page' : 'pages'}
          </Text>
        </View>

        {showActions && (
          <View className="flex-row items-center gap-3">
            {invoice.status !== 'complete' && (
              <Pressable
                onPress={(e) => { e.stopPropagation(); onRetry(); }}
                hitSlop={8}
              >
                <Ionicons name="refresh" size={18} color={colors.gold} />
              </Pressable>
            )}
            <Pressable
              onPress={(e) => { e.stopPropagation(); onDelete(); }}
              hitSlop={8}
            >
              <Ionicons name="trash-outline" size={18} color={colors.error} />
            </Pressable>
          </View>
        )}
      </View>
    </Pressable>
  );
}

// ==========================================
// MAIN SCREEN
// ==========================================

export default function InvoicesScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const { invoices, isLoading, error, loadInvoices } = useInvoicesStore();

  const [refreshing, setRefreshing] = useState(false);
  const { deleteInvoice } = useInvoicesStore();

  // Reload on mount and whenever screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadInvoices(true);
    }, [])
  );

  // Poll while any invoice is processing (every 5s, up to 2 min)
  useEffect(() => {
    const hasProcessing = invoices.some(i => i.status === 'processing');
    if (!hasProcessing) return;

    let elapsed = 0;
    const interval = setInterval(() => {
      elapsed += 5000;
      if (elapsed > 120000) {
        clearInterval(interval);
        return;
      }
      loadInvoices(true);
    }, 5000);

    return () => clearInterval(interval);
  }, [invoices.some(i => i.status === 'processing')]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadInvoices(true);
    setRefreshing(false);
  }, [loadInvoices]);

  const handleRetry = useCallback(async (invoice: Invoice) => {
    // Reset status and clear old line items (cascade handles DB cleanup on re-process)
    const { updateInvoiceStatus, fetchInvoiceById } = await import('@/src/lib/invoice-data');

    // Delete old line items before re-processing
    const { supabase } = await import('@/src/lib/supabase');
    await supabase.from('invoice_line_items').delete().eq('invoice_id', invoice.id);

    await updateInvoiceStatus(invoice.id, 'processing');
    await loadInvoices(true);

    const { processInvoice } = await import('@/src/services/invoice-pipeline-service');
    const fresh = await fetchInvoiceById(invoice.id);
    if (!fresh) return;

    const result = await processInvoice(fresh);
    await loadInvoices(true);

    if (!result.success) {
      Alert.alert('Processing Failed', result.error ?? 'Unknown error');
    }
  }, [loadInvoices]);

  const handleDelete = useCallback((invoice: Invoice) => {
    Alert.alert(
      'Delete Invoice',
      'This will permanently delete the invoice and all its line items.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteInvoice(invoice.id),
        },
      ],
    );
  }, [deleteInvoice]);

  const handleInvoicePress = (invoice: Invoice) => {
    if (invoice.status === 'review' || invoice.status === 'complete') {
      router.push({ pathname: '/invoice-review' as any, params: { id: invoice.id } });
    }
  };

  return (
    <GradientBackground>
      <FlatList
        data={invoices}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingTop: 16, paddingBottom: 100, flexGrow: 1 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.gold} />
        }
        ListHeaderComponent={
          error ? (
            <View className="mx-4 mb-3 p-3 rounded-xl" style={{ backgroundColor: colors.errorSubtle }}>
              <Text style={{ color: colors.error, fontSize: 13 }}>{error}</Text>
            </View>
          ) : null
        }
        ListEmptyComponent={
          <View className="flex-1 items-center justify-center">
            {isLoading ? (
              <ActivityIndicator size="large" color={colors.gold} />
            ) : (
              <EmptyState
                icon="receipt-outline"
                title="No Invoices Yet"
                description="Scan your first invoice to automatically update ingredient prices."
                actionLabel="Scan Invoice"
                onAction={() => router.push('/invoice-capture' as any)}
              />
            )}
          </View>
        }
        renderItem={({ item }) => (
          <InvoiceCard
            invoice={item}
            onPress={() => handleInvoicePress(item)}
            onDelete={() => handleDelete(item)}
            onRetry={() => handleRetry(item)}
          />
        )}
      />

      {/* Floating Action Button */}
      <Pressable
        onPress={() => router.push('/invoice-capture' as any)}
        className="InvoiceFAB absolute bottom-8 right-6 w-14 h-14 rounded-full items-center justify-center shadow-lg active:opacity-80"
        style={{ backgroundColor: colors.gold }}
      >
        <Ionicons name="camera" size={26} color="#000" />
      </Pressable>
    </GradientBackground>
  );
}
