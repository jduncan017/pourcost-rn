import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { useAppStore } from '@/src/stores/app-store';
import CustomSlider from '@/src/components/CustomSlider';
import BottleSizeDropdown from '@/src/components/BottleSizeDropdown';

/**
 * Quick calculator screen - fast ingredient cost calculations
 * Simple interface for calculating cost per pour and suggested pricing
 */
export default function CalculatorScreen() {
  const { measurementSystem, baseCurrency } = useAppStore();
  const [bottleSize, setBottleSize] = useState(750); // ml
  const [bottlePrice, setBottlePrice] = useState(25.0);
  const [pourSize, setPourSize] = useState(1.5); // oz
  const [pourCostPercentage, setPourCostPercentage] = useState(20); // 20%

  // Convert bottle size from ml to oz for calculation
  const bottleSizeOz = bottleSize / 29.5735;

  // Calculate cost per pour: product price / product size (oz) * pour size (oz)
  const costPerPour = (bottlePrice / bottleSizeOz) * pourSize;

  // Calculate suggested charge: cost per pour / pour cost percentage
  const suggestedCharge = costPerPour / (pourCostPercentage / 100);

  // Dynamic step functions matching original PourCost
  const getPriceStep = (value: number): number => {
    if (value < 30) return 0.25;
    if (value < 50) return 0.5;
    if (value < 100) return 1;
    if (value < 150) return 2;
    if (value < 200) return 5;
    if (value < 300) return 10;
    if (value < 1000) return 25;
    if (value < 2000) return 50;
    return 100;
  };

  const getPourCostStep = (value: number): number => {
    if (value < 5) return 1;
    if (value < 10) return 0.5;
    if (value < 30) return 0.25;
    if (value < 50) return 2;
    if (value < 75) return 5;
    return 5;
  };

  return (
    <ScrollView className="flex-1 bg-gray-50">
      <View className="p-4">
        {/* Quick Calculator */}
        <View className="card mb-6">
          <Text className="text-lg font-semibold text-gray-700 mb-4">
            Quick Calculator
          </Text>

          <BottleSizeDropdown
            label="Bottle Size"
            value={bottleSize}
            onValueChange={setBottleSize}
          />

          <CustomSlider
            label="Product Cost"
            minValue={1}
            maxValue={5000}
            value={bottlePrice}
            onValueChange={setBottlePrice}
            unit={` ${baseCurrency} `}
            dynamicStep={getPriceStep}
            logarithmic={true}
          />

          <CustomSlider
            label="Pour Size"
            minValue={0.25}
            maxValue={8}
            value={pourSize}
            onValueChange={setPourSize}
            unit=" oz"
            step={0.25}
          />

          <CustomSlider
            label="Pour Cost %"
            minValue={1}
            maxValue={100}
            value={pourCostPercentage}
            onValueChange={setPourCostPercentage}
            unit="%"
            dynamicStep={getPourCostStep}
            pourCostScale={true}
          />

          {/* Cost Display */}
          <View className="mt-6 p-4 bg-gray-100 rounded-lg border border-gray-300">
            <Text className="text-center text-lg font-semibold text-gray-700 mb-2">
              Cost Per Pour
            </Text>
            <Text className="text-center text-3xl font-bold text-gray-900">
              {`${baseCurrency === 'USD' ? '$' : ''}${costPerPour.toFixed(2)}`}
            </Text>
          </View>

          {/* Charge Display */}
          <View className="mt-4 p-4 bg-primary-50 rounded-lg border-2 border-primary-200">
            <Text className="text-center text-lg font-semibold text-primary-800 mb-2">
              Suggested Charge
            </Text>
            <Text className="text-center text-3xl font-bold text-primary-900">
              {`${baseCurrency === 'USD' ? '$' : ''}${suggestedCharge.toFixed(2)}`}
            </Text>
            <Text className="text-center text-sm text-primary-600 mt-2">
              {pourCostPercentage}% pour cost • {pourSize.toFixed(2)}oz pour
            </Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}
