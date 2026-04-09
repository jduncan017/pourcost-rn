/**
 * Invoice Capture Screen
 * Lets the user photograph or select invoice pages, then uploads them.
 *
 * Requires: npx expo install expo-image-picker
 */

import { useState, useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
// expo-image-picker: run `npx expo install expo-image-picker` before using this screen
// eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports
const ImagePicker = require('expo-image-picker') as {
  requestCameraPermissionsAsync: () => Promise<{ status: string }>;
  requestMediaLibraryPermissionsAsync: () => Promise<{ status: string }>;
  launchCameraAsync: (opts: object) => Promise<{ canceled: boolean; assets: { uri: string }[] }>;
  launchImageLibraryAsync: (opts: object) => Promise<{ canceled: boolean; assets: { uri: string }[] }>;
};
import { Ionicons } from '@expo/vector-icons';
import { useInvoicesStore } from '@/src/stores/invoices-store';
import { processInvoice } from '@/src/services/invoice-pipeline-service';
import { useThemeColors } from '@/src/contexts/ThemeContext';
import GradientBackground from '@/src/components/ui/GradientBackground';
import Button from '@/src/components/ui/Button';

// ==========================================
// PAGE THUMBNAIL
// ==========================================

function PageThumbnail({
  uri,
  index,
  onRemove,
}: {
  uri: string;
  index: number;
  onRemove: () => void;
}) {
  const colors = useThemeColors();

  return (
    <View className="PageThumbnail relative mr-3">
      <Image
        source={{ uri }}
        className="w-24 h-32 rounded-xl"
        style={{ backgroundColor: colors.border }}
        resizeMode="cover"
      />
      <View
        className="absolute top-1 left-2 px-1.5 py-0.5 rounded-full"
        style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
      >
        <Text style={{ color: '#fff', fontSize: 11, fontWeight: '700' }}>
          {index + 1}
        </Text>
      </View>
      <Pressable
        onPress={onRemove}
        className="absolute -top-2 -right-2 w-6 h-6 rounded-full items-center justify-center"
        style={{ backgroundColor: colors.error }}
      >
        <Ionicons name="close" size={14} color="#fff" />
      </Pressable>
    </View>
  );
}

// ==========================================
// MAIN SCREEN
// ==========================================

export default function InvoiceCaptureScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const { createInvoice, isUploading } = useInvoicesStore();

  const [pages, setPages] = useState<string[]>([]);

  const requestPermission = useCallback(async (type: 'camera' | 'library'): Promise<boolean> => {
    if (type === 'camera') {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Camera Permission',
          'Camera access is required to photograph invoices. Enable it in Settings.',
          [{ text: 'OK' }]
        );
        return false;
      }
    } else {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Photo Library Permission',
          'Photo library access is required to select invoices. Enable it in Settings.',
          [{ text: 'OK' }]
        );
        return false;
      }
    }
    return true;
  }, []);

  const takePhoto = useCallback(async () => {
    const hasPermission = await requestPermission('camera');
    if (!hasPermission) return;

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      quality: 0.85,
      allowsEditing: false,
    });

    if (!result.canceled && result.assets[0]) {
      setPages(prev => [...prev, result.assets[0].uri]);
    }
  }, [requestPermission]);

  const pickFromLibrary = useCallback(async () => {
    const hasPermission = await requestPermission('library');
    if (!hasPermission) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.85,
      allowsMultipleSelection: true,
      selectionLimit: 10,
    });

    if (!result.canceled) {
      const uris = result.assets.map((a: { uri: string }) => a.uri);
      setPages(prev => [...prev, ...uris]);
    }
  }, [requestPermission]);

  const removePage = useCallback((index: number) => {
    setPages(prev => prev.filter((_, i) => i !== index));
  }, []);

  const handleUpload = useCallback(async () => {
    if (pages.length === 0) return;

    try {
      const invoice = await createInvoice({ imageUris: pages, imageUrls: [] });
      router.replace('/(drawer)/invoices' as any);

      // Kick off processing in the background (non-blocking)
      processInvoice(invoice).then((result) => {
        if (result.success) {
          // Reload invoices list to show updated status
          useInvoicesStore.getState().loadInvoices(true);
        }
      });
    } catch {
      // Error already shown by store via FeedbackService
    }
  }, [pages, createInvoice, router]);

  return (
    <GradientBackground>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 120 }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="px-4 pt-4 pb-2">
          <Text className="text-2xl font-bold" style={{ color: colors.text }}>Scan Invoice</Text>
          <Text className="text-sm mt-1" style={{ color: colors.textSecondary }}>
            Photograph each page of the invoice
          </Text>
        </View>

        {/* Add Page Buttons */}
        <View className="flex-row gap-3 mx-4 mt-2">
          <Pressable
            onPress={takePhoto}
            disabled={isUploading}
            className="flex-1 flex-row items-center justify-center gap-2 py-4 rounded-2xl active:opacity-70"
            style={{ backgroundColor: colors.surface }}
          >
            <Ionicons name="camera-outline" size={22} color={colors.gold} />
            <Text style={{ color: colors.text, fontWeight: '600', fontSize: 15 }}>
              Take Photo
            </Text>
          </Pressable>

          <Pressable
            onPress={pickFromLibrary}
            disabled={isUploading}
            className="flex-1 flex-row items-center justify-center gap-2 py-4 rounded-2xl active:opacity-70"
            style={{ backgroundColor: colors.surface }}
          >
            <Ionicons name="images-outline" size={22} color={colors.gold} />
            <Text style={{ color: colors.text, fontWeight: '600', fontSize: 15 }}>
              Choose File
            </Text>
          </Pressable>
        </View>

        {/* Page Thumbnails */}
        {pages.length > 0 && (
          <View className="mt-6 mx-4">
            <Text
              className="text-sm font-semibold mb-3"
              style={{ color: colors.textSecondary }}
            >
              {pages.length} {pages.length === 1 ? 'page' : 'pages'} added
            </Text>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingRight: 16 }}
            >
              {pages.map((uri, index) => (
                <PageThumbnail
                  key={`${uri}-${index}`}
                  uri={uri}
                  index={index}
                  onRemove={() => removePage(index)}
                />
              ))}

              {/* Add More button inline */}
              <Pressable
                onPress={pickFromLibrary}
                className="w-24 h-32 rounded-xl border-2 border-dashed items-center justify-center"
                style={{ borderColor: colors.border }}
              >
                <Ionicons name="add" size={28} color={colors.textTertiary} />
                <Text style={{ color: colors.textTertiary, fontSize: 11, marginTop: 4 }}>
                  Add page
                </Text>
              </Pressable>
            </ScrollView>
          </View>
        )}

        {/* Tips */}
        {pages.length === 0 && (
          <View className="mx-4 mt-8 gap-3">
            {[
              { icon: 'flash-outline', text: 'Use good lighting — avoid shadows across the page' },
              { icon: 'crop-outline', text: 'Include the full invoice, especially header and totals' },
              { icon: 'documents-outline', text: 'Multi-page invoices: add each page separately' },
            ].map(({ icon, text }) => (
              <View key={icon} className="flex-row items-center gap-3">
                <View
                  className="w-8 h-8 rounded-full items-center justify-center"
                  style={{ backgroundColor: colors.warningSubtle }}
                >
                  <Ionicons name={icon as any} size={16} color={colors.gold} />
                </View>
                <Text className="flex-1 text-sm" style={{ color: colors.textSecondary }}>
                  {text}
                </Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Submit Button */}
      {pages.length > 0 && (
        <View
          className="absolute bottom-0 left-0 right-0 px-4 pb-8 pt-4"
          style={{ backgroundColor: colors.background + 'E0' }}
        >
          {isUploading ? (
            <View className="flex-row items-center justify-center gap-3 py-4">
              <ActivityIndicator color={colors.gold} />
              <Text style={{ color: colors.text, fontWeight: '600' }}>
                Uploading {pages.length} {pages.length === 1 ? 'page' : 'pages'}…
              </Text>
            </View>
          ) : (
            <Button onPress={handleUpload} variant="primary">
              {`Upload & Process (${pages.length} ${pages.length === 1 ? 'page' : 'pages'})`}
            </Button>
          )}
        </View>
      )}
    </GradientBackground>
  );
}
