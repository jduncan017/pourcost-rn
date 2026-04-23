/**
 * Invoice Line Item Edit Screen
 *
 * Allows editing extracted line item data: product name, SKU,
 * quantity, unit price, pack size, etc.
 */

import { useState, useCallback } from 'react';
import { View, Text, ScrollView, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useThemeColors } from '@/src/contexts/ThemeContext';
import { supabase } from '@/src/lib/supabase';
import { useInvoicesStore } from '@/src/stores/invoices-store';
import { FeedbackService } from '@/src/services/feedback-service';
import GradientBackground from '@/src/components/ui/GradientBackground';
import TextInput from '@/src/components/ui/TextInput';
import Button from '@/src/components/ui/Button';

export default function InvoiceLineEditScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const params = useLocalSearchParams<{
    lineItemId: string;
    invoiceId: string;
    productName: string;
    sku: string;
    quantity: string;
    unit: string;
    unitPrice: string;
    totalPrice: string;
    packSize: string;
  }>();

  const [productName, setProductName] = useState(params.productName ?? '');
  const [sku, setSku] = useState(params.sku ?? '');
  const [quantity, setQuantity] = useState(params.quantity ?? '1');
  const [unit, setUnit] = useState(params.unit ?? 'each');
  const [unitPrice, setUnitPrice] = useState(params.unitPrice ?? '');
  const [totalPrice, setTotalPrice] = useState(params.totalPrice ?? '');
  const [packSize, setPackSize] = useState(params.packSize ?? '1');
  const [isSaving, setIsSaving] = useState(false);

  // Recalculate total when unit price or quantity changes
  const calculatedTotal = (() => {
    const up = parseFloat(unitPrice);
    const q = parseFloat(quantity);
    const ps = parseInt(packSize, 10) || 1;
    if (!isNaN(up) && !isNaN(q)) return (up * q * ps).toFixed(2);
    return totalPrice;
  })();

  const handleSave = useCallback(async () => {
    if (!params.lineItemId) return;
    setIsSaving(true);

    try {
      const up = parseFloat(unitPrice) || null;
      const tp = parseFloat(totalPrice) || parseFloat(calculatedTotal) || 0;
      const q = parseFloat(quantity) || 1;
      const ps = parseInt(packSize, 10) || 1;

      const { error } = await supabase
        .from('invoice_line_items')
        .update({
          product_name: productName,
          sku: sku || null,
          quantity: q,
          unit,
          unit_price: up,
          total_price: tp,
          pack_size: ps,
        })
        .eq('id', params.lineItemId);

      if (error) throw new Error(error.message);

      // Reload line items in the store
      if (params.invoiceId) {
        await useInvoicesStore.getState().loadLineItems(params.invoiceId);
      }

      FeedbackService.showSuccess('Saved', 'Line item updated');
      router.back();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to save';
      Alert.alert('Save Failed', msg);
    } finally {
      setIsSaving(false);
    }
  }, [params.lineItemId, params.invoiceId, productName, sku, quantity, unit, unitPrice, totalPrice, packSize, calculatedTotal, router]);

  return (
    <GradientBackground>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 120 }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="p-4 flex-col gap-4">
          <TextInput
            label="Product Name"
            value={productName}
            onChangeText={setProductName}
            placeholder="e.g. Tito's Handmade Vodka"
          />

          <TextInput
            label="SKU / Item #"
            value={sku}
            onChangeText={setSku}
            placeholder="e.g. 314808"
          />

          <View className="flex-row gap-3">
            <View className="flex-1">
              <TextInput
                label="Quantity"
                value={quantity}
                onChangeText={setQuantity}
                keyboardType="decimal-pad"
                placeholder="1"
              />
            </View>
            <View className="flex-1">
              <TextInput
                label="Unit"
                value={unit}
                onChangeText={setUnit}
                placeholder="case, bottle, each"
              />
            </View>
          </View>

          <View className="flex-row gap-3">
            <View className="flex-1">
              <TextInput
                label="Pack Size"
                value={packSize}
                onChangeText={setPackSize}
                keyboardType="number-pad"
                placeholder="1"
              />
            </View>
            <View className="flex-1">
              <TextInput
                label="Unit Price / Bottle"
                value={unitPrice}
                onChangeText={setUnitPrice}
                keyboardType="decimal-pad"
                placeholder="0.00"
              />
            </View>
          </View>

          <TextInput
            label="Total Price"
            value={totalPrice}
            onChangeText={setTotalPrice}
            keyboardType="decimal-pad"
            placeholder="0.00"
          />

          {/* Calculated summary */}
          <View
            className="p-3 rounded-xl"
            style={{ backgroundColor: colors.surface }}
          >
            <Text className="text-xs font-semibold mb-2" style={{ color: colors.textSecondary }}>
              Summary
            </Text>
            <View className="flex-col gap-1">
              <View className="flex-row justify-between">
                <Text className="text-sm" style={{ color: colors.textSecondary }}>Per bottle</Text>
                <Text className="text-sm font-semibold" style={{ color: colors.text }}>
                  ${unitPrice || '—'}
                </Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-sm" style={{ color: colors.textSecondary }}>
                  {quantity || '1'}× {parseInt(packSize, 10) > 1 ? `${packSize}pk` : ''}
                </Text>
                <Text className="text-sm font-semibold" style={{ color: colors.text }}>
                  ${calculatedTotal}
                </Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Save button */}
      <View
        className="absolute bottom-0 left-0 right-0 px-4 pb-8 pt-4"
        style={{ backgroundColor: colors.background + 'E0' }}
      >
        <Button onPress={handleSave} variant="primary" loading={isSaving}>
          Save Changes
        </Button>
      </View>
    </GradientBackground>
  );
}
