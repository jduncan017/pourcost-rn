/**
 * PriceHistory Component
 *
 * Displays price change history for an ingredient.
 * Shows timeline of old→new prices with % change and date.
 */

import { useState, useEffect } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '@/src/contexts/ThemeContext';
import { fetchPriceHistory } from '@/src/lib/invoice-data';
import { formatCurrency } from '@/src/services/calculation-service';
import type { IngredientPriceHistory } from '@/src/types/invoice-models';
import ScreenTitle from '@/src/components/ui/ScreenTitle';
import Card from '@/src/components/ui/Card';

interface PriceHistoryProps {
  ingredientId: string;
}

export default function PriceHistory({ ingredientId }: PriceHistoryProps) {
  const colors = useThemeColors();
  const [history, setHistory] = useState<IngredientPriceHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchPriceHistory(ingredientId, 10)
      .then(setHistory)
      .catch(() => setHistory([]))
      .finally(() => setIsLoading(false));
  }, [ingredientId]);

  if (isLoading) {
    return (
      <View className="PriceHistory py-4 items-center">
        <ActivityIndicator size="small" color={colors.textTertiary} />
      </View>
    );
  }

  if (history.length === 0) return null;

  return (
    <Card padding="medium">
      <View className="PriceHistory flex-col gap-2">
        <ScreenTitle title="Price History" variant="group" className="mb-1" />

      {history.map((entry, i) => {
        const isIncrease = (entry.priceChangePct ?? 0) > 0;
        const isDecrease = (entry.priceChangePct ?? 0) < 0;
        const changeColor = isIncrease ? colors.error : isDecrease ? colors.success : colors.textSecondary;
        const changeIcon = isIncrease ? 'trending-up' : isDecrease ? 'trending-down' : 'remove';

        const date = entry.recordedAt.toLocaleDateString(undefined, {
          month: 'short',
          day: 'numeric',
          year: entry.recordedAt.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined,
        });

        return (
          <View
            key={entry.id}
            className="flex-row items-center py-2"
            style={
              i < history.length - 1
                ? { borderBottomWidth: 0.5, borderBottomColor: colors.borderSubtle }
                : undefined
            }
          >
            {/* Icon */}
            <View
              className="w-7 h-7 rounded-full items-center justify-center mr-3"
              style={{ backgroundColor: changeColor + '15' }}
            >
              <Ionicons name={changeIcon as any} size={14} color={changeColor} />
            </View>

            {/* Price change */}
            <View className="flex-1">
              <View className="flex-row items-center gap-1.5">
                {entry.oldPrice != null && (
                  <>
                    <Text className="text-sm" style={{ color: colors.textTertiary, textDecorationLine: 'line-through' }}>
                      {formatCurrency(entry.oldPrice)}
                    </Text>
                    <Ionicons name="arrow-forward" size={10} color={colors.textTertiary} />
                  </>
                )}
                <Text className="text-sm font-semibold" style={{ color: colors.text }}>
                  {formatCurrency(entry.newPrice)}
                </Text>
              </View>
              <Text className="text-xs mt-0.5" style={{ color: colors.textTertiary }}>
                {date}
                {entry.invoiceLineItemId ? ' · from invoice' : ''}
              </Text>
            </View>

            {/* % change badge */}
            {entry.priceChangePct != null && (
              <View
                className="px-2 py-0.5 rounded-full"
                style={{ backgroundColor: changeColor + '15' }}
              >
                <Text style={{ color: changeColor, fontSize: 11, fontWeight: '700' }}>
                  {entry.priceChangePct > 0 ? '+' : ''}
                  {Math.round(entry.priceChangePct * 10) / 10}%
                </Text>
              </View>
            )}
          </View>
        );
      })}
      </View>
    </Card>
  );
}
