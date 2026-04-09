/**
 * Supabase data access layer for Invoice Scanning.
 * Follows the same pattern as supabase-data.ts — snake_case DB rows to camelCase models.
 */

import { supabase } from './supabase';
import type {
  Invoice,
  InvoiceLineItem,
  IngredientConfiguration,
  IngredientPriceHistory,
  InvoiceStatus,
  MatchStatus,
} from '@/src/types/invoice-models';
import type { Volume } from '@/src/types/models';

// ==========================================
// ROW TYPES
// ==========================================

interface InvoiceRow {
  id: string;
  user_id: string;
  distributor_id: string | null;
  invoice_date: string | null;
  invoice_number: string | null;
  image_urls: string[];
  raw_ocr_text: string | null;
  status: string;
  processing_tier: string | null;
  processing_cost_cents: number;
  total_items: number;
  matched_items: number;
  created_at: string;
  updated_at: string;
  // joined
  distributors?: { name: string } | null;
}

interface InvoiceLineItemRow {
  id: string;
  invoice_id: string;
  line_number: number | null;
  raw_text: string | null;
  sku: string | null;
  product_name: string | null;
  quantity: number | null;
  unit: string | null;
  unit_price: number | null;
  total_price: number | null;
  pack_size: number | null;
  matched_ingredient_id: string | null;
  canonical_product_id: string | null;
  distributor_sku_id: string | null;
  match_method: string | null;
  match_confidence: number | null;
  match_status: string;
  created_at: string;
  // joined
  ingredients?: { name: string } | null;
}

interface IngredientConfigRow {
  id: string;
  ingredient_id: string;
  product_size: Volume;
  product_cost: number;
  pack_size: number;
  pack_cost: number | null;
  is_default: boolean;
  source: string;
  last_invoice_id: string | null;
  last_updated_price_at: string | null;
  created_at: string;
}

interface PriceHistoryRow {
  id: string;
  ingredient_id: string;
  invoice_line_item_id: string | null;
  old_price: number | null;
  new_price: number;
  price_change_pct: number | null;
  recorded_at: string;
}

// ==========================================
// ROW → MODEL CONVERTERS
// ==========================================

function rowToInvoice(row: InvoiceRow): Invoice {
  return {
    id: row.id,
    userId: row.user_id,
    distributorId: row.distributor_id ?? undefined,
    distributorName: row.distributors?.name,
    invoiceDate: row.invoice_date ? new Date(row.invoice_date) : undefined,
    invoiceNumber: row.invoice_number ?? undefined,
    imageUrls: row.image_urls ?? [],
    rawOcrText: row.raw_ocr_text ?? undefined,
    status: row.status as InvoiceStatus,
    processingTier: row.processing_tier as Invoice['processingTier'],
    processingCostCents: row.processing_cost_cents,
    totalItems: row.total_items,
    matchedItems: row.matched_items,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

function rowToLineItem(row: InvoiceLineItemRow): InvoiceLineItem {
  return {
    id: row.id,
    invoiceId: row.invoice_id,
    lineNumber: row.line_number ?? undefined,
    rawText: row.raw_text ?? undefined,
    sku: row.sku ?? undefined,
    productName: row.product_name ?? undefined,
    quantity: row.quantity != null ? Number(row.quantity) : undefined,
    unit: row.unit ?? undefined,
    unitPrice: row.unit_price != null ? Number(row.unit_price) : undefined,
    totalPrice: row.total_price != null ? Number(row.total_price) : undefined,
    packSize: row.pack_size ?? undefined,
    matchedIngredientId: row.matched_ingredient_id ?? undefined,
    matchedIngredientName: row.ingredients?.name,
    canonicalProductId: row.canonical_product_id ?? undefined,
    distributorSkuId: row.distributor_sku_id ?? undefined,
    matchMethod: row.match_method as InvoiceLineItem['matchMethod'],
    matchConfidence: row.match_confidence != null ? Number(row.match_confidence) : undefined,
    matchStatus: row.match_status as MatchStatus,
    createdAt: new Date(row.created_at),
  };
}

function rowToConfig(row: IngredientConfigRow): IngredientConfiguration {
  return {
    id: row.id,
    ingredientId: row.ingredient_id,
    productSize: row.product_size,
    productCost: Number(row.product_cost),
    packSize: row.pack_size,
    packCost: row.pack_cost != null ? Number(row.pack_cost) : undefined,
    isDefault: row.is_default,
    source: row.source as IngredientConfiguration['source'],
    lastInvoiceId: row.last_invoice_id ?? undefined,
    lastUpdatedPriceAt: row.last_updated_price_at ? new Date(row.last_updated_price_at) : undefined,
    createdAt: new Date(row.created_at),
  };
}

function rowToPriceHistory(row: PriceHistoryRow): IngredientPriceHistory {
  return {
    id: row.id,
    ingredientId: row.ingredient_id,
    invoiceLineItemId: row.invoice_line_item_id ?? undefined,
    oldPrice: row.old_price != null ? Number(row.old_price) : undefined,
    newPrice: Number(row.new_price),
    priceChangePct: row.price_change_pct != null ? Number(row.price_change_pct) : undefined,
    recordedAt: new Date(row.recorded_at),
  };
}

// ==========================================
// INVOICES CRUD
// ==========================================

export async function fetchInvoices(): Promise<Invoice[]> {
  const { data, error } = await supabase
    .from('invoices')
    .select('*, distributors(name)')
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return (data as InvoiceRow[]).map(rowToInvoice);
}

export async function fetchInvoiceById(id: string): Promise<Invoice | null> {
  const { data, error } = await supabase
    .from('invoices')
    .select('*, distributors(name)')
    .eq('id', id)
    .single();

  if (error) return null;
  return rowToInvoice(data as InvoiceRow);
}

export interface CreateInvoiceParams {
  imageUrls: string[];
  distributorId?: string;
  invoiceDate?: Date;
  invoiceNumber?: string;
}

export async function insertInvoice(params: CreateInvoiceParams): Promise<Invoice> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('invoices')
    .insert({
      user_id: user.id,
      image_urls: params.imageUrls,
      distributor_id: params.distributorId ?? null,
      invoice_date: params.invoiceDate?.toISOString().split('T')[0] ?? null,
      invoice_number: params.invoiceNumber ?? null,
      status: 'processing',
    })
    .select('*, distributors(name)')
    .single();

  if (error) throw new Error(error.message);
  return rowToInvoice(data as InvoiceRow);
}

export async function updateInvoiceStatus(
  id: string,
  status: InvoiceStatus,
  extras?: { rawOcrText?: string; totalItems?: number; matchedItems?: number; processingTier?: string }
): Promise<void> {
  const row: Record<string, unknown> = { status };
  if (extras?.rawOcrText !== undefined) row.raw_ocr_text = extras.rawOcrText;
  if (extras?.totalItems !== undefined) row.total_items = extras.totalItems;
  if (extras?.matchedItems !== undefined) row.matched_items = extras.matchedItems;
  if (extras?.processingTier !== undefined) row.processing_tier = extras.processingTier;

  const { error } = await supabase
    .from('invoices')
    .update(row)
    .eq('id', id);

  if (error) throw new Error(error.message);
}

export async function deleteInvoiceById(id: string): Promise<void> {
  const { error } = await supabase
    .from('invoices')
    .delete()
    .eq('id', id);

  if (error) throw new Error(error.message);
}

// ==========================================
// INVOICE LINE ITEMS
// ==========================================

export async function fetchLineItemsForInvoice(invoiceId: string): Promise<InvoiceLineItem[]> {
  const { data, error } = await supabase
    .from('invoice_line_items')
    .select('*, ingredients(name)')
    .eq('invoice_id', invoiceId)
    .order('line_number', { ascending: true });

  if (error) throw new Error(error.message);
  return (data as InvoiceLineItemRow[]).map(rowToLineItem);
}

export async function updateLineItemMatch(
  id: string,
  updates: {
    matchedIngredientId?: string | null;
    matchStatus: MatchStatus;
    matchMethod?: InvoiceLineItem['matchMethod'];
    matchConfidence?: number;
  }
): Promise<void> {
  const { error } = await supabase
    .from('invoice_line_items')
    .update({
      matched_ingredient_id: updates.matchedIngredientId ?? null,
      match_status: updates.matchStatus,
      match_method: updates.matchMethod ?? null,
      match_confidence: updates.matchConfidence ?? null,
    })
    .eq('id', id);

  if (error) throw new Error(error.message);
}

// ==========================================
// INGREDIENT CONFIGURATIONS
// ==========================================

export async function fetchConfigsForIngredient(ingredientId: string): Promise<IngredientConfiguration[]> {
  const { data, error } = await supabase
    .from('ingredient_configurations')
    .select('*')
    .eq('ingredient_id', ingredientId)
    .order('is_default', { ascending: false });

  if (error) throw new Error(error.message);
  return (data as IngredientConfigRow[]).map(rowToConfig);
}

export async function upsertIngredientConfiguration(
  config: Omit<IngredientConfiguration, 'id' | 'createdAt'>
): Promise<IngredientConfiguration> {
  const { data, error } = await supabase
    .from('ingredient_configurations')
    .upsert({
      ingredient_id: config.ingredientId,
      product_size: config.productSize,
      product_cost: config.productCost,
      pack_size: config.packSize,
      pack_cost: config.packCost ?? null,
      is_default: config.isDefault,
      source: config.source,
      last_invoice_id: config.lastInvoiceId ?? null,
      last_updated_price_at: config.lastUpdatedPriceAt?.toISOString() ?? null,
    }, { onConflict: 'ingredient_id,product_size,pack_size' })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return rowToConfig(data as IngredientConfigRow);
}

// ==========================================
// PRICE HISTORY
// ==========================================

export async function fetchPriceHistory(
  ingredientId: string,
  limit = 20
): Promise<IngredientPriceHistory[]> {
  const { data, error } = await supabase
    .from('ingredient_price_history')
    .select('*')
    .eq('ingredient_id', ingredientId)
    .order('recorded_at', { ascending: false })
    .limit(limit);

  if (error) throw new Error(error.message);
  return (data as PriceHistoryRow[]).map(rowToPriceHistory);
}

export async function recordPriceChange(params: {
  ingredientId: string;
  invoiceLineItemId?: string;
  oldPrice?: number;
  newPrice: number;
}): Promise<void> {
  const priceChangePct = params.oldPrice
    ? ((params.newPrice - params.oldPrice) / params.oldPrice) * 100
    : null;

  const { error } = await supabase
    .from('ingredient_price_history')
    .insert({
      ingredient_id: params.ingredientId,
      invoice_line_item_id: params.invoiceLineItemId ?? null,
      old_price: params.oldPrice ?? null,
      new_price: params.newPrice,
      price_change_pct: priceChangePct,
    });

  if (error) throw new Error(error.message);
}

// ==========================================
// STORAGE UPLOAD
// ==========================================

/**
 * Upload invoice image to Supabase Storage.
 * Returns the storage path for saving in invoices.image_urls.
 */
export async function uploadInvoiceImage(
  imageUri: string,
  invoiceId: string,
  pageIndex: number
): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const ext = imageUri.split('.').pop()?.toLowerCase() ?? 'jpg';
  const contentType = `image/${ext === 'jpg' ? 'jpeg' : ext}`;
  const storagePath = `${user.id}/${invoiceId}/page_${pageIndex}.${ext}`;

  // Use FormData — the only reliable way to upload files in React Native
  const formData = new FormData();
  formData.append('', {
    uri: imageUri,
    name: `page_${pageIndex}.${ext}`,
    type: contentType,
  } as any);

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('No session');

  const uploadUrl = `${process.env.EXPO_PUBLIC_SUPABASE_URL}/storage/v1/object/invoices/${storagePath}`;

  const response = await fetch(uploadUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${session.access_token}`,
      apikey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!,
      'x-upsert': 'true',
    },
    body: formData,
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Upload failed (${response.status}): ${errText}`);
  }

  return storagePath;
}

/**
 * Get a signed URL for displaying an invoice image.
 */
export async function getInvoiceImageUrl(storagePath: string): Promise<string> {
  const { data, error } = await supabase.storage
    .from('invoices')
    .createSignedUrl(storagePath, 60 * 60); // 1 hour

  if (error || !data) throw new Error(error?.message ?? 'Failed to get image URL');
  return data.signedUrl;
}
