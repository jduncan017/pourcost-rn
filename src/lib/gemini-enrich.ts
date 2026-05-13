/**
 * Gemini-driven canonical enrichment.
 *
 * Given a batch of beverage products (often messy POS data), returns
 * structured canonical data validated against the locked taxonomy:
 *   - Cleaned Title-Case name (strips SKU codes, distributor refs, vintage)
 *   - Category + subcategory from locked vocab
 *   - ABV, origin, region, parent_company, aging_years, varietal
 *   - 5-10 flavor_notes tags from the 149-term controlled vocab
 *   - A dedup_key for merging duplicates (brand + core identity, no size/proof)
 *
 * Uses Gemini 2.5 Flash via REST (same model as the extract-invoice edge
 * function). Requires GEMINI_API_KEY env var.
 *
 * Batch size of ~25 keeps each request well under context limits and gives
 * useful retry granularity if a batch fails to parse.
 */

import {
  CANONICAL_CATEGORIES,
  CANONICAL_SUBCATEGORIES,
  WINE_VARIETALS,
  FLAVOR_NOTES_VOCAB,
  FLAT_CATEGORIES,
  isValidCanonicalTaxonomy,
} from '@/src/constants/canonicalTaxonomy';

export interface EnrichmentInput {
  /** Stable identifier for matching response to source row (e.g. canonical id). */
  id: string;
  name: string;
  brand?: string | null;
  current_category?: string | null;
  current_subcategory?: string | null;
  current_abv?: number | null;
  description?: string | null;
}

export interface EnrichmentOutput {
  id: string;
  name: string;
  brand: string | null;
  category: string;
  subcategory: string | null;
  abv: number | null;
  origin: string | null;
  production_region: string | null;
  description: string;
  flavor_notes: string[];
  parent_company: string | null;
  aging_years: number | null;
  varietal: string | null;
  non_alcoholic: boolean;
  dedup_key: string;
}

const GEMINI_MODEL = 'gemini-2.5-flash';
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

/** Build the locked-vocabulary section of the system prompt. Inlined into
 *  every call so Gemini always sees the constraints. ~2K tokens. */
function buildTaxonomyBlock(): string {
  const subs = Object.entries(CANONICAL_SUBCATEGORIES)
    .map(([cat, list]) => `  ${cat}: ${list.join(' | ')}`)
    .join('\n');
  const flat = [...FLAT_CATEGORIES].join(', ');
  return `CATEGORIES (pick exactly one): ${CANONICAL_CATEGORIES.join(', ')}

SUBCATEGORIES (pick exactly one from the matching category's list, or null for flat categories):
${subs}

FLAT CATEGORIES (subcategory MUST be null): ${flat}

WINE VARIETALS (only for Wine category, pick exactly one or null):
${WINE_VARIETALS.join(' | ')}

FLAVOR_NOTES vocabulary (pick 5-10 from this exact list, no substitutions, no plurals, lowercase as written):
${FLAVOR_NOTES_VOCAB.join(' | ')}`;
}

const SYSTEM_PROMPT = `You are a beverage catalog normalization expert. Given product entries from a bar inventory POS export — which are often messy and verbose — normalize each into structured canonical data.

For each input product, return a JSON object with these fields:
- id: pass through the input's id verbatim
- name: clean Title Case product name. Drop SKU codes, distributor codes, vintage years, age statements (those go in aging_years), bottle proof, redundant brand prefix if already in brand field. Example: "BACARDI 8 AGED RUM RARE GOLD RESERVA OCHO 8 YR" → "Bacardi Ocho". "WOODFORD RESERVE KENTUCKY STRAIGHT BOURBON WHISKEY" → "Woodford Reserve".
- brand: Title Case brand only. Example: "Bacardi" for Bacardi Ocho. Null if generic (e.g. "Lime Juice").
- category: exact match from CATEGORIES list below
- subcategory: exact match from the matching category's SUBCATEGORIES list. Null for flat categories (Dairy/Egg/Spice/Herb). Pick the most specific match — if it's a bourbon, use "Bourbon", not "American Whiskey".
- abv: number, percent (e.g. 40 for 40% ABV). Null if unknown/unmeasurable (mixers, juices that aren't alcoholic — use 0).
- origin: country or US state of production (e.g. "Kentucky, USA", "Scotland", "Jalisco, Mexico"). Null if unknown.
- production_region: more granular region or appellation (e.g. "Islay", "Cognac", "Bordeaux", "Napa Valley"). Null if not applicable.
- description: factual and bartender-relevant. Length scales with category:
  • Spirit / Liqueur / Vermouth / Bitters / Wine / Beer / Prepped: 1-2 sentences, 25-50 words. Cover character + typical cocktail use.
  • Garnish / Mixer / Juice / Syrup / Dairy / Egg / Spice / Herb: ONE short sentence, 8-15 words max. State what it is. Skip obvious phrases like "adds visual appeal" or "common in cocktails" — the bartender knows.
  Examples:
    Garnish "Orange Wheel": "Cross-cut orange slice. Old Fashioned and tiki standard."
    Mixer "Tonic Water": "Quinine-flavored sparkling water. Classic gin partner."
    Spirit "Maker's Mark": "Wheated Kentucky bourbon, soft and sweet from no rye in the mash bill. Used in stirred whiskey cocktails and Old Fashioneds."
- flavor_notes: array of 5-10 tags from the FLAVOR_NOTES vocab below. Include both family ("nutty") and specific ("almond") when both are evident.
- parent_company: owning corporate parent (e.g. "Bacardi Limited", "Diageo", "Beam Suntory"). Null if unknown or family-owned.
- aging_years: integer years of aging, if stated. Null if no age statement or N/A (vodka, gin, juice).
- varietal: ONLY for Wine category, pick exact match from WINE_VARIETALS. Null for non-wine.
- non_alcoholic: true ONLY if this is a non-alcoholic version of an alcoholic product (e.g. Lyre's, Athletic Brewing). False otherwise.
- dedup_key: lowercase kebab-case core identity — brand + core product, NO size/pack/proof/vintage info. This is the join key for merging duplicates. Examples: "bacardi-ocho" (covers 750mL and 1L variants), "jack-daniels-old-no-7", "titos-vodka", "fresh-lime-juice".

${buildTaxonomyBlock()}

IMPORTANT RULES:
1. Return ONLY a valid JSON array. No prose, no markdown code fence.
2. The array length must equal the input array length.
3. The id field must match input order.
4. If you don't know a field, use null (not empty string).
5. Subcategory MUST be from the locked list. If nothing fits, use the category's "Other" sub. If the product doesn't belong in any category, use the closest match.
6. flavor_notes must be from the vocab list exactly. Don't invent tags.`;

interface GeminiResponse {
  candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
}

function parseJsonArrayFromText(raw: string): unknown[] {
  // Strip optional markdown fence Gemini sometimes emits despite the prompt.
  let text = raw.trim();
  const fenceMatch = text.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/);
  if (fenceMatch) text = fenceMatch[1].trim();
  const start = text.indexOf('[');
  const end = text.lastIndexOf(']');
  if (start === -1 || end === -1) {
    throw new Error('No JSON array found in response');
  }
  return JSON.parse(text.slice(start, end + 1));
}

export interface CoerceResult {
  output: EnrichmentOutput | null;
  /** Human-readable reason when output is null. Surfaced to retry feedback. */
  reason: string | null;
}

function coerceOutputWithReason(raw: unknown, inputId: string): CoerceResult {
  if (typeof raw !== 'object' || raw === null) {
    return { output: null, reason: 'response was not a JSON object' };
  }
  const r = raw as Record<string, unknown>;

  const category = typeof r.category === 'string' ? r.category : '';
  const subcategory = typeof r.subcategory === 'string' && r.subcategory.length > 0
    ? r.subcategory : null;

  if (!isValidCanonicalTaxonomy(category, subcategory)) {
    const reason = `category="${category}" subcategory="${subcategory}" is not in the locked taxonomy`;
    return { output: null, reason };
  }

  // Validate flavor_notes against locked vocab; drop unknowns silently.
  const rawNotes = Array.isArray(r.flavor_notes) ? (r.flavor_notes as unknown[]) : [];
  const vocab = new Set(FLAVOR_NOTES_VOCAB);
  const flavor_notes = rawNotes
    .filter((t): t is string => typeof t === 'string' && vocab.has(t))
    .slice(0, 10);

  // Validate varietal against locked list if Wine.
  let varietal: string | null = null;
  if (category === 'Wine' && typeof r.varietal === 'string') {
    varietal = WINE_VARIETALS.includes(r.varietal) ? r.varietal : null;
  }

  return {
    output: {
      id: typeof r.id === 'string' ? r.id : inputId,
      name: typeof r.name === 'string' ? r.name : '',
      brand: typeof r.brand === 'string' && r.brand.length > 0 ? r.brand : null,
      category,
      subcategory,
      abv: typeof r.abv === 'number' ? r.abv : null,
      origin: typeof r.origin === 'string' && r.origin.length > 0 ? r.origin : null,
      production_region: typeof r.production_region === 'string' && r.production_region.length > 0
        ? r.production_region : null,
      description: typeof r.description === 'string' ? r.description : '',
      flavor_notes,
      parent_company: typeof r.parent_company === 'string' && r.parent_company.length > 0
        ? r.parent_company : null,
      aging_years: typeof r.aging_years === 'number' ? r.aging_years : null,
      varietal,
      non_alcoholic: r.non_alcoholic === true,
      dedup_key: typeof r.dedup_key === 'string' ? r.dedup_key.toLowerCase() : '',
    },
    reason: null,
  };
}

/** Back-compat wrapper that returns only the output (or null). */
function coerceOutput(raw: unknown, inputId: string): EnrichmentOutput | null {
  return coerceOutputWithReason(raw, inputId).output;
}

/**
 * Per-row retry with explicit error feedback. Used when a row gets dropped
 * from a batch (invalid subcategory, missing id, etc.). Sends a stricter
 * one-row request that names the specific failure mode.
 */
export async function enrichSingleWithFeedback(
  input: EnrichmentInput,
  reason: string,
  apiKey: string,
): Promise<EnrichmentOutput | null> {
  const userMessage = `Your previous response for this product was rejected: ${reason}

Re-enrich this single product. Be especially careful that subcategory matches the locked taxonomy EXACTLY for the chosen category. If unsure between two subs, pick the more general one.

Input: ${JSON.stringify(input)}`;

  const body = {
    systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
    contents: [{ role: 'user', parts: [{ text: userMessage }] }],
    generationConfig: {
      temperature: 0,
      responseMimeType: 'application/json',
    },
  };

  const res = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) return null;
  const json = (await res.json()) as GeminiResponse;
  const text = json.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
  if (!text) return null;
  try {
    const parsed = parseJsonArrayFromText(text);
    return coerceOutput(parsed[0], input.id);
  } catch {
    // Maybe Gemini returned a single object instead of array.
    let cleaned = text.trim();
    const fence = cleaned.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/);
    if (fence) cleaned = fence[1].trim();
    try {
      return coerceOutput(JSON.parse(cleaned), input.id);
    } catch {
      return null;
    }
  }
}

export interface BatchResult {
  outputs: EnrichmentOutput[];
  /** Rows that failed coercion (invalid taxonomy, missing fields). Includes
   *  the human-readable reason so the caller can pass it to retry. */
  drops: Array<{ input: EnrichmentInput; reason: string }>;
  /** Rows for which Gemini's response simply didn't contain the input id
   *  (length mismatch, shuffled order with missing entries). */
  missing: EnrichmentInput[];
}

export async function enrichBatch(
  inputs: EnrichmentInput[],
  apiKey: string,
): Promise<BatchResult> {
  if (inputs.length === 0) return { outputs: [], drops: [], missing: [] };

  const userMessage = `Input products (${inputs.length} rows):
${JSON.stringify(inputs, null, 2)}`;

  const body = {
    systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
    contents: [{ role: 'user', parts: [{ text: userMessage }] }],
    generationConfig: {
      temperature: 0.2,
      responseMimeType: 'application/json',
    },
  };

  const res = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Gemini API error: ${res.status} ${errText}`);
  }

  const json = (await res.json()) as GeminiResponse;
  const text = json.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
  if (!text) throw new Error('Empty Gemini response');

  const parsed = parseJsonArrayFromText(text);

  // Index Gemini's response by id so positional drift doesn't lose rows.
  // Build a map from id -> parsed object. Fall back to positional matching
  // for any input whose id isn't found in the response.
  const byId = new Map<string, unknown>();
  const positional: unknown[] = [];
  for (const item of parsed) {
    if (typeof item === 'object' && item !== null && typeof (item as any).id === 'string') {
      byId.set((item as any).id, item);
    } else {
      positional.push(item);
    }
  }

  const outputs: EnrichmentOutput[] = [];
  const drops: BatchResult['drops'] = [];
  const missing: BatchResult['missing'] = [];
  let positionalCursor = 0;

  for (const input of inputs) {
    let parsedRow = byId.get(input.id);
    if (parsedRow === undefined) {
      // Try positional fallback for entries without ids
      parsedRow = positional[positionalCursor++];
    }
    if (parsedRow === undefined) {
      missing.push(input);
      continue;
    }
    const { output, reason } = coerceOutputWithReason(parsedRow, input.id);
    if (output) {
      outputs.push(output);
    } else {
      drops.push({ input, reason: reason ?? 'unknown coerce failure' });
    }
  }

  return { outputs, drops, missing };
}
