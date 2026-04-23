/**
 * Product Normalization Service
 *
 * Cleans raw invoice product names into clean, human-readable ingredient names.
 * Also extracts structured metadata: proof, bottle volume, packaging info.
 *
 * Raw: "ESPOLON TEQ REPOSADO 80"
 * Clean: "Espolon Tequila Reposado"
 * Metadata: { proof: 80, category: 'Spirit', subcategory: 'Tequila' }
 *
 * Raw: "RUFFINO PROSECCO(SC)LSE"
 * Clean: "Ruffino Prosecco"
 * Metadata: { category: 'Wine', subcategory: 'Prosecco' }
 */

import type { Volume } from '@/src/types/models';

// ==========================================
// TYPES
// ==========================================

export interface NormalizedProduct {
  /** Clean, title-cased product name */
  name: string;
  /** Proof/ABV if present (80 proof = 40% ABV) */
  proof: number | null;
  /** Bottle/container volume parsed from BPC or name */
  volume: Volume | null;
  /** Pack size (bottles per case) */
  packSize: number | null;
  /** Detected category */
  category: string | null;
  /** Detected subcategory */
  subcategory: string | null;
  /** True if this is a non-product line (deposit, fee, tax) */
  isNonProduct: boolean;
  /** Per-bottle price (total / qty / packSize) */
  perBottlePrice: number | null;
}

// ==========================================
// NON-PRODUCT PATTERNS
// ==========================================

const NON_PRODUCT_PATTERNS = [
  /\bdeposit\s*(fee)?\b/i,
  /\bdelivery\s*(fee|charge)?\b/i,
  /\bfuel\s*surcharge\b/i,
  /\bservice\s*(fee|charge)\b/i,
  /\btax\b/i,
  /\bsubtotal\b/i,
  /\btotal\b/i,
  /\bdiscount\b/i,
  /\bcredit\s*memo\b/i,
  /\bfreight\b/i,
  /\brecycl/i,
  /\bcrv\b/i, // California Redemption Value
];

// ==========================================
// ABBREVIATION EXPANSIONS
// ==========================================

const ABBREVIATIONS: [RegExp, string][] = [
  // Spirit types
  [/\bTEQ\b/gi, 'Tequila'],
  [/\bVDKA?\b/gi, 'Vodka'],
  [/\bWHSKY?\b/gi, 'Whiskey'],
  [/\bBRBN\b/gi, 'Bourbon'],
  [/\bSCHN\b/gi, 'Schnapps'],
  [/\bCOGN?\b/gi, 'Cognac'],
  [/\bLIQ\b/gi, 'Liqueur'],
  [/\bANEJO\b/gi, 'Añejo'],

  // Packaging descriptors — remove entirely
  [/\(SC\)LSE/gi, ''],       // Screw cap / loose
  [/\(BAR\)/gi, ''],          // Bar size
  [/\(TRAV?L?\)/gi, ''],      // Traveler
  [/\(PET\)/gi, ''],          // PET bottle
  [/\(CAN\)/gi, ''],          // Can
  [/\bLSE\b/gi, ''],          // Loose
  [/\bPRM\b/gi, 'Premium'],

  // Age descriptors
  [/\bYRC\b/gi, ''],          // Year old (remove — age is in the proof spot)
  [/\bYO\b/gi, ''],           // Year old
  [/\bYR\b/gi, 'Year'],
  [/\bSGL\s*MLT\b/gi, 'Single Malt'],

  // Other
  [/\bHM\b/gi, 'Handmade'],
  [/\bHMADE\b/gi, 'Handmade'],
  [/\bIMPRT\b/gi, 'Imported'],
  [/\bSPCL\b/gi, 'Special'],
  [/\bRSRV\b/gi, 'Reserve'],
  [/\bSLCT\b/gi, 'Select'],
  [/\bORG\b/gi, 'Original'],
  [/\bFLVR?D?\b/gi, 'Flavored'],
  [/\bUNFLT\b/gi, 'Unfiltered'],
];

// ==========================================
// KNOWN BRAND CASING
// ==========================================

const BRAND_CASING: Record<string, string> = {
  'dekuyper': 'DeKuyper',
  'dewars': "Dewar's",
  'dewar\'s': "Dewar's",
  'jameson': 'Jameson',
  'jack daniels': 'Jack Daniel\'s',
  'jack daniel\'s': 'Jack Daniel\'s',
  'jim beam': 'Jim Beam',
  'johnny walker': 'Johnnie Walker',
  'johnnie walker': 'Johnnie Walker',
  'titos': "Tito's",
  'tito\'s': "Tito's",
  'grey goose': 'Grey Goose',
  'maker\'s mark': "Maker's Mark",
  'makers mark': "Maker's Mark",
  'don julio': 'Don Julio',
  'patron': 'Patrón',
  'hennessy': 'Hennessy',
  'remy martin': 'Rémy Martin',
  'moet': 'Moët',
  'veuve clicquot': 'Veuve Clicquot',
};

// ==========================================
// VOLUME PARSING
// ==========================================

/**
 * Parse a BPC string like "6 - 1.0L" or "24 - 187ML" into volume + pack size.
 * Also handles raw_text patterns like "750ML", "1.75L", "19.5L".
 */
export function parseVolumeFromBpc(bpcOrText: string): { volume: Volume | null; packSize: number | null } {
  // Pattern: "6 - 1.0L" or "12-750ML" or "24 - 187ML"
  const bpcMatch = bpcOrText.match(/(\d+)\s*[-–]\s*(\d+(?:\.\d+)?)\s*(L|ML|GAL)/i);
  if (bpcMatch) {
    const packSize = parseInt(bpcMatch[1], 10);
    const sizeNum = parseFloat(bpcMatch[2]);
    const unit = bpcMatch[3].toUpperCase();
    const ml = unit === 'L' ? sizeNum * 1000
      : unit === 'GAL' ? sizeNum * 3785.41
      : sizeNum;

    return {
      volume: { kind: 'milliliters', ml },
      packSize: packSize > 0 ? packSize : null,
    };
  }

  // Standalone volume: "750ML", "1.0L", "1.75L", "19.5L"
  const volMatch = bpcOrText.match(/(\d+(?:\.\d+)?)\s*(L|ML|GAL)\b/i);
  if (volMatch) {
    const sizeNum = parseFloat(volMatch[1]);
    const unit = volMatch[2].toUpperCase();
    const ml = unit === 'L' ? sizeNum * 1000
      : unit === 'GAL' ? sizeNum * 3785.41
      : sizeNum;

    return { volume: { kind: 'milliliters', ml }, packSize: null };
  }

  return { volume: null, packSize: null };
}

// ==========================================
// MAIN NORMALIZATION
// ==========================================

/**
 * Normalize a raw invoice product name and extract metadata.
 */
export function normalizeProduct(
  rawName: string,
  rawText?: string,
  packSize?: number | null,
  totalPrice?: number,
  quantity?: number,
): NormalizedProduct {
  // Check for non-product lines
  const isNonProduct = NON_PRODUCT_PATTERNS.some(p => p.test(rawName));
  if (isNonProduct) {
    return {
      name: rawName,
      proof: null,
      volume: null,
      packSize: null,
      category: null,
      subcategory: null,
      isNonProduct: true,
      perBottlePrice: null,
    };
  }

  let name = rawName;

  // Extract proof (trailing number like "80" or "100")
  let proof: number | null = null;
  const proofMatch = name.match(/\b(\d{2,3})\s*(?:PROOF|PR)?\s*$/i);
  if (proofMatch) {
    const val = parseInt(proofMatch[1], 10);
    // Valid proof range: 30-200
    if (val >= 30 && val <= 200) {
      proof = val;
      name = name.slice(0, proofMatch.index).trim();
    }
  }

  // Expand abbreviations
  for (const [pattern, replacement] of ABBREVIATIONS) {
    name = name.replace(pattern, replacement);
  }

  // Clean up extra whitespace and punctuation
  name = name
    .replace(/\s+/g, ' ')
    .replace(/\s*[,;]\s*$/g, '')
    .trim();

  // Title case
  name = toTitleCase(name);

  // Apply known brand casing
  name = applyBrandCasing(name);

  // Parse volume from raw_text (BPC field)
  let volume: Volume | null = null;
  let parsedPackSize = packSize ?? null;

  if (rawText) {
    const bpcMatch = rawText.match(/BPC:\s*(.+?)(?:\s+\d|$)/i);
    if (bpcMatch) {
      const parsed = parseVolumeFromBpc(bpcMatch[1]);
      volume = parsed.volume;
      if (parsed.packSize && !parsedPackSize) {
        parsedPackSize = parsed.packSize;
      }
    }
  }

  // If no BPC, try parsing volume from the product name itself
  if (!volume) {
    const fromName = parseVolumeFromBpc(rawName);
    volume = fromName.volume;
  }

  // Detect category/subcategory
  const { category, subcategory } = detectCategory(rawName, name);

  // Calculate per-bottle price
  let perBottlePrice: number | null = null;
  if (totalPrice && totalPrice > 0) {
    const qty = quantity ?? 1;
    const ps = parsedPackSize ?? 1;
    perBottlePrice = Math.round((totalPrice / (qty * ps)) * 100) / 100;
  }

  return {
    name,
    proof,
    volume,
    packSize: parsedPackSize,
    category,
    subcategory,
    isNonProduct: false,
    perBottlePrice,
  };
}

// ==========================================
// CATEGORY DETECTION
// ==========================================

function detectCategory(rawName: string, cleanName: string): { category: string | null; subcategory: string | null } {
  const r = rawName.toUpperCase();
  const c = cleanName.toLowerCase();

  // Spirits
  if (/\b(TEQ|TEQUILA)\b/.test(r)) return { category: 'Spirit', subcategory: 'Tequila' };
  if (/\b(VODKA|VDKA?)\b/.test(r)) return { category: 'Spirit', subcategory: 'Vodka' };
  // Whiskey family — bourbon, scotch, rye, Canadian all fold under Whiskey.
  if (/\b(BOURBON|SCOTCH|RYE|WHISKEY|WHSKY|WHISKY|CANADIAN)\b/.test(r))
    return { category: 'Spirit', subcategory: 'Whiskey' };
  if (/\b(RUM)\b/.test(r)) return { category: 'Spirit', subcategory: 'Rum' };
  if (/\b(GIN)\b/.test(r)) return { category: 'Spirit', subcategory: 'Gin' };
  if (/\b(COGNAC|COGN|BRANDY)\b/.test(r)) return { category: 'Spirit', subcategory: 'Brandy' };
  if (/\b(SCHN|SCHNAPPS|LIQUEUR|LIQ)\b/.test(r)) return { category: 'Spirit', subcategory: 'Liqueur' };
  if (/\b(MEZCAL)\b/.test(r)) return { category: 'Spirit', subcategory: 'Mezcal' };

  // Wine
  if (/\b(PROSECCO|CHAMPAGNE|SPARKLING)\b/.test(r)) return { category: 'Wine', subcategory: 'Sparkling' };
  if (/\b(PINOT NOIR|MERLOT|CABERNET|CAB SAUV|MALBEC|SYRAH|SHIRAZ|ZINFANDEL|TEMPRANILLO)\b/.test(r)) return { category: 'Wine', subcategory: 'Red' };
  if (/\b(CHARDONNAY|PINOT GRIGIO|SAUVIGNON BLANC|RIESLING|MOSCATO)\b/.test(r)) return { category: 'Wine', subcategory: 'White' };
  if (/\b(ROSE|ROSÉ)\b/.test(r)) return { category: 'Wine', subcategory: 'Rosé' };

  // Beer
  if (/\b(IPA|ALE|LAGER|STOUT|PILSNER|PORTER|WHEAT|SOUR|HAZY)\b/.test(r)) return { category: 'Beer', subcategory: null };

  // Mixers
  if (/\b(JUICE|SYRUP|SODA|TONIC|BITTERS|MIX|MIXER|GRENADINE)\b/.test(r)) return { category: 'Mixer', subcategory: null };

  return { category: null, subcategory: null };
}

// ==========================================
// HELPERS
// ==========================================

function toTitleCase(str: string): string {
  const lowerWords = new Set(['of', 'the', 'and', 'or', 'in', 'on', 'at', 'to', 'for', 'de', 'du', 'la', 'le']);

  return str
    .toLowerCase()
    .split(' ')
    .map((word, i) => {
      if (i > 0 && lowerWords.has(word)) return word;
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(' ');
}

function applyBrandCasing(name: string): string {
  const lower = name.toLowerCase();
  for (const [pattern, correct] of Object.entries(BRAND_CASING)) {
    const idx = lower.indexOf(pattern);
    if (idx !== -1) {
      name = name.slice(0, idx) + correct + name.slice(idx + pattern.length);
    }
  }
  return name;
}
