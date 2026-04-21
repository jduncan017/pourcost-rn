/**
 * Invoice Capture Screen
 *
 * Uses the native document scanner (VisionKit on iOS, ML Kit on Android)
 * for auto edge detection, perspective correction, and crop preview.
 * Falls back to photo library picker for pre-existing images.
 */

import { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
// Native document scanner — requires dev build. Falls back gracefully if unavailable.
let DocumentScanner: any = null;
let ResponseType: any = {};
let ScanDocumentResponseStatus: any = {};
try {
  const mod = require('react-native-document-scanner-plugin');
  DocumentScanner = mod.default;
  ResponseType = mod.ResponseType;
  ScanDocumentResponseStatus = mod.ScanDocumentResponseStatus;
} catch {
  // Native module not available (e.g. Expo Go) — scanner buttons will fall back to image picker
}
import { Ionicons } from '@expo/vector-icons';
import { useInvoicesStore } from '@/src/stores/invoices-store';
import { processInvoice } from '@/src/services/invoice-pipeline-service';
import { useThemeColors } from '@/src/contexts/ThemeContext';
import GradientBackground from '@/src/components/ui/GradientBackground';
import Button from '@/src/components/ui/Button';

// expo-image-picker for library fallback
// eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports
const ImagePicker = require('expo-image-picker') as {
  requestMediaLibraryPermissionsAsync: () => Promise<{ status: string }>;
  launchImageLibraryAsync: (opts: object) => Promise<{ canceled: boolean; assets: { uri: string }[] }>;
};

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

  const pickFromLibrary = useCallback(async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Photo Library Permission',
        'Photo library access is required to select invoices. Enable it in Settings.',
        [{ text: 'OK' }],
      );
      return;
    }

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
  }, []);

  const scanDocument = useCallback(async () => {
    if (!DocumentScanner) {
      pickFromLibrary();
      return;
    }

    try {
      const result = await DocumentScanner.scanDocument({
        maxNumDocuments: 10,
        responseType: ResponseType.ImageFilePath,
      });

      if (result.status === ScanDocumentResponseStatus.Cancel) return;

      if (result.scannedImages && result.scannedImages.length > 0) {
        setPages(prev => [...prev, ...result.scannedImages!]);
      }
    } catch {
      pickFromLibrary();
    }
  }, [pickFromLibrary]);

  // Auto-launch scanner on mount if no pages yet
  useEffect(() => {
    if (pages.length === 0) {
      scanDocument();
    }
  }, []);

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
        contentContainerStyle={{ paddingBottom: 120, flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="px-4 pt-4 pb-2">
          <Text className="text-2xl font-bold" style={{ color: colors.text }}>Scan Invoice</Text>
          <Text className="text-sm mt-1" style={{ color: colors.textSecondary }}>
            {pages.length > 0
              ? 'Review your scanned pages, then upload'
              : 'Position the invoice in the camera to auto-detect edges'}
          </Text>
        </View>

        {/* Page Thumbnails */}
        {pages.length > 0 && (
          <View className="mt-4 mx-4">
            <Text
              className="text-sm font-semibold mb-3"
              style={{ color: colors.textSecondary }}
            >
              {pages.length} {pages.length === 1 ? 'page' : 'pages'} scanned
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

              {/* Add More — opens scanner again */}
              <Pressable
                onPress={scanDocument}
                className="w-24 h-32 rounded-xl border-2 border-dashed items-center justify-center"
                style={{ borderColor: colors.border }}
              >
                <Ionicons name="scan" size={24} color={colors.textTertiary} />
                <Text style={{ color: colors.textTertiary, fontSize: 11, marginTop: 4 }}>
                  Scan more
                </Text>
              </Pressable>
            </ScrollView>
          </View>
        )}

        {/* Action buttons when no pages */}
        {pages.length === 0 && (
          <View className="flex-1 justify-center px-4">
            <View className="gap-3 mt-8">
              <Pressable
                onPress={scanDocument}
                disabled={isUploading}
                className="flex-row items-center justify-center gap-3 py-5 rounded-2xl active:opacity-70"
                style={{ backgroundColor: colors.surface }}
              >
                <Ionicons name="scan" size={24} color={colors.gold} />
                <Text style={{ color: colors.text, fontWeight: '600', fontSize: 16 }}>
                  Scan Invoice
                </Text>
              </Pressable>

              <Pressable
                onPress={pickFromLibrary}
                disabled={isUploading}
                className="flex-row items-center justify-center gap-3 py-5 rounded-2xl active:opacity-70"
                style={{ backgroundColor: colors.surface }}
              >
                <Ionicons name="images-outline" size={24} color={colors.gold} />
                <Text style={{ color: colors.text, fontWeight: '600', fontSize: 16 }}>
                  Choose from Library
                </Text>
              </Pressable>
            </View>

            {/* Tips */}
            <View className="mt-10 gap-3">
              {[
                { icon: 'scan-outline', text: 'Hold steady — edges are detected automatically' },
                { icon: 'crop-outline', text: 'Adjust the crop if needed before confirming' },
                { icon: 'documents-outline', text: 'Multi-page: scan all pages in one session' },
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
                Uploading {pages.length} {pages.length === 1 ? 'page' : 'pages'}...
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
