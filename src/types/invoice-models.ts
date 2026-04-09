/**
 * TypeScript models for Invoice Scanning feature.
 * Matches the schema defined in migrations/001_invoice_scanning.sql.
 */

import type { Volume } from './models';

// ==========================================
// GLOBAL CATALOG TYPES
// ==========================================

export interface CanonicalProduct {
  id: string;
  name: string;
  brand?: string;
  category?: string;       // Spirit, Beer, Wine, Mixer, Garnish
  subcategory?: string;    // Vodka, Bourbon, IPA, Pinot Noir
  defaultSizes?: Volume[];
  abv?: number;
  origin?: string;
  description?: string;
  imageUrl?: string;
  flavorNotes?: string[];
  enrichmentStatus: 'pending' | 'complete' | 'failed';
  enrichedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Distributor {
  id: string;
  name: string;
  type?: string;           // broadline, spirits, beer, wine
  regions?: string[];      // state codes
  detectionPatterns?: string[];
  createdAt: Date;
}

export interface DistributorSku {
  id: string;
  distributorId: string;
  sku: string;
  rawProductName?: string;
  canonicalProductId?: string;
  productSize?: Volume;
  packSize: number;
  confidence: number;
  verified: boolean;
  verifiedByCount: number;
  region?: string;
  createdAt: Date;
}

// ==========================================
// USER-SCOPED TYPES
// ==========================================

export type InvoiceStatus = 'processing' | 'review' | 'complete' | 'failed';
export type ProcessingTier = 'template' | 'fuzzy' | 'llm' | 'vision';
export type MatchMethod = 'sku_exact' | 'fuzzy' | 'llm' | 'manual';
export type MatchStatus = 'auto_matched' | 'confirmed' | 'corrected' | 'unmatched' | 'skipped' | 'credit';

export interface Invoice {
  id: string;
  userId: string;
  distributorId?: string;
  distributorName?: string;  // denormalized for display
  invoiceDate?: Date;
  invoiceNumber?: string;
  imageUrls: string[];       // Supabase Storage paths
  rawOcrText?: string;
  status: InvoiceStatus;
  processingTier?: ProcessingTier;
  processingCostCents: number;
  totalItems: number;
  matchedItems: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface InvoiceLineItem {
  id: string;
  invoiceId: string;
  lineNumber?: number;
  rawText?: string;
  sku?: string;
  productName?: string;
  quantity?: number;
  unit?: string;             // case, bottle, each
  unitPrice?: number;
  totalPrice?: number;
  packSize?: number;

  // Matching results
  matchedIngredientId?: string;
  matchedIngredientName?: string;  // denormalized for display
  canonicalProductId?: string;
  distributorSkuId?: string;
  matchMethod?: MatchMethod;
  matchConfidence?: number;
  matchStatus: MatchStatus;

  createdAt: Date;
}

export interface OrgProductMapping {
  id: string;
  userId: string;
  canonicalProductId: string;
  ingredientId: string;
  customName?: string;
  autoUpdatePrice: boolean;
  createdAt: Date;
}

export interface IngredientConfiguration {
  id: string;
  ingredientId: string;
  productSize: Volume;
  productCost: number;
  packSize: number;
  packCost?: number;
  isDefault: boolean;
  source: 'manual' | 'invoice' | 'barcode';
  lastInvoiceId?: string;
  lastUpdatedPriceAt?: Date;
  createdAt: Date;
}

export interface IngredientPriceHistory {
  id: string;
  ingredientId: string;
  invoiceLineItemId?: string;
  oldPrice?: number;
  newPrice: number;
  priceChangePct?: number;
  recordedAt: Date;
}

// ==========================================
// DISPLAY / UI TYPES
// ==========================================

/** Line items grouped by match status for the review screen */
export interface InvoiceReviewGroups {
  autoMatched: InvoiceLineItem[];    // confidence >= 0.85
  needsConfirmation: InvoiceLineItem[];  // confidence 0.6–0.85
  unmatched: InvoiceLineItem[];      // no match found
  skipped: InvoiceLineItem[];        // user skipped (non-ingredient items)
}

/** Summary counts for an invoice card in the list */
export interface InvoiceSummary {
  invoice: Invoice;
  distributorName?: string;
  autoMatchedCount: number;
  needsConfirmationCount: number;
  unmatchedCount: number;
}
