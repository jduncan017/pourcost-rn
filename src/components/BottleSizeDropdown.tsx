import React, { useState } from 'react';
import { View, Text, Pressable, Modal, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface BottleSize {
  ml: number;
  oz: number;
  label: string;
}

interface BottleSizeDropdownProps {
  value: number; // Current value in ml
  onValueChange: (ml: number) => void;
  label: string;
}

const BOTTLE_SIZES: BottleSize[] = [
  { ml: 180, oz: 6.1, label: '180ml / 6.1oz' },
  { ml: 187, oz: 6.3, label: '187ml / 6.3oz (Split)' },
  { ml: 200, oz: 6.8, label: '200ml / 6.8oz' },
  { ml: 300, oz: 10.1, label: '300ml / 10.1oz' },
  { ml: 330, oz: 11.2, label: '330ml / 11.2oz' },
  { ml: 375, oz: 12.7, label: '375ml / 12.7oz (Half)' },
  { ml: 500, oz: 16.9, label: '500ml / 16.9oz' },
  { ml: 651, oz: 22.0, label: '22oz / 651ml' },
  { ml: 739, oz: 25.0, label: '25oz / 739ml' },
  { ml: 700, oz: 23.7, label: '700ml / 23.7oz' },
  { ml: 720, oz: 24.3, label: '720ml / 24.3oz' },
  { ml: 750, oz: 25.4, label: '750ml / 25.4oz (Standard)' },
  { ml: 1000, oz: 33.8, label: '1L / 33.8oz' },
  { ml: 1125, oz: 38.0, label: '1.125L / 38.0oz' },
  { ml: 1500, oz: 50.7, label: '1.5L / 50.7oz (Magnum)' },
  { ml: 1750, oz: 59.2, label: '1.75L / 59.2oz (Handle)' },
  { ml: 1800, oz: 60.9, label: '1.8L / 60.9oz' },
  { ml: 946, oz: 32.0, label: '32oz Crowler / 946ml' },
  { ml: 1893, oz: 64.0, label: '64oz Growler / 1893ml' },
  { ml: 3000, oz: 101.4, label: '3L / 101.4oz' },
  { ml: 5000, oz: 169.1, label: '5L / 169.1oz' },
  { ml: 18927, oz: 640.0, label: 'Corny Keg / 640oz' },
  { ml: 19543, oz: 660.5, label: 'Sixth Barrel / 660.5oz' },
  { ml: 20000, oz: 676.3, label: '20L Keg / 676.3oz' },
  { ml: 29356, oz: 992.0, label: 'Quarter Barrel / 992oz' },
  { ml: 30000, oz: 1014.4, label: '30L Keg / 1014.4oz' },
  { ml: 50000, oz: 1690.7, label: '50L Keg / 1690.7oz' },
  { ml: 58674, oz: 1984.0, label: 'Half Barrel / 1984oz' },
];

export default function BottleSizeDropdown({
  value,
  onValueChange,
  label,
}: BottleSizeDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);

  const selectedSize = BOTTLE_SIZES.find(size => size.ml === value) || BOTTLE_SIZES[4]; // Default to 750ml

  return (
    <View className="py-4">
      {/* Label and Value */}
      <View className="flex-row justify-between items-center mb-3">
        <Text className="text-base font-medium text-gray-700">
          {label}
        </Text>
        <Text className="text-base font-semibold text-primary-600">
          {selectedSize.label}
        </Text>
      </View>

      {/* Dropdown Button */}
      <Pressable
        onPress={() => setIsOpen(true)}
        className="bg-white border border-gray-300 rounded-lg p-4 flex-row justify-between items-center active:bg-gray-50"
      >
        <Text className="text-gray-800 font-medium">
          {selectedSize.label}
        </Text>
        <Ionicons name="chevron-down" size={20} color="#6B7280" />
      </Pressable>

      {/* Dropdown Modal */}
      <Modal
        visible={isOpen}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsOpen(false)}
      >
        <Pressable 
          className="flex-1 bg-black bg-opacity-50 justify-center items-center"
          onPress={() => setIsOpen(false)}
        >
          <View className="bg-white rounded-xl mx-4 max-h-96 w-80">
            <View className="p-4 border-b border-gray-200">
              <Text className="text-lg font-semibold text-gray-800 text-center">
                Select Bottle Size
              </Text>
            </View>
            
            <ScrollView className="max-h-80">
              {BOTTLE_SIZES.map((size) => (
                <Pressable
                  key={size.ml}
                  onPress={() => {
                    onValueChange(size.ml);
                    setIsOpen(false);
                  }}
                  className={`p-4 flex-row justify-between items-center border-b border-gray-100 ${
                    size.ml === value ? 'bg-primary-50' : 'active:bg-gray-50'
                  }`}
                >
                  <Text className={`font-medium ${
                    size.ml === value ? 'text-primary-800' : 'text-gray-800'
                  }`}>
                    {size.label}
                  </Text>
                  {size.ml === value && (
                    <Ionicons name="checkmark" size={20} color="#2563EB" />
                  )}
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}