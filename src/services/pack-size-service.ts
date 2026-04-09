/**
 * Pack Size Disambiguation Service
 *
 * Resolves the ambiguity in how distributors express pack sizes on invoices.
 * The same product can appear as:
 *
 *   "TITOS HM VODKA 6/750ML"     → 6 bottles of 750ml (pack_size = 6)
 *   "TITOS HM VODKA 750ML  QTY 6" → 6 individual 750ml bottles (pack_size = 1, qty = 6)
 *   "TITOS HM VODKA 1.75L CS"    → 1 case (pack_size varies by distributor, usually 6)
 *   "6 TITOS HM VODKA 750ML"     → 6 bottles (pack_size = 1, qty = 6)
 *
 * The key question: does a number represent pack_size (units per case)
 * or quantity (number of units ordered)?
 *
 * Resolution strategy:
 *   1. Parse structural patterns from the raw text
 *   2. Cross-reference with known distributor_skus pack_size data
 *   3. Apply distributor-specific conventions
 *   4. When ambiguous, flag for user confirmation
 */

import { supabase } from '@/src/lib/supabase';
import type { Volume } from '@/src/types/models';
import type { ExtractedLineItem } from './llm-extraction-service';

// ==========================================
// TYPES
// ==========================================

export interface ResolvedPackInfo {
  /** Units per case/pack (1 = individual bottle) */
  packSize: number;
  /** Number of packs/units ordered */
  quantity: number;
  /** Size of individual bottle/can */
  unitVolume: Volume | null;
  /** Price per individual bottle/unit */
  unitPrice: number;
  /** Was this confidently resolved or does user need to confirm? */
  needsConfirmation: boolean;
  /** Explanation for the user if confirmation is needed */
  confirmationPrompt?: string;
}

// ==========================================
// PACK SIZE PATTERNS
// ==========================================

/**
 * Patterns that indicate pack configuration in invoice text.
 * Ordered by specificity — first match wins.
 */
const PACK_PATTERNS: {
  regex: RegExp;
  extract: (m: RegExpMatchArray) => { packSize: number; volumeMl: number | null };
}[] = [
  // "6/750ML" or "12/355ML" — slash notation is almost always pack/bottle-size
  {
    regex: /(\d+)\s*\/\s*(\d+)\s*ml/i,
    extract: (m) => ({ packSize: int(m[1]), volumeMl: int(m[2]) }),
  },
  // "6×750ml" or "6x750ml"
  {
    regex: /(\d+)\s*[×x]\s*(\d+)\s*ml/i,
    extract: (m) => ({ packSize: int(m[1]), volumeMl: int(m[2]) }),
  },
  // "CS 12" or "CS12" — case of 12
  {
    regex: /\bcs\s*(\d+)/i,
    extract: (m) => ({ packSize: int(m[1]), volumeMl: null }),
  },
  // "12PK" or "12-PK" or "12 PACK"
  {
    regex: /(\d+)\s*-?\s*(?:pk|pack)\b/i,
    extract: (m) => ({ packSize: int(m[1]), volumeMl: null }),
  },
  // "CASE OF 6" or "CASE (6)"
  {
    regex: /case\s*(?:of\s*)?\(?(\d+)\)?/i,
    extract: (m) => ({ packSize: int(m[1]), volumeMl: null }),
  },
  // "750ML" alone — single bottle, no pack info
  {
    regex: /\b(\d+)\s*ml\b/i,
    extract: (m) => ({ packSize: 1, volumeMl: int(m[1]) }),
  },
  // "1.75L" or "1L" or "750 ML"
  {
    regex: /(\d+(?:\.\d+)?)\s*l(?:tr|iter|itre)?s?\b/i,
    extract: (m) => ({ packSize: 1, volumeMl: Math.round(parseFloat(m[1]) * 1000) }),
  },
];

// ==========================================
// MAIN RESOLUTION
// ==========================================

/**
 * Resolve pack size and per-unit pricing for an extracted line item.
 */
export function resolvePackSize(
  item: ExtractedLineItem,
  knownPackSize?: number,
): ResolvedPackInfo {
  const rawText = `${item.productName} ${item.rawText}`;

  // Step 1: Check if the LLM already extracted a pack_size
  if (item.packSize && item.packSize > 1) {
    return resolveWithPackSize(item, item.packSize);
  }

  // Step 2: Check known distributor_skus pack_size
  if (knownPackSize && knownPackSize > 1) {
    return resolveWithPackSize(item, knownPackSize);
  }

  // Step 3: Parse patterns from raw text
  const parsed = parsePackFromText(rawText);
  if (parsed) {
    // If parsed pack_size > 1, we have a case/pack scenario
    if (parsed.packSize > 1) {
      return resolveWithPackSize(item, parsed.packSize, parsed.volumeMl);
    }
    // Single bottle with known volume
    return {
      packSize: 1,
      quantity: item.quantity,
      unitVolume: parsed.volumeMl ? mlToVolume(parsed.volumeMl) : null,
      unitPrice: item.unitPrice ?? item.totalPrice / item.quantity,
      needsConfirmation: false,
    };
  }

  // Step 4: Check unit field for hints
  const unitHint = resolveFromUnit(item.unit, item.quantity);
  if (unitHint) return unitHint(item);

  // Step 5: Default — assume individual units
  return {
    packSize: 1,
    quantity: item.quantity,
    unitVolume: null,
    unitPrice: item.unitPrice ?? item.totalPrice / Math.max(item.quantity, 1),
    needsConfirmation: false,
  };
}

/**
 * Resolve pack sizes for all line items, cross-referencing with
 * known SKU data from the database when a distributor is identified.
 */
export async function resolvePackSizesForInvoice(
  items: ExtractedLineItem[],
  distributorId?: string,
): Promise<Map<number, ResolvedPackInfo>> {
  // Pre-fetch known pack sizes for this distributor's SKUs
  let skuPackSizes = new Map<string, number>();
  if (distributorId) {
    const { data: skus } = await supabase
      .from('distributor_skus')
      .select('sku, pack_size')
      .eq('distributor_id', distributorId);

    if (skus) {
      for (const s of skus) {
        if (s.sku && s.pack_size > 1) {
          skuPackSizes.set(s.sku, s.pack_size);
        }
      }
    }
  }

  const results = new Map<number, ResolvedPackInfo>();

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const knownPack = item.sku ? skuPackSizes.get(item.sku) : undefined;
    results.set(i, resolvePackSize(item, knownPack));
  }

  return results;
}

// ==========================================
// INTERNAL HELPERS
// ==========================================

function resolveWithPackSize(
  item: ExtractedLineItem,
  packSize: number,
  volumeMl?: number | null,
): ResolvedPackInfo {
  // Determine if quantity is number of cases or number of bottles.
  // Heuristic: if totalPrice / quantity gives a reasonable per-case price
  // (> $20 for spirits), quantity is likely cases.
  const pricePerQtyUnit = item.totalPrice / Math.max(item.quantity, 1);
  const likelyCases = pricePerQtyUnit > 15; // cases are expensive

  if (likelyCases) {
    // quantity = number of cases, each case has packSize bottles
    const totalBottles = item.quantity * packSize;
    const unitPrice = item.totalPrice / totalBottles;

    // If price looks unreasonable (< $1/bottle for spirits), flag it
    if (unitPrice < 1 && !item.isCredit) {
      return {
        packSize,
        quantity: item.quantity,
        unitVolume: volumeMl ? mlToVolume(volumeMl) : null,
        unitPrice: round2(unitPrice),
        needsConfirmation: true,
        confirmationPrompt: `Is this ${item.quantity} cases of ${packSize}, or ${item.quantity} individual bottles?`,
      };
    }

    return {
      packSize,
      quantity: item.quantity,
      unitVolume: volumeMl ? mlToVolume(volumeMl) : null,
      unitPrice: round2(unitPrice),
      needsConfirmation: false,
    };
  }

  // quantity might be individual bottles
  const unitPrice = item.unitPrice ?? item.totalPrice / Math.max(item.quantity, 1);
  return {
    packSize,
    quantity: item.quantity,
    unitVolume: volumeMl ? mlToVolume(volumeMl) : null,
    unitPrice: round2(unitPrice),
    needsConfirmation: pricePerQtyUnit < 50, // low confidence if cheap
  };
}

function parsePackFromText(
  text: string,
): { packSize: number; volumeMl: number | null } | null {
  for (const { regex, extract } of PACK_PATTERNS) {
    const match = text.match(regex);
    if (match) {
      return extract(match);
    }
  }
  return null;
}

/**
 * Infer pack info from the unit field.
 * Returns a factory function that creates the ResolvedPackInfo.
 */
function resolveFromUnit(
  unit: string,
  quantity: number,
): ((item: ExtractedLineItem) => ResolvedPackInfo) | null {
  const u = unit.toLowerCase();

  if (u === 'case') {
    // Unit is "case" but we don't know how many bottles per case.
    // Flag for confirmation with common defaults.
    return (item) => ({
      packSize: 12, // default assumption for spirits cases
      quantity,
      unitVolume: null,
      unitPrice: round2(item.totalPrice / (quantity * 12)),
      needsConfirmation: true,
      confirmationPrompt: `How many bottles per case? (Common: 6 for 1.75L, 12 for 750ml)`,
    });
  }

  if (u === 'bottle' || u === 'each') {
    return (item) => ({
      packSize: 1,
      quantity,
      unitVolume: null,
      unitPrice: item.unitPrice ?? round2(item.totalPrice / Math.max(quantity, 1)),
      needsConfirmation: false,
    });
  }

  return null;
}

function mlToVolume(ml: number): Volume {
  return { kind: 'milliliters', ml };
}

function int(s: string): number {
  return parseInt(s, 10);
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
