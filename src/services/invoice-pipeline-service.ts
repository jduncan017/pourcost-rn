/**
 * Invoice Processing Pipeline — Orchestration Layer
 *
 * Connects the full flow:
 *   1. Image upload (already done by invoices-store)
 *   2. Vision extraction via Gemini (replaces OCR + text LLM)
 *   3. Distributor detection (from extraction metadata)
 *   4. Pack size resolution
 *   5. Product matching cascade
 *   6. Persist results → move invoice to 'review' status
 *
 * After user review (confirm/correct/skip on the review screen):
 *   7. Apply price updates via cost cascade
 *   8. Move invoice to 'complete' status
 */

import { supabase } from '@/src/lib/supabase';
import { updateInvoiceStatus } from '@/src/lib/invoice-data';
import { detectDistributor } from './distributor-detection-service';
import { extractLineItems } from './llm-extraction-service';
import { resolvePackSizesForInvoice } from './pack-size-service';
import { normalizeProduct } from './product-normalization-service';
import { matchInvoiceLineItems, type LineItemInput } from './matching-cascade-service';
import { applyInvoicePriceUpdates, type PriceUpdateInput, type CascadeResult } from './cost-cascade-service';
import type { Invoice, InvoiceLineItem, MatchStatus } from '@/src/types/invoice-models';

// ==========================================
// TYPES
// ==========================================

export interface ProcessingResult {
  success: boolean;
  invoiceId: string;
  distributorName?: string;
  totalItems: number;
  matchedItems: number;
  processingTier: string;
  error?: string;
}

export interface ConfirmAllResult {
  cascadeResult: CascadeResult;
  invoiceId: string;
}

// ==========================================
// STEP 1: PROCESS INVOICE (OCR → Extract → Match)
// ==========================================

/**
 * Run the full processing pipeline on an uploaded invoice.
 * Called after images are uploaded (triggered by the store or a background job).
 */
export async function processInvoice(invoice: Invoice): Promise<ProcessingResult> {
  const result: ProcessingResult = {
    success: false,
    invoiceId: invoice.id,
    totalItems: 0,
    matchedItems: 0,
    processingTier: 'llm',
  };

  try {
    if (invoice.imageUrls.length === 0) {
      await updateInvoiceStatus(invoice.id, 'failed');
      result.error = 'No images uploaded';
      return result;
    }

    // --- Vision Extraction (Gemini 2.5 Flash) ---
    // Sends images directly to the model — no separate OCR step needed.
    const extraction = await extractLineItems(invoice.imageUrls);

    // --- Distributor Detection ---
    // Use the distributor name from extraction metadata if available,
    // then verify/create in our distributors table.
    let distributorId: string | undefined;
    let distributorName = extraction.distributorName ?? undefined;

    if (distributorName) {
      const detection = await detectDistributor(distributorName);
      if (detection.distributor?.id) {
        distributorId = detection.distributor.id;
        distributorName = detection.distributor.name;
      }
    }

    if (distributorId) {
      await supabase
        .from('invoices')
        .update({ distributor_id: distributorId })
        .eq('id', invoice.id);
    }
    result.distributorName = distributorName;

    // Estimate cost (~1300 tokens per image + ~1000 output tokens at Gemini Flash rates)
    const costCents = Math.ceil(invoice.imageUrls.length * 0.3);

    // Save invoice metadata from extraction
    if (extraction.invoiceNumber) {
      await supabase
        .from('invoices')
        .update({
          invoice_number: extraction.invoiceNumber,
          invoice_date: extraction.invoiceDate,
          processing_cost_cents: costCents,
        })
        .eq('id', invoice.id);
    }

    if (extraction.lineItems.length === 0) {
      await updateInvoiceStatus(invoice.id, 'failed');
      result.error = 'No line items extracted';
      return result;
    }

    // --- Normalize & Filter ---
    const normalized = extraction.lineItems.map(item => ({
      item,
      norm: normalizeProduct(
        item.productName,
        item.rawText,
        item.packSize,
        item.totalPrice,
        item.quantity,
      ),
    }));

    // Filter out non-product lines (deposits, fees, etc.)
    const productItems = normalized.filter(n => !n.norm.isNonProduct);

    if (productItems.length === 0) {
      await updateInvoiceStatus(invoice.id, 'failed');
      result.error = 'No product line items found (all were fees/deposits)';
      return result;
    }

    // --- Pack Size Resolution ---
    const packInfos = await resolvePackSizesForInvoice(
      productItems.map(p => p.item),
      distributorId,
    );

    // --- Insert Line Items ---
    const lineItemRows = productItems.map(({ item, norm }, i) => {
      const packInfo = packInfos.get(i);
      const effectivePackSize = norm.packSize ?? packInfo?.packSize ?? item.packSize;
      const effectiveQty = item.quantity;
      const perBottle = norm.perBottlePrice
        ?? packInfo?.unitPrice
        ?? item.unitPrice;

      return {
        invoice_id: invoice.id,
        line_number: i + 1,
        raw_text: item.rawText,
        sku: item.sku,
        product_name: norm.name, // Use normalized name
        quantity: effectiveQty,
        unit: item.unit,
        unit_price: perBottle,
        total_price: item.totalPrice,
        pack_size: effectivePackSize,
        match_status: item.isCredit ? 'credit' : 'unmatched',
      };
    });

    const { data: insertedItems, error: insertError } = await supabase
      .from('invoice_line_items')
      .insert(lineItemRows)
      .select('id, sku, product_name, pack_size');

    if (insertError || !insertedItems) {
      await updateInvoiceStatus(invoice.id, 'failed');
      result.error = `Failed to insert line items: ${insertError?.message}`;
      return result;
    }

    // --- Get user ID for matching ---
    const { data: inv } = await supabase
      .from('invoices')
      .select('user_id')
      .eq('id', invoice.id)
      .single();

    if (!inv) {
      await updateInvoiceStatus(invoice.id, 'failed');
      result.error = 'Invoice not found';
      return result;
    }

    // --- Product Matching ---
    const matchInputs: LineItemInput[] = insertedItems.map(item => ({
      id: item.id,
      sku: item.sku ?? undefined,
      productName: item.product_name ?? undefined,
      distributorId,
    }));

    const matchResults = await matchInvoiceLineItems(
      matchInputs,
      inv.user_id,
      distributorId,
    );

    // --- Persist Match Results ---
    let matchedCount = 0;
    for (const [lineItemId, match] of matchResults) {
      await supabase
        .from('invoice_line_items')
        .update({
          matched_ingredient_id: match.ingredientId,
          canonical_product_id: match.canonicalProductId ?? null,
          distributor_sku_id: match.distributorSkuId ?? null,
          match_method: match.matchMethod,
          match_confidence: match.matchConfidence,
          match_status: match.matchStatus,
        })
        .eq('id', lineItemId);

      if (match.matchStatus === 'auto_matched') matchedCount++;
    }

    // --- Update Invoice Status → Review ---
    result.totalItems = insertedItems.length;
    result.matchedItems = matchedCount;
    result.processingTier = 'llm';

    await updateInvoiceStatus(invoice.id, 'review', {
      totalItems: result.totalItems,
      matchedItems: matchedCount,
      processingTier: 'llm',
    });

    result.success = true;
    return result;
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Processing failed';
    await updateInvoiceStatus(invoice.id, 'failed').catch(() => {});
    result.error = msg;
    return result;
  }
}

// ==========================================
// STEP 2: CONFIRM & APPLY (after user review)
// ==========================================

/**
 * After the user confirms matches on the review screen, apply all
 * price updates and move the invoice to 'complete'.
 */
export async function confirmAndApplyInvoice(
  invoiceId: string,
): Promise<ConfirmAllResult> {
  // Fetch all confirmed/auto-matched line items with their matched ingredients
  const { data: lineItems } = await supabase
    .from('invoice_line_items')
    .select('id, matched_ingredient_id, unit_price, total_price, quantity, pack_size, raw_text, product_name')
    .eq('invoice_id', invoiceId)
    .in('match_status', ['auto_matched', 'confirmed', 'corrected']);

  if (!lineItems || lineItems.length === 0) {
    // No matched items — just mark complete
    await updateInvoiceStatus(invoiceId, 'complete');
    return {
      invoiceId,
      cascadeResult: {
        ingredientsUpdated: [],
        preppedRecalculated: [],
        cocktailIngredientsUpdated: 0,
        significantChanges: [],
      },
    };
  }

  // Build price update inputs with volume data for configurations
  const { parseVolumeFromBpc } = await import('./product-normalization-service');
  const updates: PriceUpdateInput[] = [];
  const seen = new Set<string>(); // dedupe by ingredient ID

  for (const item of lineItems) {
    if (!item.matched_ingredient_id || seen.has(item.matched_ingredient_id)) continue;
    seen.add(item.matched_ingredient_id);

    // Calculate per-bottle price
    const packSize = item.pack_size ?? 1;
    const unitPrice = item.unit_price
      ?? (Number(item.total_price) / Math.max(Number(item.quantity), 1) / packSize);

    // Parse bottle volume from BPC in raw_text
    let newProductSize: PriceUpdateInput['newProductSize'];
    if (item.raw_text) {
      const bpcMatch = item.raw_text.match(/BPC:\s*(.+?)(?:\s+\d|$)/i);
      if (bpcMatch) {
        const parsed = parseVolumeFromBpc(bpcMatch[1]);
        if (parsed.volume) {
          newProductSize = parsed.volume;
        }
      }
    }

    updates.push({
      ingredientId: item.matched_ingredient_id,
      newProductCost: Math.round(unitPrice * 100) / 100,
      newProductSize,
      invoiceLineItemId: item.id,
      invoiceId,
    });
  }

  // Apply the cost cascade
  const cascadeResult = await applyInvoicePriceUpdates(updates);

  // Update matched count and mark complete
  const matchedCount = lineItems.length;
  await updateInvoiceStatus(invoiceId, 'complete', { matchedItems: matchedCount });

  return { invoiceId, cascadeResult };
}

// OCR helper removed — vision extraction replaces the OCR → text → LLM pipeline.
