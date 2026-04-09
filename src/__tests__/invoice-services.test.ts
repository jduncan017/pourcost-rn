/**
 * Integration tests for invoice scanning Round 1 services.
 *
 * Tests both Sonnet's data layer (invoice-data.ts, invoices-store types)
 * and Opus's services (matching-cascade, cost-cascade).
 *
 * These are integration tests that hit the real Supabase instance.
 * Run with: npm test -- --testPathPattern=invoice-services
 *
 * Prerequisites:
 *   - Migrations 001 and 002 applied to Supabase
 *   - An authenticated user (tests use the current session)
 */

/**
 * We use the service-role test client so tests bypass RLS and don't need
 * an app auth session. The services themselves import the app supabase
 * client, so we mock that module to return our test client instead.
 */
import { testSupabase } from './test-supabase';

// Mock the app supabase client so all service imports use the test client
jest.mock('@/src/lib/supabase', () => ({
  supabase: require('./test-supabase').testSupabase,
}));

const supabase = testSupabase;

import {
  matchLineItem,
  matchInvoiceLineItems,
  type LineItemInput,
} from '@/src/services/matching-cascade-service';
import {
  applyPriceUpdate,
  applyInvoicePriceUpdates,
  type PriceUpdateInput,
} from '@/src/services/cost-cascade-service';
import {
  updateInvoiceStatus,
  deleteInvoiceById,
  recordPriceChange,
  fetchPriceHistory,
  upsertIngredientConfiguration,
  fetchConfigsForIngredient,
} from '@/src/lib/invoice-data';
import { calculateCostPerPour } from '@/src/services/calculation-service';
import type { Volume } from '@/src/types/models';

// ==========================================
// TEST HELPERS
// ==========================================

const ML_750: Volume = { kind: 'milliliters', ml: 750 };
const ML_1750: Volume = { kind: 'milliliters', ml: 1750 };
const OZ_1_5: Volume = { kind: 'decimalOunces', ounces: 1.5 };

let testUserId: string;
let cleanupIds: { table: string; id: string }[] = [];

/**
 * Get a real user ID from the profiles table to use as the test user.
 * Service role key bypasses RLS so we can query any user.
 */
async function getTestUserId(): Promise<string> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id')
    .limit(1)
    .single();

  if (error || !data) throw new Error(`No profiles found — create a user first: ${error?.message}`);
  return data.id;
}

async function createTestIngredient(overrides: Record<string, unknown> = {}) {
  const { data, error } = await supabase
    .from('ingredients')
    .insert({
      user_id: testUserId,
      name: `Test Spirit ${Date.now()}`,
      product_cost: 25.99,
      product_size: ML_750,
      type: 'Spirit',
      sub_type: 'Vodka',
      ...overrides,
    })
    .select()
    .single();

  if (error) throw new Error(`createTestIngredient: ${error.message}`);
  cleanupIds.push({ table: 'ingredients', id: data.id });
  return data;
}

async function createTestCanonicalProduct(overrides: Record<string, unknown> = {}) {
  const { data, error } = await supabase
    .from('canonical_products')
    .insert({
      name: `Test Canonical ${Date.now()}`,
      brand: 'Test Brand',
      category: 'Spirit',
      subcategory: 'Vodka',
      enrichment_status: 'pending',
      ...overrides,
    })
    .select()
    .single();

  if (error) throw new Error(`createTestCanonicalProduct: ${error.message}`);
  cleanupIds.push({ table: 'canonical_products', id: data.id });
  return data;
}

async function createTestDistributor(overrides: Record<string, unknown> = {}) {
  const { data, error } = await supabase
    .from('distributors')
    .insert({
      name: `Test Distributor ${Date.now()}`,
      type: 'spirits',
      ...overrides,
    })
    .select()
    .single();

  if (error) throw new Error(`createTestDistributor: ${error.message}`);
  cleanupIds.push({ table: 'distributors', id: data.id });
  return data;
}

async function createTestInvoice(overrides: Record<string, unknown> = {}) {
  const { data, error } = await supabase
    .from('invoices')
    .insert({
      user_id: testUserId,
      image_urls: [],
      status: 'processing',
      ...overrides,
    })
    .select('*, distributors(name)')
    .single();

  if (error) throw new Error(`createTestInvoice: ${error.message}`);
  cleanupIds.push({ table: 'invoices', id: data.id });
  return data;
}

async function cleanup() {
  // Delete in reverse order to respect FK constraints
  for (const { table, id } of cleanupIds.reverse()) {
    await supabase.from(table).delete().eq('id', id);
  }
  cleanupIds = [];
}

// ==========================================
// SETUP / TEARDOWN
// ==========================================

beforeAll(async () => {
  testUserId = await getTestUserId();
});

afterEach(async () => {
  await cleanup();
});

// ==========================================
// SONNET'S DATA LAYER TESTS
// ==========================================

describe('Invoice Data Layer (Sonnet)', () => {
  test('create invoice and fetch it back', async () => {
    const invoice = await createTestInvoice({
      image_urls: ['test/path/page_0.jpg'],
    });

    expect(invoice.id).toBeDefined();
    expect(invoice.status).toBe('processing');
    expect(invoice.image_urls).toEqual(['test/path/page_0.jpg']);
  });

  test('updateInvoiceStatus transitions status', async () => {
    const invoice = await createTestInvoice();

    await updateInvoiceStatus(invoice.id, 'review', {
      totalItems: 10,
      matchedItems: 7,
      processingTier: 'llm',
    });

    const { data: updated } = await supabase
      .from('invoices')
      .select('status, total_items, matched_items')
      .eq('id', invoice.id)
      .single();

    expect(updated?.status).toBe('review');
    expect(updated?.total_items).toBe(10);
    expect(updated?.matched_items).toBe(7);
  });

  test('deleteInvoiceById removes the invoice', async () => {
    const invoice = await createTestInvoice();
    // Remove from cleanup since we're deleting it manually
    cleanupIds = cleanupIds.filter(c => c.id !== invoice.id);

    await deleteInvoiceById(invoice.id);

    const { data } = await supabase
      .from('invoices')
      .select('id')
      .eq('id', invoice.id)
      .maybeSingle();

    expect(data).toBeNull();
  });

  test('recordPriceChange and fetchPriceHistory roundtrip', async () => {
    const ingredient = await createTestIngredient();

    await recordPriceChange({
      ingredientId: ingredient.id,
      oldPrice: 25.99,
      newPrice: 28.99,
    });

    const history = await fetchPriceHistory(ingredient.id);
    expect(history.length).toBeGreaterThanOrEqual(1);
    expect(history[0].oldPrice).toBe(25.99);
    expect(history[0].newPrice).toBe(28.99);
    expect(history[0].priceChangePct).toBeCloseTo(11.54, 0);
  });

  test('upsertIngredientConfiguration creates and updates', async () => {
    const ingredient = await createTestIngredient();

    // Create
    const config = await upsertIngredientConfiguration({
      ingredientId: ingredient.id,
      productSize: ML_750,
      productCost: 25.99,
      packSize: 1,
      isDefault: true,
      source: 'manual',
    });

    expect(config.id).toBeDefined();
    expect(config.isDefault).toBe(true);

    const configs = await fetchConfigsForIngredient(ingredient.id);
    expect(configs.length).toBe(1);

    // Update (upsert on same size+pack)
    const updated = await upsertIngredientConfiguration({
      ingredientId: ingredient.id,
      productSize: ML_750,
      productCost: 27.99,
      packSize: 1,
      isDefault: true,
      source: 'invoice',
    });

    expect(updated.productCost).toBe(27.99);
    const configsAfter = await fetchConfigsForIngredient(ingredient.id);
    expect(configsAfter.length).toBe(1); // still 1 — upserted, not duplicated
  });
});

// ==========================================
// MATCHING CASCADE TESTS (Opus)
// ==========================================

describe('Matching Cascade Service (Opus)', () => {
  test('Level 1: exact SKU match returns auto_matched', async () => {
    const distributor = await createTestDistributor();
    const canonical = await createTestCanonicalProduct({ name: "Tito's Handmade Vodka" });
    const ingredient = await createTestIngredient({
      name: "Tito's Vodka",
      canonical_product_id: canonical.id,
    });

    // Create a distributor SKU mapping
    const { data: sku } = await supabase
      .from('distributor_skus')
      .insert({
        distributor_id: distributor.id,
        sku: 'TIT-750-TEST',
        raw_product_name: "TITOS HM VODKA 750ML",
        canonical_product_id: canonical.id,
        product_size: ML_750,
        verified: true,
        verified_by_count: 5,
        confidence: 1.0,
      })
      .select()
      .single();

    cleanupIds.push({ table: 'distributor_skus', id: sku!.id });

    const result = await matchLineItem(
      { id: 'test-1', sku: 'TIT-750-TEST', distributorId: distributor.id },
      testUserId,
    );

    expect(result.matchMethod).toBe('sku_exact');
    expect(result.matchConfidence).toBe(1.0);
    expect(result.matchStatus).toBe('auto_matched');
    expect(result.ingredientId).toBe(ingredient.id);
  });

  test('Level 2: org mapping match', async () => {
    const canonical = await createTestCanonicalProduct({ name: "Hendrick's Gin" });
    const ingredient = await createTestIngredient({ name: "Hendrick's" });

    // Create org mapping
    const { data: mapping } = await supabase
      .from('org_product_mappings')
      .insert({
        user_id: testUserId,
        canonical_product_id: canonical.id,
        ingredient_id: ingredient.id,
        auto_update_price: true,
      })
      .select()
      .single();

    cleanupIds.push({ table: 'org_product_mappings', id: mapping!.id });

    const result = await matchLineItem(
      { id: 'test-2', productName: "Hendrick's Gin 750ml" },
      testUserId,
    );

    // Should match via org mapping (Level 2) — the canonical name "Hendrick's Gin"
    // is close to the line item "Hendrick's Gin 750ml"
    expect(result.ingredientId).toBe(ingredient.id);
    expect(result.matchConfidence).toBeGreaterThanOrEqual(0.6);
  });

  test('Level 4: fuzzy match against user ingredients', async () => {
    const ingredient = await createTestIngredient({
      name: "Bulleit Bourbon",
    });

    const result = await matchLineItem(
      { id: 'test-4', productName: 'BULLEIT BOURBON WHISKEY' },
      testUserId,
    );

    // Should fuzzy-match against user's ingredient
    expect(result.ingredientId).toBe(ingredient.id);
    expect(result.matchMethod).toBe('fuzzy');
    expect(result.matchConfidence).toBeGreaterThanOrEqual(0.6);
  });

  test('Level 5: completely unknown product returns unmatched', async () => {
    const result = await matchLineItem(
      { id: 'test-5', productName: 'XYZZY BRAND UNKNOWN PRODUCT 999ML' },
      testUserId,
    );

    expect(result.matchStatus).toBe('unmatched');
    expect(result.ingredientId).toBeNull();
    expect(result.matchConfidence).toBe(0);
  });

  test('matchInvoiceLineItems processes a batch', async () => {
    const ingredient = await createTestIngredient({ name: 'Jameson Irish Whiskey' });

    const lineItems: LineItemInput[] = [
      { id: 'batch-1', productName: 'JAMESON IRISH WHISKEY' },
      { id: 'batch-2', productName: 'TOTALLY UNKNOWN PRODUCT XYZ' },
    ];

    const results = await matchInvoiceLineItems(lineItems, testUserId);

    expect(results.size).toBe(2);

    const matched = results.get('batch-1');
    expect(matched?.ingredientId).toBe(ingredient.id);

    const unmatched = results.get('batch-2');
    expect(unmatched?.matchStatus).toBe('unmatched');
  });
});

// ==========================================
// COST CASCADE TESTS (Opus)
// ==========================================

describe('Cost Cascade Service (Opus)', () => {
  test('applyPriceUpdate updates ingredient and cascades to cocktails', async () => {
    // Create ingredient
    const ingredient = await createTestIngredient({
      name: 'Cascade Test Vodka',
      product_cost: 20.00,
      product_size: ML_750,
    });

    // Create a cocktail using this ingredient
    const { data: cocktail } = await supabase
      .from('cocktails')
      .insert({
        user_id: testUserId,
        name: `Cascade Test Cocktail ${Date.now()}`,
      })
      .select()
      .single();

    cleanupIds.push({ table: 'cocktails', id: cocktail!.id });

    const originalCost = calculateCostPerPour(ML_750, 20.00, OZ_1_5);

    const { data: ci } = await supabase
      .from('cocktail_ingredients')
      .insert({
        cocktail_id: cocktail!.id,
        ingredient_id: ingredient.id,
        pour_size: OZ_1_5,
        cost: originalCost,
        ingredient_name: 'Cascade Test Vodka',
        product_size: ML_750,
        product_cost: 20.00,
      })
      .select()
      .single();

    // Apply price update: $20 → $25
    const result = await applyPriceUpdate({
      ingredientId: ingredient.id,
      newProductCost: 25.00,
    });

    expect(result.ingredientsUpdated).toContain(ingredient.id);
    expect(result.cocktailIngredientsUpdated).toBeGreaterThanOrEqual(1);

    // Verify the cocktail_ingredient row was updated
    const { data: updatedCi } = await supabase
      .from('cocktail_ingredients')
      .select('product_cost, cost')
      .eq('id', ci!.id)
      .single();

    expect(Number(updatedCi!.product_cost)).toBe(25.00);

    const expectedCost = calculateCostPerPour(ML_750, 25.00, OZ_1_5);
    expect(Number(updatedCi!.cost)).toBeCloseTo(expectedCost, 2);

    // Verify price history was recorded
    const history = await fetchPriceHistory(ingredient.id);
    expect(history.length).toBeGreaterThanOrEqual(1);
    expect(history[0].oldPrice).toBe(20.00);
    expect(history[0].newPrice).toBe(25.00);
  });

  test('significant price change is flagged', async () => {
    const ingredient = await createTestIngredient({
      name: 'Price Spike Vodka',
      product_cost: 20.00,
      product_size: ML_750,
    });

    // 25% increase
    const result = await applyPriceUpdate({
      ingredientId: ingredient.id,
      newProductCost: 25.00,
    });

    expect(result.significantChanges.length).toBe(1);
    expect(result.significantChanges[0].changePct).toBe(25);
    expect(result.significantChanges[0].ingredientName).toBe('Price Spike Vodka');
  });

  test('applyInvoicePriceUpdates handles batch', async () => {
    const ing1 = await createTestIngredient({
      name: 'Batch Test 1',
      product_cost: 10.00,
    });
    const ing2 = await createTestIngredient({
      name: 'Batch Test 2',
      product_cost: 15.00,
    });

    const result = await applyInvoicePriceUpdates([
      { ingredientId: ing1.id, newProductCost: 12.00 },
      { ingredientId: ing2.id, newProductCost: 18.00 },
    ]);

    expect(result.ingredientsUpdated).toContain(ing1.id);
    expect(result.ingredientsUpdated).toContain(ing2.id);

    // Verify both were updated
    const { data: updated1 } = await supabase
      .from('ingredients')
      .select('product_cost')
      .eq('id', ing1.id)
      .single();

    const { data: updated2 } = await supabase
      .from('ingredients')
      .select('product_cost')
      .eq('id', ing2.id)
      .single();

    expect(Number(updated1!.product_cost)).toBe(12.00);
    expect(Number(updated2!.product_cost)).toBe(18.00);
  });

  test('ingredient_configuration is created on invoice update', async () => {
    const invoice = await createTestInvoice();

    const ingredient = await createTestIngredient({
      name: 'Config Test Vodka',
      product_cost: 22.00,
      product_size: ML_750,
    });

    await applyPriceUpdate({
      ingredientId: ingredient.id,
      newProductCost: 24.00,
      invoiceId: invoice.id,
    });

    const configs = await fetchConfigsForIngredient(ingredient.id);
    expect(configs.length).toBeGreaterThanOrEqual(1);

    const invoiceConfig = configs.find(c => c.source === 'invoice');
    expect(invoiceConfig).toBeDefined();
    expect(invoiceConfig!.productCost).toBe(24.00);
    expect(invoiceConfig!.lastInvoiceId).toBe(invoice.id);
  });
});
