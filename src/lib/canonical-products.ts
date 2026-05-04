/**
 * Canonical product catalog queries.
 *
 * The canonical_products table is the global product catalog (see migration
 * 001 + 011). It powers ingredient autocomplete, the education panel on
 * ingredient detail, library recipe matching, and invoice scan matching.
 *
 * RLS is public-read on canonical_products, so unauthenticated reads work
 * fine. Writes require service role.
 */

import { supabase } from './supabase';
import type { Volume } from '@/src/types/models';

/** Tier 1 canonical fields surfaced in the autocomplete + ingredient form prefill. */
export interface CanonicalProductSummary {
  id: string;
  name: string;
  brand: string | null;
  category: string | null;
  subcategory: string | null;
  defaultSizes: Volume[];
  abv: number | null;
  origin: string | null;
  description: string | null;
  flavorNotes: string[];
  imageUrl: string | null;
}

/** Tier 2 fields populated by the enrichment job. All optional; UI degrades
 *  gracefully when null. Education panel renders whatever is available. */
export interface CanonicalProductDetail extends CanonicalProductSummary {
  parentCompany: string | null;
  foundedYear: number | null;
  productionRegion: string | null;
  agingYears: number | null;
  educationData: Record<string, unknown> | null;
  enrichmentStatus: 'pending' | 'complete' | 'failed';
}

interface CanonicalRow {
  id: string;
  name: string;
  brand: string | null;
  category: string | null;
  subcategory: string | null;
  default_sizes: Volume[] | null;
  abv: number | null;
  origin: string | null;
  description: string | null;
  flavor_notes: string[] | null;
  image_url: string | null;
}

interface CanonicalDetailRow extends CanonicalRow {
  parent_company: string | null;
  founded_year: number | null;
  production_region: string | null;
  aging_years: number | null;
  education_data: Record<string, unknown> | null;
  enrichment_status: 'pending' | 'complete' | 'failed';
}

function rowToSummary(row: CanonicalRow): CanonicalProductSummary {
  return {
    id: row.id,
    name: row.name,
    brand: row.brand,
    category: row.category,
    subcategory: row.subcategory,
    defaultSizes: row.default_sizes ?? [],
    abv: row.abv != null ? Number(row.abv) : null,
    origin: row.origin,
    description: row.description,
    flavorNotes: row.flavor_notes ?? [],
    imageUrl: row.image_url,
  };
}

function rowToDetail(row: CanonicalDetailRow): CanonicalProductDetail {
  return {
    ...rowToSummary(row),
    parentCompany: row.parent_company,
    foundedYear: row.founded_year,
    productionRegion: row.production_region,
    agingYears: row.aging_years != null ? Number(row.aging_years) : null,
    educationData: row.education_data,
    enrichmentStatus: row.enrichment_status,
  };
}

/**
 * Search canonical products by name. Uses ILIKE for the MVP; later this
 * should hit the pg_trgm fuzzy-match RPC for better tolerance to typos.
 *
 * Excludes generic canonicals (brand IS NULL) since those exist purely as
 * recipe-side references for "any vodka" / "any whiskey" matching and are
 * not useful library items for end users.
 *
 * Returns up to `limit` results, ordered alphabetically.
 */
export async function searchCanonicalProducts(
  query: string,
  limit = 12
): Promise<CanonicalProductSummary[]> {
  const trimmed = query.trim();
  if (trimmed.length < 2) return [];

  const { data, error } = await supabase
    .from('canonical_products')
    .select('id, name, brand, category, subcategory, default_sizes, abv, origin, description, flavor_notes, image_url')
    .not('brand', 'is', null)
    // Match against category + subcategory too so "whisk" surfaces every
    // whiskey (subcategory = 'Whiskey'), "vodka" surfaces every vodka, etc.
    // Without this, the search only hit `name` and `brand`, so a category
    // search returned the rare brand whose name happens to include the term.
    .or(
      `name.ilike.%${trimmed}%,brand.ilike.%${trimmed}%,category.ilike.%${trimmed}%,subcategory.ilike.%${trimmed}%`,
    )
    .order('name')
    .limit(limit);

  if (error) {
    if (__DEV__) console.warn('canonical search failed', error);
    return [];
  }

  return (data as CanonicalRow[]).map(rowToSummary);
}

export interface CanonicalSearchFilter {
  /** Category column filter. Defaults to 'Spirit' when omitted. */
  category?: string;
  subcategories: string[];
  /** Optional name keyword AND'd into the query (e.g. 'bourbon' on a row whose
   *  subcategory is 'Whiskey'). Used by the wells picker for granular wells
   *  whose subcategory hasn't been broken out in the canonical seed. */
  nameKeyword?: string;
}

/**
 * Filtered canonical search. Used by the wells onboarding picker to keep
 * results inside the slot the user is filling (e.g. the Bourbon row never
 * surfaces a vodka, or a non-bourbon whiskey).
 */
export async function searchCanonicalBySubcategory(
  query: string,
  filter: CanonicalSearchFilter,
  limit = 20
): Promise<CanonicalProductSummary[]> {
  if (filter.subcategories.length === 0) return [];
  const trimmed = query.trim();
  const category = filter.category ?? 'Spirit';

  let q = supabase
    .from('canonical_products')
    .select('id, name, brand, category, subcategory, default_sizes, abv, origin, description, flavor_notes, image_url')
    .eq('category', category)
    .in('subcategory', filter.subcategories)
    .not('brand', 'is', null)
    .order('name')
    .limit(limit);

  if (filter.nameKeyword) {
    q = q.ilike('name', `%${filter.nameKeyword}%`);
  }

  if (trimmed.length >= 2) {
    q = q.or(`name.ilike.%${trimmed}%,brand.ilike.%${trimmed}%`);
  }

  const { data, error } = await q;

  if (error) {
    if (__DEV__) console.warn('canonical subcategory search failed', error);
    return [];
  }

  return (data as CanonicalRow[]).map(rowToSummary);
}

/**
 * Map a canonical product onto our IngredientType + subType. The canonical
 * catalog uses a finer-grained category set than the form's IngredientType,
 * so we collapse Liqueur/Vermouth/Bitters/Absinthe down into Spirit-with-
 * subtype, and the various Non-Alc categories into the 'Non-Alc' bucket.
 *
 * Used by the catalog picker to pass the right type+subtype when navigating
 * to the prefill form.
 */
export function mapCanonicalToType(product: CanonicalProductSummary): {
  ingredientType: 'Spirit' | 'Beer' | 'Wine' | 'Non-Alc';
  subType: string;
} {
  const cat = product.category ?? '';
  const sub = product.subcategory ?? '';

  if (cat === 'Spirit') {
    const isWhiskeySub =
      sub === 'Whiskey' ||
      sub === 'Bourbon' ||
      sub === 'Rye' ||
      sub === 'Scotch' ||
      sub === 'Irish' ||
      sub === 'Japanese';
    return {
      ingredientType: 'Spirit',
      subType: isWhiskeySub ? 'Whiskey' : sub,
    };
  }
  // Wine subcategory 'Fortified' covers Port/Sherry/Madeira and matches
  // WINE_SUBTYPES in appConstants. Other wine subs pass through.
  if (cat === 'Wine') return { ingredientType: 'Wine', subType: sub };
  if (cat === 'Beer') return { ingredientType: 'Beer', subType: sub };
  if (cat === 'Liqueur') return { ingredientType: 'Spirit', subType: 'Liqueur' };
  if (cat === 'Bitters') return { ingredientType: 'Spirit', subType: 'Bitters' };
  if (cat === 'Absinthe') return { ingredientType: 'Spirit', subType: 'Absinthe' };
  if (cat === 'Vermouth') return { ingredientType: 'Spirit', subType: 'Vermouth' };
  // Non-Alc umbrella: use the canonical *category* (Juice / Syrup / Mixer /
  // Garnish / etc.) as the subType, since IngredientType "Non-Alc" is too
  // coarse to convey the kind of ingredient. Maps directly to NA_SUBTYPES.
  return { ingredientType: 'Non-Alc', subType: cat || 'Other' };
}

/** Fetch full Tier 1 + Tier 2 detail for a canonical product. Used by the
 *  education panel on ingredient-detail. Null when not found. */
export async function getCanonicalProductDetail(
  id: string
): Promise<CanonicalProductDetail | null> {
  const { data, error } = await supabase
    .from('canonical_products')
    .select(
      'id, name, brand, category, subcategory, default_sizes, abv, origin, description, flavor_notes, image_url, parent_company, founded_year, production_region, aging_years, education_data, enrichment_status'
    )
    .eq('id', id)
    .maybeSingle();

  if (error) {
    if (__DEV__) console.warn('canonical detail fetch failed', error);
    return null;
  }
  if (!data) return null;

  return rowToDetail(data as CanonicalDetailRow);
}
