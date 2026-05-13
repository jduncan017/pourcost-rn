import { useState, useLayoutEffect } from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator, Alert } from 'react-native';
import { useNavigation } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Ionicons } from '@expo/vector-icons';
import GradientBackground from '@/src/components/ui/GradientBackground';
import ScreenTitle from '@/src/components/ui/ScreenTitle';
import Button from '@/src/components/ui/Button';
import Card from '@/src/components/ui/Card';
import { useThemeColors } from '@/src/contexts/ThemeContext';
import { useGuardedRouter } from '@/src/lib/guarded-router';
import { useIngredientsStore } from '@/src/stores/ingredients-store';
import { volumeLabel } from '@/src/types/models';
import {
  parseCSV,
  matchCanonicalsForRows,
  saveRowConfiguration,
  enqueuePendingSightings,
  CSV_TEMPLATE_CONTENT,
  CSV_TEMPLATE_FILENAME,
  type CsvImportRow,
  type CsvParseResult,
} from '@/src/lib/csv-import';

type Phase = 'idle' | 'previewing' | 'importing' | 'done';

const COLUMN_INFO = [
  { name: 'name', required: true, example: "Tito's Handmade Vodka" },
  { name: 'type', required: true, example: 'Spirit, Beer, Wine, Non-Alc, Prepped, Garnish, Other' },
  { name: 'sub_type', required: false, example: 'Vodka, Whiskey, IPA, Red, White…' },
  { name: 'bottle_size', required: false, example: '750 (ml), or "Half Barrel", "6 pack"…' },
  { name: 'cost', required: false, example: '22.99  (or leave blank and use pack_cost ÷ pack_size)' },
  { name: 'abv', required: false, example: '40' },
  { name: 'brand', required: false, example: "Tito's" },
  { name: 'distributor', required: false, example: 'Republic National, Southern Glazers…' },
  { name: 'pack_size', required: false, example: '6  (blank = single bottle)' },
  { name: 'pack_cost', required: false, example: '119.94  (total case/pack price)' },
];

export default function IngredientImportScreen() {
  const navigation = useNavigation();
  const router = useGuardedRouter();
  const colors = useThemeColors();
  const addIngredient = useIngredientsStore((s) => s.addIngredient);

  const [phase, setPhase] = useState<Phase>('idle');
  const [parseResult, setParseResult] = useState<CsvParseResult | null>(null);
  const [matchingCanonicals, setMatchingCanonicals] = useState(false);
  const [importProgress, setImportProgress] = useState({ done: 0, total: 0 });
  const [importSummary, setImportSummary] = useState({ imported: 0, skipped: 0 });

  useLayoutEffect(() => {
    navigation.setOptions({ title: 'Import Ingredients' });
  }, [navigation]);

  async function handleDownloadTemplate() {
    try {
      const filePath = Paths.join(Paths.cache, CSV_TEMPLATE_FILENAME);
      const file = new File(filePath);
      file.write(CSV_TEMPLATE_CONTENT);
      await Sharing.shareAsync(file.uri, {
        mimeType: 'text/csv',
        dialogTitle: 'Save Import Template',
        UTI: 'public.comma-separated-values-text',
      });
    } catch {
      Alert.alert('Error', 'Could not share template file.');
    }
  }

  async function handlePickFile() {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['text/csv', 'text/plain', 'text/comma-separated-values', '*/*'],
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;

      const uri = result.assets[0].uri;
      const content = await new File(uri).text();
      const parsed = parseCSV(content);

      if (parsed.rows.length === 0) {
        Alert.alert('Empty File', 'No rows found in the CSV. Check the file and try again.');
        return;
      }

      setParseResult(parsed);
      setPhase('previewing');

      // Match canonicals in background — rows update in place
      setMatchingCanonicals(true);
      await matchCanonicalsForRows(parsed.rows);
      setMatchingCanonicals(false);
      // Trigger re-render by setting a fresh reference
      setParseResult({ ...parsed });
    } catch (err) {
      Alert.alert('Error', 'Failed to read file. Make sure it is a valid CSV.');
    }
  }

  async function handleImport() {
    if (!parseResult) return;
    const validRows = parseResult.rows.filter((r) => r.errors.length === 0);
    if (validRows.length === 0) return;

    setPhase('importing');
    setImportProgress({ done: 0, total: validRows.length });

    let imported = 0;
    let skipped = 0;
    // Maps normalized name → created ingredient ID for duplicate-config rows
    const nameToId = new Map<string, string>();

    for (const row of validRows) {
      try {
        if (row.isDuplicateConfig) {
          const existingId = nameToId.get(row.name.toLowerCase());
          if (existingId) {
            await saveRowConfiguration(existingId, row, false);
            imported++;
          } else {
            skipped++;
          }
        } else {
          const ingredient = await addIngredient({
            name: row.name,
            type: row.type,
            subType: row.subType,
            productSize: row.productSize,
            productCost: row.productCost,
            abv: row.abv,
            brand: row.brand,
            canonicalProductId: row.canonicalProductId,
          });
          nameToId.set(row.name.toLowerCase(), ingredient.id);
          await saveRowConfiguration(ingredient.id, row, true);
          imported++;
        }
      } catch {
        skipped++;
      }
      setImportProgress((p) => ({ ...p, done: p.done + 1 }));
    }

    // Enqueue pending size/pack sightings for canonical-matched rows
    await enqueuePendingSightings(validRows).catch(() => {});

    setImportSummary({ imported, skipped });
    setPhase('done');
  }

  function handleReset() {
    setPhase('idle');
    setParseResult(null);
    setMatchingCanonicals(false);
    setImportProgress({ done: 0, total: 0 });
  }

  return (
    <GradientBackground>
      <ScrollView className="flex-1" contentContainerClassName="px-6 pt-4 pb-10 flex-col gap-6">

        {/* ── IDLE ── */}
        {phase === 'idle' && (
          <>
            <View className="flex-col gap-1">
              <ScreenTitle title="Import From CSV" />
              <Text style={{ color: colors.textSecondary, fontSize: 14 }}>
                Add multiple ingredients at once by uploading a spreadsheet.
              </Text>
            </View>

            {/* Column reference */}
            <View className="flex-col gap-2">
              <ScreenTitle variant="group" title="CSV Columns" />
              <Card padding="small">
                <View className="flex-col gap-2">
                  {COLUMN_INFO.map((col) => (
                    <View key={col.name} className="flex-row gap-2 items-start">
                      <View className="flex-row gap-1 items-center" style={{ minWidth: 110 }}>
                        <Text
                          style={{ color: colors.colors.P1, fontSize: 13, fontWeight: '600', fontFamily: 'Geist-Mono' }}
                        >
                          {col.name}
                        </Text>
                        {col.required && (
                          <Text style={{ color: colors.error, fontSize: 10 }}>*</Text>
                        )}
                      </View>
                      <Text style={{ color: colors.textSecondary, fontSize: 12, flex: 1 }}>
                        {col.example}
                      </Text>
                    </View>
                  ))}
                  <Text style={{ color: colors.textSecondary, fontSize: 11, marginTop: 4 }}>
                    * required
                  </Text>
                </View>
              </Card>
            </View>

            <View className="flex-col gap-3">
              <Button
                variant="secondary"
                icon="download-outline"
                onPress={handleDownloadTemplate}
                fullWidth
              >
                Download Template
              </Button>
              <Button
                variant="primary"
                icon="document-attach-outline"
                onPress={handlePickFile}
                fullWidth
              >
                Pick CSV File
              </Button>
            </View>
          </>
        )}

        {/* ── PREVIEWING ── */}
        {phase === 'previewing' && parseResult && (
          <>
            <View className="flex-row items-center justify-between">
              <View className="flex-col gap-1 flex-1">
                <ScreenTitle title={`${parseResult.rows.length} Rows Found`} />
                <Text style={{ color: colors.textSecondary, fontSize: 13 }}>
                  {parseResult.errorCount > 0
                    ? `${parseResult.validCount} valid · ${parseResult.errorCount} with errors (will be skipped)`
                    : `${parseResult.validCount} ready to import`}
                </Text>
              </View>
              {matchingCanonicals && (
                <View className="flex-row items-center gap-2">
                  <ActivityIndicator size="small" color={colors.colors.P1} />
                  <Text style={{ color: colors.textSecondary, fontSize: 12 }}>
                    Matching catalog…
                  </Text>
                </View>
              )}
            </View>

            <View className="flex-col gap-3">
              <Button
                variant="primary"
                icon="checkmark-circle-outline"
                onPress={handleImport}
                disabled={parseResult.validCount === 0}
                fullWidth
              >
                {`Import ${parseResult.validCount} Ingredient${parseResult.validCount !== 1 ? 's' : ''}`}
              </Button>
              <Button variant="ghost" onPress={handleReset} fullWidth>
                Pick Different File
              </Button>
            </View>

            <View className="flex-col gap-2">
              <ScreenTitle variant="group" title="Preview" />
              {parseResult.rows.map((row) => (
                <ImportRowCard key={row.rowIndex} row={row} />
              ))}
            </View>
          </>
        )}

        {/* ── IMPORTING ── */}
        {phase === 'importing' && (
          <View className="flex-1 items-center justify-center gap-6 pt-20">
            <ActivityIndicator size="large" color={colors.colors.P1} />
            <Text style={{ color: colors.text, fontSize: 18, fontWeight: '600' }}>
              Importing…
            </Text>
            <Text style={{ color: colors.textSecondary, fontSize: 15 }}>
              {importProgress.done} of {importProgress.total}
            </Text>
          </View>
        )}

        {/* ── DONE ── */}
        {phase === 'done' && (
          <View className="flex-col gap-6 pt-10 items-center">
            <View className="items-center gap-3">
              <Ionicons name="checkmark-circle" size={64} color={colors.success} />
              <Text style={{ color: colors.text, fontSize: 22, fontWeight: '700' }}>
                Import Complete
              </Text>
              <Text style={{ color: colors.textSecondary, fontSize: 15, textAlign: 'center' }}>
                {importSummary.imported} ingredient{importSummary.imported !== 1 ? 's' : ''} added
                {importSummary.skipped > 0 ? ` · ${importSummary.skipped} skipped` : ''}
              </Text>
            </View>
            <View className="flex-col gap-3 w-full">
              <Button
                variant="primary"
                icon="list-outline"
                onPress={() => router.replace('/(drawer)/ingredients' as any)}
                fullWidth
              >
                View Bar Inventory
              </Button>
              <Button variant="ghost" onPress={handleReset} fullWidth>
                Import Another File
              </Button>
            </View>
          </View>
        )}

      </ScrollView>
    </GradientBackground>
  );
}

// ─────────────────────────────────────────
// Sub-component: individual row card
// ─────────────────────────────────────────

function ImportRowCard({ row }: { row: CsvImportRow }) {
  const colors = useThemeColors();
  const hasErrors = row.errors.length > 0;
  const hasCanonical = !!row.canonicalProductId;

  const statusColor = hasErrors
    ? colors.error
    : row.isDuplicateConfig
    ? colors.colors.P1
    : hasCanonical
    ? colors.success
    : colors.warning;

  const statusLabel = hasErrors
    ? 'Skipped'
    : row.isDuplicateConfig
    ? 'Extra Config'
    : hasCanonical
    ? 'Catalog Match'
    : 'New Ingredient';

  const statusIcon = hasErrors
    ? 'close-circle'
    : row.isDuplicateConfig
    ? 'layers-outline'
    : hasCanonical
    ? 'checkmark-circle'
    : 'add-circle';

  return (
    <Card padding="small">
      <View className="flex-row items-start justify-between gap-3">
        <View className="flex-col gap-1 flex-1">
          <Text style={{ color: colors.text, fontSize: 14, fontWeight: '600' }} numberOfLines={1}>
            {row.name || <Text style={{ color: colors.textSecondary }}>(no name)</Text>}
          </Text>
          {!hasErrors && (
            <View className="flex-col gap-0.5">
              <Text style={{ color: colors.textSecondary, fontSize: 12 }}>
                {[row.type, row.subType].filter(Boolean).join(' · ')}{' '}
                — {volumeLabel(row.productSize)}
                {row.needsCostUpdate ? ' — price needed' : ` — $${row.productCost.toFixed(2)}`}
              </Text>
              {row.needsCostUpdate && (
                <Text style={{ color: colors.warning, fontSize: 11 }}>
                  No price provided — update in-app after import
                </Text>
              )}
            </View>
          )}
          {hasErrors && (
            <View className="flex-col gap-0.5 mt-1">
              {row.errors.map((e, i) => (
                <Text key={i} style={{ color: colors.error, fontSize: 12 }}>
                  {e}
                </Text>
              ))}
            </View>
          )}
        </View>

        <View className="flex-row items-center gap-1">
          <Ionicons name={statusIcon as any} size={14} color={statusColor} />
          <Text style={{ color: statusColor, fontSize: 12, fontWeight: '500' }}>
            {statusLabel}
          </Text>
        </View>
      </View>
    </Card>
  );
}
