/**
 * LLM Extraction Service — Tier 3 Invoice Processing
 *
 * When template parsing isn't available (unknown distributor format),
 * we send OCR text to Claude Haiku for structured line item extraction.
 *
 * The extraction prompt is the critical piece — it must handle:
 *   - Wildly different invoice layouts (tabular, list, mixed)
 *   - Abbreviations (HM = Handmade, CS = Case, EA = Each, BT = Bottle)
 *   - Multi-line items (product name on one line, price on next)
 *   - Split lines from OCR errors
 *   - Credit memos (negative amounts)
 *   - Non-product lines (subtotals, tax, delivery fees, headers)
 *
 * Architecture:
 *   Client builds the prompt → calls Supabase Edge Function →
 *   Edge Function forwards to Claude API → returns parsed JSON.
 *
 * The Edge Function is a thin proxy (see supabase/functions/extract-invoice/).
 * All intelligence lives here in the prompt and response parsing.
 */

import { supabase } from '@/src/lib/supabase';

// ==========================================
// TYPES
// ==========================================

export interface ExtractedLineItem {
  /** SKU/item code if present on the invoice */
  sku: string | null;
  /** Product name as printed */
  productName: string;
  /** Number of units ordered */
  quantity: number;
  /** Unit type: case, bottle, each, keg, can, etc. */
  unit: string;
  /** Price per unit */
  unitPrice: number | null;
  /** Line total (quantity × unitPrice) */
  totalPrice: number;
  /** Units per case/pack if discernible (e.g., 12 for a case of 12) */
  packSize: number | null;
  /** True if this is a credit/return (negative amount) */
  isCredit: boolean;
  /** Raw text this item was extracted from */
  rawText: string;
  /** Confidence 0–1 in the extraction accuracy */
  confidence: number;
}

export interface ExtractionResult {
  lineItems: ExtractedLineItem[];
  /** Distributor name if detected in the invoice text */
  distributorName: string | null;
  /** Invoice number if found */
  invoiceNumber: string | null;
  /** Invoice date if found (ISO string) */
  invoiceDate: string | null;
  /** Lines the LLM flagged as ambiguous or uncertain */
  warnings: string[];
}

// ==========================================
// EXTRACTION PROMPT
// ==========================================

const SYSTEM_PROMPT = `You are an invoice data extraction system for bars and restaurants. You extract structured line item data from OCR text of distributor invoices for alcoholic beverages, mixers, and bar supplies.

CRITICAL — Tabular invoice layout rules:
- Invoices are tabular with columns. OCR often interleaves columns badly. You MUST reconstruct each row carefully.
- Each product is ONE line item. Do NOT merge different products together.
- The ITEM# or SKU on the line below a product name belongs to THAT product, not the next one.
- A product name and its ITEM# / BPC / prices form ONE logical item even if OCR splits them across lines.

Quantity parsing:
- Many invoices have a CS/BT column (cases/bottles) at the start of each line, shown as "1/0" meaning 1 case and 0 extra bottles, or "0/1" meaning 0 cases and 1 bottle.
- "1/0" = quantity 1 (one case). Do NOT read this as "10".
- "0/1" = quantity 1 (one bottle, not a full case).
- The number BEFORE the slash is cases, AFTER is individual bottles.
- If the line starts with just a number like "1" before the product name, that is the quantity.

Price rules:
- When an invoice shows UNIT PRICE, DISCOUNT, and NET AMOUNT columns: use the NET AMOUNT (after discount) as total_price.
- The TOTAL column at the far right is the final amount charged — use this as total_price when available.
- unit_price should be the per-bottle price: total_price divided by (quantity × pack_size).
- Do NOT use the gross/list price when a discount is applied.

Pack size (BPC = Bottles Per Case):
- "BPC: 6-1.0L" means 6 bottles of 1.0 liter each. pack_size = 6.
- "BPC: 24-187ML" means 24 bottles of 187ml each. pack_size = 24.
- "BPC: 12-1.0L" means 12 bottles of 1.0 liter each. pack_size = 12.
- "BPC: 1-19.5L" means 1 unit of 19.5 liters (a keg). pack_size = 1.

Common abbreviations:
- CS/CSE = Case, BT/BTL = Bottle, EA = Each, KG = Keg, CN = Can
- HM/HMADE = Handmade, SM = Small, LG = Large, LTR/L = Liter
- ML = Milliliters, NV = Non-Vintage, YO/YRC = Year Old
- TEQ = Tequila, SCHN = Schnapps, (SC)LSE = Screw Cap/Loose
- (BAR) = bar size bottle
- 6pk/12pk = 6-pack/12-pack

Other rules:
1. Extract ONLY product line items. Skip deposit fees, headers, footers, subtotals, tax lines, delivery fees, page numbers, and distributor contact info.
2. Each line item must have at minimum: product_name, quantity, and total_price.
3. For credits/returns, set is_credit: true and keep total_price as a positive number.
4. If a line is too garbled to extract reliably, include it with confidence < 0.5.
5. Look for invoice metadata near the top: distributor name, invoice number, invoice date.

Respond with ONLY valid JSON matching this schema — no markdown, no explanation:
{
  "distributor_name": string | null,
  "invoice_number": string | null,
  "invoice_date": string | null,  // ISO 8601 format if found
  "line_items": [
    {
      "sku": string | null,
      "product_name": string,
      "quantity": number,
      "unit": string,
      "unit_price": number | null,
      "total_price": number,
      "pack_size": number | null,
      "is_credit": boolean,
      "raw_text": string,
      "confidence": number
    }
  ],
  "warnings": string[]
}`;

function buildUserPrompt(ocrText: string, context?: { distributorName?: string }): string {
  let prompt = `Extract all product line items from this invoice OCR text.\n\n`;

  if (context?.distributorName) {
    prompt += `Known distributor: ${context.distributorName}\n\n`;

    // Add distributor-specific hints
    if (context.distributorName.toLowerCase().includes('southern glazer')) {
      prompt += `Southern Glazer's invoice format notes:
- Lines start with CS/BT quantities like "1/0" (1 case, 0 bottles) — this is NOT the number 10.
- ITEM# is the SKU, on the line below the product name.
- BPC = Bottles Per Case (e.g., "BPC: 6-1.0L" = 6 bottles of 1L).
- Columns are: CS/BT | ITEM | UNIT PRICE | UNIT DISCOUNT | UNIT NET AMOUNT | TAXES | TOTAL
- Some items have a second row with per-bottle breakdown prices — this is supplementary info, not a separate line item.
- Use the TOTAL column (rightmost) as total_price.
- Skip DEPOSIT FEE lines.

CRITICAL OCR LAYOUT WARNING: The OCR often reads two adjacent product lines side-by-side, causing ITEM# lines to appear misaligned. When you see consecutive ITEM# lines, match each ITEM# to the product name in the SAME position (1st ITEM# goes with 1st product, 2nd ITEM# with 2nd product).

For example, if OCR reads:
  "1/0 PRODUCT_A"
  "10 PRODUCT_B"
  "ITEM#: 111 BPC: 6-1.0L"
  "ITEM#: 222 BPC: 24-187ML"
Then ITEM# 111 belongs to PRODUCT_A and ITEM# 222 belongs to PRODUCT_B. The "10" before PRODUCT_B is actually "1/0" (1 case, 0 bottles) misread by OCR.

Use BPC as a sanity check: a tequila in 1.0L is typically BPC 6, prosecco in 187ml is typically BPC 24. Match product categories to their plausible BPC.\n\n`;
    }
  }

  prompt += `--- BEGIN OCR TEXT ---\n${ocrText}\n--- END OCR TEXT ---`;

  return prompt;
}

// ==========================================
// EXTRACTION
// ==========================================

/**
 * Extract line items from invoice images using Gemini 2.5 Flash vision.
 *
 * Sends images directly to the Edge Function which downloads them from
 * Storage and forwards to Gemini. The model sees the actual invoice layout,
 * eliminating OCR column-alignment issues.
 *
 * @param storagePaths Supabase Storage paths for the invoice page images
 * @param context Optional context (known distributor name)
 * @returns Parsed extraction result
 */
export async function extractLineItems(
  storagePaths: string[],
  context?: { distributorName?: string },
): Promise<ExtractionResult> {
  let userPrompt = 'Extract all product line items from this invoice image.';
  if (context?.distributorName) {
    userPrompt += `\n\nKnown distributor: ${context.distributorName}`;
  }
  userPrompt += '\n\nReturn ONLY the JSON — no markdown, no explanation.';

  const { data, error } = await supabase.functions.invoke('extract-invoice', {
    body: {
      storagePaths,
      systemPrompt: SYSTEM_PROMPT,
      userPrompt,
    },
  });

  if (error) {
    throw new Error(`Vision extraction failed: ${error.message}`);
  }

  const result = parseExtractionResponse(data);
  result.lineItems = validateAndCorrectLineItems(result.lineItems);
  return result;
}

/**
 * Legacy: Extract from OCR text (for template parsing in future rounds).
 */
export async function extractLineItemsFromText(
  ocrText: string,
  context?: { distributorName?: string },
): Promise<ExtractionResult> {
  const userPrompt = buildUserPrompt(ocrText, context);

  const { data, error } = await supabase.functions.invoke('extract-invoice', {
    body: {
      storagePaths: [],
      systemPrompt: SYSTEM_PROMPT,
      userPrompt: userPrompt + '\n\n--- BEGIN OCR TEXT ---\n' + ocrText + '\n--- END OCR TEXT ---',
    },
  });

  if (error) {
    throw new Error(`Text extraction failed: ${error.message}`);
  }

  const result = parseExtractionResponse(data);
  result.lineItems = validateAndCorrectLineItems(result.lineItems);
  return result;
}

/**
 * Extract from an invoice image directly (Tier 4 — vision).
 * Used when OCR text is too garbled or the invoice is handwritten.
 */
// extractLineItemsFromImage removed — vision is now the default path via extractLineItems()

// ==========================================
// POST-EXTRACTION VALIDATION
// ==========================================

/**
 * Validate extracted line items using math checks and correct obvious errors.
 *
 * Strategy: the numbers on an invoice must be internally consistent.
 * If total_price / (quantity × pack_size) gives an absurd per-bottle price,
 * the quantity or pack_size is probably wrong.
 */
function validateAndCorrectLineItems(items: ExtractedLineItem[]): ExtractedLineItem[] {
  return items.map(item => {
    const corrected = { ...item };
    const pack = corrected.packSize ?? 1;
    const qty = corrected.quantity;
    const total = corrected.totalPrice;

    if (total <= 0 || qty <= 0) return corrected;

    // Calculate what the per-bottle price would be if this is a full case
    const perBottle = total / (qty * pack);

    // --- Check 1: quantity too high ---
    // If per-bottle is absurdly low, quantity is probably wrong
    if (perBottle < 2 && total > 5 && pack > 1 && qty > 1) {
      const perBottleIfQty1 = total / pack;
      if (perBottleIfQty1 >= 2 && perBottleIfQty1 < 200) {
        corrected.quantity = 1;
        corrected.confidence = Math.min(corrected.confidence, 0.7);
      }
    }

    // --- Check 2: single bottle masquerading as a case ---
    // When qty=1 and pack>1, check if total_price makes more sense as a
    // single bottle purchase rather than a full case. A case of 12 × 1L spirits
    // typically costs $100+. If total is well below that, it's likely 1 bottle.
    if (qty === 1 && pack > 1) {
      const caseThreshold = getCaseMinPrice(pack);
      if (total < caseThreshold) {
        // total_price looks like a single bottle price, not a case price
        corrected.packSize = 1;
        corrected.unit = 'bottle';
        corrected.confidence = Math.min(corrected.confidence, 0.7);
      }
    }

    // --- Check 3: per-bottle absurdly high ---
    const finalPack = corrected.packSize ?? 1;
    const finalPerBottle = total / (corrected.quantity * finalPack);
    if (finalPerBottle > 300 && finalPack > 1) {
      corrected.packSize = 1;
      corrected.unit = 'bottle';
      corrected.confidence = Math.min(corrected.confidence, 0.6);
    }

    // Recalculate unit_price to be consistent
    const recalcPack = corrected.packSize ?? 1;
    const recalcQty = corrected.quantity;
    if (recalcQty > 0 && recalcPack > 0) {
      corrected.unitPrice = round2(total / (recalcQty * recalcPack));
    }

    // If unit is "case" but effectively 1 unit, call it a bottle
    if (corrected.unit === 'case' && recalcQty === 1 && recalcPack === 1) {
      corrected.unit = 'bottle';
    }

    return corrected;
  });
}

/**
 * Minimum plausible price for a full case, based on pack size.
 * Used to detect single-bottle purchases miscategorised as cases.
 */
function getCaseMinPrice(packSize: number): number {
  // A case of spirits: minimum ~$5/bottle × pack_size
  // Small bottles (187ml) are cheaper, so lower the threshold
  if (packSize >= 24) return 50;  // 24-pack of minis: at least $50
  if (packSize >= 12) return 80;  // 12-pack of 1L: at least $80
  if (packSize >= 6) return 60;   // 6-pack of 750ml/1L: at least $60
  return 25;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

// ==========================================
// RESPONSE PARSING
// ==========================================

/**
 * Parse and validate the LLM JSON response into our typed result.
 * Handles common LLM output issues (markdown wrappers, trailing commas).
 */
function parseExtractionResponse(data: unknown): ExtractionResult {
  let json: any;

  if (typeof data === 'string') {
    // Strip markdown code fences if present
    let cleaned = data.trim();
    if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
    }
    json = JSON.parse(cleaned);
  } else {
    json = data;
  }

  // Validate and map to our types
  const lineItems: ExtractedLineItem[] = (json.line_items ?? []).map(
    (item: any): ExtractedLineItem => ({
      sku: item.sku ?? null,
      productName: item.product_name ?? 'Unknown Product',
      quantity: Number(item.quantity) || 1,
      unit: normaliseUnit(item.unit ?? 'each'),
      unitPrice: item.unit_price != null ? Number(item.unit_price) : null,
      totalPrice: Math.abs(Number(item.total_price) || 0),
      packSize: parsePackSize(item.pack_size),
      isCredit: Boolean(item.is_credit),
      rawText: item.raw_text ?? '',
      confidence: Math.min(1, Math.max(0, Number(item.confidence) || 0.5)),
    }),
  );

  return {
    lineItems,
    distributorName: json.distributor_name ?? null,
    invoiceNumber: json.invoice_number ?? null,
    invoiceDate: json.invoice_date ?? null,
    warnings: Array.isArray(json.warnings) ? json.warnings : [],
  };
}

/**
 * Normalise unit abbreviations to a consistent set.
 */
function normaliseUnit(unit: string): string {
  const u = unit.toLowerCase().trim();
  const map: Record<string, string> = {
    cs: 'case', cse: 'case', case: 'case', cases: 'case',
    bt: 'bottle', btl: 'bottle', bottle: 'bottle', bottles: 'bottle',
    ea: 'each', each: 'each',
    kg: 'keg', keg: 'keg', kegs: 'keg',
    cn: 'can', can: 'can', cans: 'can',
    pk: 'pack', pack: 'pack', packs: 'pack',
  };
  return map[u] ?? u;
}

/**
 * Parse pack_size from various LLM formats.
 * Handles: 6, "6", "6 - 1.0L", "6-750ML", "BPC: 12-1.0L", null
 */
function parsePackSize(value: unknown): number | null {
  if (value == null) return null;
  if (typeof value === 'number') return value > 0 ? value : null;
  if (typeof value === 'string') {
    // Extract leading number from strings like "6 - 1.0L" or "12-750ML"
    const match = value.match(/^(\d+)/);
    if (match) {
      const n = parseInt(match[1], 10);
      return n > 0 ? n : null;
    }
  }
  return null;
}

// ==========================================
// COST ESTIMATION
// ==========================================

/**
 * Estimate the processing cost for a Tier 3 or Tier 4 extraction.
 * Used to update invoices.processing_cost_cents.
 */
export function estimateExtractionCost(
  tier: 'llm' | 'vision',
  inputChars: number,
): number {
  // Rough token estimate: ~4 chars per token
  const inputTokens = Math.ceil(inputChars / 4);
  const outputTokens = 1000; // typical structured output

  if (tier === 'llm') {
    // Haiku pricing: $0.25/M input, $1.25/M output (as of early 2025)
    const cost = (inputTokens * 0.25 + outputTokens * 1.25) / 1_000_000;
    return Math.ceil(cost * 100); // cents
  } else {
    // Sonnet pricing: $3/M input, $15/M output
    const cost = (inputTokens * 3 + outputTokens * 15) / 1_000_000;
    return Math.ceil(cost * 100);
  }
}
