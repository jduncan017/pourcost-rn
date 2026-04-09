/**
 * Tests for Round 2 Opus services:
 *   - Distributor detection heuristics
 *   - Pack size disambiguation
 *   - LLM extraction response parsing
 *
 * Distributor detection tests hit Supabase (integration).
 * Pack size tests are pure logic (unit tests).
 * LLM extraction tests validate parsing only (no API calls).
 */

import { testSupabase } from './test-supabase';

jest.mock('@/src/lib/supabase', () => ({
  supabase: require('./test-supabase').testSupabase,
}));

import { detectDistributor } from '@/src/services/distributor-detection-service';
import { resolvePackSize } from '@/src/services/pack-size-service';
import { estimateExtractionCost } from '@/src/services/llm-extraction-service';
import type { ExtractedLineItem } from '@/src/services/llm-extraction-service';

// ==========================================
// HELPERS
// ==========================================

function makeLineItem(overrides: Partial<ExtractedLineItem> = {}): ExtractedLineItem {
  return {
    sku: null,
    productName: 'Test Product',
    quantity: 1,
    unit: 'each',
    unitPrice: null,
    totalPrice: 25.99,
    packSize: null,
    isCredit: false,
    rawText: '',
    confidence: 0.9,
    ...overrides,
  };
}

// ==========================================
// DISTRIBUTOR DETECTION
// ==========================================

describe('Distributor Detection (Opus)', () => {
  test("detects Southern Glazer's from header text", async () => {
    const ocrText = `
      SOUTHERN GLAZER'S WINE & SPIRITS
      123 Commerce Blvd, Dallas TX 75001
      Invoice #: SG-2024-98765
      Date: 03/15/2024

      SKU         DESCRIPTION              QTY   PRICE
      SG-12345    TITOS HM VODKA 750ML      6    $22.99
    `;

    const result = await detectDistributor(ocrText);
    expect(result.distributor).not.toBeNull();
    expect(result.distributor!.name).toContain('Southern Glazer');
    expect(result.confidence).toBeGreaterThanOrEqual(0.85);
  });

  test('detects RNDC from abbreviated name', async () => {
    const ocrText = `
      RNDC
      Republic National Distributing
      Invoice: RN-55432
      BULLEIT BOURBON 750ML   CS12   $289.88
    `;

    const result = await detectDistributor(ocrText);
    expect(result.distributor).not.toBeNull();
    expect(result.distributor!.name).toContain('Republic National');
  });

  test('detects Sysco from broadline distributor', async () => {
    const ocrText = `
      SYSCO CORPORATION
      Order Confirmation / Invoice
      Customer: The Tipsy Cow Bar & Grill
      ROSES LIME JUICE 1L   EA   $4.29
    `;

    const result = await detectDistributor(ocrText);
    expect(result.distributor).not.toBeNull();
    expect(result.distributor!.name).toBe('Sysco');
  });

  test('handles OCR-mangled distributor name', async () => {
    const ocrText = `
      S0UTHERN GLAZER'S
      lnvoice #4421
      HENDRICKS GIN 750ML  3  $31.99
    `;

    const result = await detectDistributor(ocrText);
    // The regex pattern s[o0]uthern\s+glaz should catch this
    expect(result.distributor).not.toBeNull();
  });

  test('returns null for unknown distributor', async () => {
    const ocrText = `
      Bob's Local Liquor Warehouse
      Custom Invoice
      Item 1: Some Vodka   $20.00
    `;

    const result = await detectDistributor(ocrText);
    expect(result.distributor).toBeNull();
    expect(result.confidence).toBe(0);
  });

  test('detects distributor from footer', async () => {
    const ocrText = `
      ${'X'.repeat(2500)}
      Thank you for your business!
      Breakthru Beverage Group
      Questions? Call 1-800-555-0123
    `;

    const result = await detectDistributor(ocrText);
    expect(result.distributor).not.toBeNull();
    expect(result.distributor!.name).toContain('Breakthru');
  });
});

// ==========================================
// PACK SIZE DISAMBIGUATION
// ==========================================

describe('Pack Size Disambiguation (Opus)', () => {
  test('parses "6/750ML" slash notation as pack of 6', () => {
    const item = makeLineItem({
      productName: 'TITOS HM VODKA 6/750ML',
      rawText: 'TITOS HM VODKA 6/750ML   1   $149.94',
      quantity: 1,
      totalPrice: 149.94,
    });

    const result = resolvePackSize(item);
    expect(result.packSize).toBe(6);
    expect(result.unitVolume).toEqual({ kind: 'milliliters', ml: 750 });
    expect(result.unitPrice).toBeCloseTo(24.99, 2);
  });

  test('parses "12×355ml" multiplication notation', () => {
    const item = makeLineItem({
      productName: 'MODELO ESPECIAL 12x355ml',
      rawText: 'MODELO ESPECIAL 12x355ml   2   $31.98',
      quantity: 2,
      totalPrice: 31.98,
    });

    const result = resolvePackSize(item);
    expect(result.packSize).toBe(12);
    expect(result.unitVolume).toEqual({ kind: 'milliliters', ml: 355 });
  });

  test('parses "CS 12" case notation', () => {
    const item = makeLineItem({
      productName: 'JACK DANIELS 750ML CS12',
      rawText: 'JACK DANIELS 750ML CS12   1   $299.88',
      quantity: 1,
      totalPrice: 299.88,
    });

    const result = resolvePackSize(item);
    expect(result.packSize).toBe(12);
  });

  test('parses "12PK" pack notation', () => {
    const item = makeLineItem({
      productName: 'WHITE CLAW VARIETY 12PK',
      rawText: 'WHITE CLAW VARIETY 12PK   3   $47.97',
      quantity: 3,
      totalPrice: 47.97,
    });

    const result = resolvePackSize(item);
    expect(result.packSize).toBe(12);
  });

  test('single bottle "750ML" has packSize 1', () => {
    const item = makeLineItem({
      productName: 'HENDRICKS GIN 750ML',
      rawText: 'HENDRICKS GIN 750ML   2   $69.98',
      quantity: 2,
      totalPrice: 69.98,
      unit: 'bottle',
    });

    const result = resolvePackSize(item);
    expect(result.packSize).toBe(1);
    expect(result.quantity).toBe(2);
    expect(result.unitVolume).toEqual({ kind: 'milliliters', ml: 750 });
    expect(result.needsConfirmation).toBe(false);
  });

  test('respects LLM-extracted pack_size', () => {
    const item = makeLineItem({
      productName: 'ABSOLUT VODKA',
      quantity: 2,
      totalPrice: 259.92,
      packSize: 6,
    });

    const result = resolvePackSize(item);
    expect(result.packSize).toBe(6);
  });

  test('respects known distributor SKU pack_size', () => {
    const item = makeLineItem({
      productName: 'ABSOLUT VODKA 1.75L',
      quantity: 1,
      totalPrice: 149.94,
    });

    const result = resolvePackSize(item, 6); // known: case of 6
    expect(result.packSize).toBe(6);
    expect(result.unitPrice).toBeCloseTo(24.99, 2);
  });

  test('unit "case" flags for confirmation', () => {
    const item = makeLineItem({
      productName: 'MAKERS MARK BOURBON',
      quantity: 2,
      totalPrice: 499.92,
      unit: 'case',
    });

    const result = resolvePackSize(item);
    expect(result.needsConfirmation).toBe(true);
    expect(result.confirmationPrompt).toContain('bottles per case');
  });

  test('handles "1.75L" liter notation', () => {
    const item = makeLineItem({
      productName: 'TITOS VODKA 1.75L',
      rawText: 'TITOS VODKA 1.75L   6   $149.94',
      quantity: 6,
      totalPrice: 149.94,
      unit: 'bottle',
    });

    const result = resolvePackSize(item);
    expect(result.packSize).toBe(1);
    expect(result.unitVolume).toEqual({ kind: 'milliliters', ml: 1750 });
    expect(result.unitPrice).toBeCloseTo(24.99, 2);
  });
});

// ==========================================
// LLM EXTRACTION — COST ESTIMATION
// ==========================================

describe('LLM Extraction Cost Estimation (Opus)', () => {
  test('Tier 3 (Haiku) cost estimate', () => {
    // ~2000 chars of OCR text → ~500 tokens input
    const cents = estimateExtractionCost('llm', 2000);
    expect(cents).toBeGreaterThan(0);
    expect(cents).toBeLessThan(5); // should be a few cents at most
  });

  test('Tier 4 (Vision/Sonnet) cost estimate is higher', () => {
    const haikuCost = estimateExtractionCost('llm', 2000);
    const sonnetCost = estimateExtractionCost('vision', 2000);
    expect(sonnetCost).toBeGreaterThan(haikuCost);
  });
});
