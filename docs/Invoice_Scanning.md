# Invoice Scanning — Architecture & Implementation Plan

## Overview

Invoice scanning transforms PourCost from a manual costing tool into an automated bar management system. The core loop: a bar manager photographs an invoice, the system extracts line items, matches them to ingredients, and updates prices — eliminating hours of manual data entry.

The architecture is built around **three key principles**:

1. **Use AI only when cheaper methods fail** — a tiered processing pipeline that escalates cost only when necessary
2. **Every scan makes the system smarter** — user confirmations build a shared product catalog and distributor template library
3. **Prices are always org-specific, intelligence is global** — each bar sees only their costs, but the matching/enrichment infrastructure is shared

Implementation Notes:
Recommended Execution Order

Round 1 — Foundation (COMPLETE)

- [x] Supabase schema migrations (001_invoice_scanning.sql, 002_matching_rpc.sql)
- [x] Image capture UI (Expo camera/image picker) — app/invoice-capture.tsx
- [x] Zustand stores for invoices, line items — src/stores/invoices-store.ts
- [x] Supabase Storage upload for invoice images — FormData approach (blob was unreliable in RN)
- [x] Matching cascade service — 5-level fallback with confidence scoring
- [x] Cost cascade engine — invoice → ingredient → prepped → cocktail recalc
- [x] Integration tests (31 passing) — src/__tests__/invoice-services.test.ts, round2-services.test.ts
- [x] .env setup with service role key for tests

Round 2 — Processing Pipeline (COMPLETE)

- [x] ~~OCR Edge Function (Google Vision API)~~ — REPLACED by direct vision extraction
- [x] ~~LLM extraction via Claude Haiku on OCR text~~ — REPLACED by Gemini 2.5 Flash vision
- [x] Vision extraction via Gemini 2.5 Flash — supabase/functions/extract-invoice/
- [x] Distributor detection heuristics — src/services/distributor-detection-service.ts
- [x] Pack size disambiguation + math validation — src/services/pack-size-service.ts, llm-extraction-service.ts
- [x] Review screen UI (green/yellow/red groups) — app/invoice-review.tsx
- [x] Line item edit screen — app/invoice-line-edit.tsx
- [x] Pipeline orchestration — src/services/invoice-pipeline-service.ts
- [x] Price history component on ingredient detail — src/components/PriceHistory.tsx
- [x] Invoice list: pull-to-refresh, polling for processing status, retry/delete actions
- [x] Per-bottle pricing display on review screen

Architecture change (Round 2): Replaced the OCR → text → Claude Haiku pipeline with direct
Gemini 2.5 Flash vision. The model reads invoice images directly, eliminating OCR column-alignment
issues. Cost: ~$0.003/invoice vs ~$0.03 for the original OCR + Claude approach. The OCR Edge
Function (supabase/functions/ocr-invoice/) is retained but unused — may be useful for template
parsing in Round 3.

Round 2.5 — Product Normalization & Configurations (NEXT)

- [ ] Product name normalization (strip proof numbers, expand abbreviations: TEQ→Tequila, SCHN→Schnapps, etc.)
- [ ] Extract bottle size from BPC into Volume type (e.g., "6 - 1.0L" → Volume{ml:1000}, pack_size:6)
- [ ] Wire ingredient_configurations into price update flow (create/update configs per size/pack)
- [ ] Handle "same product, different size" matching (750ml vs 1.0L vs 1.75L all map to one ingredient)
- [ ] Deposit fee / non-product line filtering
- [ ] Review screen: show bottle size and pack info clearly

Round 3 — Intelligence & Polish

Opus: Template auto-generation, verification anti-spam, multi-pack-size resolution

Sonnet: Prepped ingredient recipe builder UI, price change alerts, settings additions, configurations CRUD

---

## 1. Processing Pipeline

```
Photo → Gemini Vision Extraction → Distributor Detection → Pack Size Resolution → Product Matching → User Review → Price Update
```

> **Architecture note (updated):** The original plan called for OCR (Google Vision) → text → Claude Haiku
> extraction. In practice, OCR mangled tabular column layouts badly, causing SKU/product misalignment.
> We replaced the entire OCR + text LLM pipeline with a single Gemini 2.5 Flash vision call that reads
> the invoice image directly. Cost dropped from ~$0.03 to ~$0.003/invoice with better accuracy.

### Step 1: Image Capture

- User takes photo or selects from camera roll
- Store original in Supabase Storage (`invoices/` bucket)
- Create `invoices` record with `status = 'processing'`
- Support multi-page: user can add pages to the same invoice

### Step 2: OCR (always runs)

- **Service**: Google Cloud Vision API or AWS Textract
  - Both return structured text with bounding boxes
  - Cost: ~$1.50/1,000 pages (~$0.0015/page)
  - Alternative: Apple Vision framework on-device for iOS (free, but lower accuracy on complex layouts)
- Store `raw_ocr_text` on the invoice record
- On-device OCR could serve as a fast preview while cloud OCR processes

### Step 3: Distributor Detection

- Scan header/footer text for known distributor patterns (name, logo text, address)
- Check against `distributors` table
- If matched → load the distributor's `invoice_template`
- If no match → flag for LLM extraction (Tier 3)

### Step 4: Line Item Extraction

**Tier 1 — Template parsing (known distributor format):**

- Apply `column_mapping` and `parsing_rules` from the template
- Pure regex/string parsing — no AI cost
- Handles: column positions, delimiters, header/footer markers, page breaks
- Cost: $0 (CPU only)

**Tier 3 — LLM extraction (unknown format):**

- Send OCR text to Claude Haiku with structured extraction prompt
- Prompt asks for JSON array: `{sku, product_name, quantity, unit, unit_price, total_price, pack_size}`
- Cost: ~$0.01–0.03 per invoice
- The LLM output also helps us build a template for next time (see Learning Loop)

**Tier 4 — Heavy LLM (messy/handwritten/unusual):**

- Send the actual image (not just OCR text) to Claude Sonnet with vision
- For invoices where OCR itself struggled (handwritten notes, water-damaged, unusual layouts)
- Cost: ~$0.05–0.15 per invoice
- Should be rare — most distributors use typed/printed invoices

### Step 5: Product Matching (per line item)

This is the core intelligence layer. Each line item runs through a matching cascade:

```
1. Exact SKU lookup in distributor_skus table
   → If found + verified → auto-match (confidence: 1.0)

2. Org-level custom mapping check
   → org_product_mappings for this user/org
   → Handles house brands, custom names
   → If found → auto-match (confidence: 1.0)

3. Fuzzy name match against canonical_products
   → PostgreSQL pg_trgm similarity on product name + size
   → If similarity > 0.85 → auto-match, save SKU mapping
   → If similarity 0.6–0.85 → suggest to user with alternatives

4. Fuzzy match against user's own ingredients
   → Direct name comparison against their ingredient list
   → Catches cases where user has the product but it's not in global catalog yet

5. Unmatched → queue for user review
```

### Step 6: User Review Screen

Present results in three groups:

**Auto-matched** (green) — high confidence matches, pre-confirmed

- Show: invoice line → matched ingredient, old price → new price
- User can correct if wrong

**Needs confirmation** (yellow) — medium confidence

- Show: invoice line → top 3 suggested matches
- User picks correct one or searches their ingredient list

**Unmatched** (red) — no match found

- User can:
  - a) Search and match to existing ingredient
  - b) Create new ingredient (pre-populated with invoice data)
  - c) Skip (napkins, cleaning supplies, non-ingredient items)

Every user action feeds back into the system (see Learning Loop).

### Step 7: Price Update

For confirmed matches:

- Update ingredient's `productCost` with new price from invoice
- If pack size differs from stored `productSize`, calculate per-unit cost
- Recalculate `cost` on all `cocktail_ingredients` referencing this ingredient
- Optionally: flag significant price changes (>10%) for user attention
- Store price history for trend tracking

### Step 8: Learning Loop

Every processed invoice improves the system for all users:

| User Action                         | System Learning                                      |
| ----------------------------------- | ---------------------------------------------------- |
| Confirms auto-match                 | Increment `verified_by_count` on `distributor_skus`  |
| Corrects a match                    | Update/create `distributor_skus` mapping             |
| Matches to new product              | Create `canonical_product` + `distributor_sku` entry |
| Scans unknown distributor           | Accumulate data to build future `invoice_template`   |
| Multiple users confirm same mapping | Mark as `verified = true` (crowd-sourced validation) |

**Template building**: After N invoices (e.g., 5+) from the same unknown distributor, we have enough examples to auto-generate an `invoice_template`. This moves that distributor from Tier 3 (LLM) to Tier 1 (template) for all future users — permanently reducing cost.

---

## 2. Product Matching — The Canonical Product Layer

The central challenge: the same bottle of Tito's appears differently across distributors.

| Distributor       | SKU      | Name on Invoice            |
| ----------------- | -------- | -------------------------- |
| Southern Glazer's | SG-98765 | Tito's Vodka 1.75 Liter    |
| Republic National | RN-55432 | TITOS HM VODKA 1750ML      |
| Sysco             | SY-12345 | TITOS HANDMADE VODKA 1.75L |

All three map to one **canonical product**: `Tito's Handmade Vodka`.

### Canonical Product Record

Contains the "truth" about a product — brand, name, category, ABV, sizes available, origin. This is the shared global reference that all distributor SKUs point to.

### Why this matters for the user

- Bar manager doesn't care about SKUs. They care about "Tito's."
- When they switch distributors, their ingredient automatically matches the new distributor's SKU — because both point to the same canonical product.
- Product enrichment data (ABV, category, tasting notes) is attached to the canonical product and available to all users who match to it.

### How it grows

1. **Seeded**: Pre-populate with common spirits, beers, wines (~1,000–2,000 products to start)
2. **User-created**: When a user scans something new and creates an ingredient, we create a canonical product if one doesn't exist
3. **Verified over time**: As multiple users scan the same products, mappings get confirmed via `verified_by_count`

---

## 3. Prepped Ingredients

Prepped ingredients (simple syrup, fresh juices, infusions) are fundamentally different from purchased products:

- They're **made in-house** from component ingredients
- Recipes vary by bar (simple syrup can be 1:1 or 2:1)
- They can't be matched from an invoice directly
- But their **component costs** CAN be updated from invoices (sugar, lemons, etc.)

### Architecture

**Prepped ingredients live at the org level only — never in the global catalog.**

Why: A canonical "Simple Syrup" doesn't make sense because the recipe differs everywhere. But a canonical "Domino Granulated Sugar 25lb" absolutely does — that's a purchased product with a real distributor SKU.

### How it works

1. **Templates** provide starting points
   - PourCost ships common prepped ingredient templates: "Simple Syrup 1:1", "Fresh Lime Juice", "Grenadine", etc.
   - Each template has a default recipe with component types and ratios
   - User selects a template → creates their own prepped ingredient pre-populated with the recipe

2. **Recipe builder** (the prepped ingredient costing tool)
   - User defines: components (linked to their actual ingredients), quantities, and recipe yield
   - System calculates cost-per-oz from component ingredient costs
   - Example: Simple Syrup 1:1
     - 1 lb sugar ($0.89, from their Sysco invoice) + 16oz water ($0.00)
     - Yields ~24oz of syrup
     - Cost per oz: $0.037

3. **Auto-updating costs**
   - When a component ingredient's price changes (via invoice scan), the prepped ingredient's cost recalculates automatically
   - This is the killer connection: scan a Sysco invoice → sugar price updates → simple syrup cost updates → every cocktail using simple syrup updates
   - This cascade is where the real value lives

4. **Anonymous aggregates** (post-MVP)
   - "Average cost of simple syrup across bars in your region: $0.04/oz"
   - Derived from anonymized data, never exposing individual recipes
   - Useful as a sanity check, not a prescription

### Storage

- Prepped ingredients use the existing `ingredients` table with `type = 'Prepped'`
- Recipes stored in a separate `prepped_ingredient_recipes` table linking to component ingredients
- When cost calculation runs, it traverses the recipe's component ingredients and computes cost per yield unit

---

## 4. Regional Pricing & Distributors

### Core Rule: Prices are ALWAYS org-specific

We never tell a bar "Tito's costs $X." We show them THEIR price from THEIR invoices. The canonical product layer is for identity (what IS this product), not pricing (what does it COST).

### Regional Complexity

Different challenges by region:

- **Liquor pricing**: Some states are "control states" (government sets prices). Others are open market.
- **Distributor availability**: Southern Glazer's dominates the Southeast. Republic National is strong in the Midwest. Some states have exclusive distribution agreements.
- **Same product, different SKU**: A distributor may use different SKUs in different states for the same product.
- **Tax structure**: Varies wildly by state — some include in invoice price, some don't.

### How we handle it

1. **Org location** stored on profile (state/region)
   - Used for aggregate slicing, not for pricing
   - Set during onboarding or in settings

2. **Distributor-SKU-Region mapping**
   - `distributor_skus` table includes optional `region` field
   - Same distributor might have different SKUs per state
   - Matching cascade checks region-specific SKUs first, then falls back to region-agnostic

3. **Regional price analytics** (post-MVP, Lite+ tier)
   - Anonymized aggregate pricing by canonical_product × region
   - Updated periodically from scan data
   - "You're paying $28 for Tito's 1.75L — average in Texas: $24.50"
   - This becomes a distributor negotiation tool — huge value prop

4. **Control state awareness** (future)
   - Flag control states where prices are fixed
   - In these states, price comparison is less useful — focus on product availability and menu optimization instead

---

## 5. Product Enrichment

When a canonical product is created (first time anyone scans or adds a product), trigger enrichment to add metadata.

### What we enrich

- **Category**: Spirit, Beer, Wine, Mixer, etc.
- **Subcategory**: Vodka, Bourbon, IPA, Pinot Noir, etc.
- **Brand**: Parent brand name
- **ABV**: Alcohol by volume
- **Origin**: Country/region of production
- **Flavor profile**: Tasting notes, style descriptors
- **Image**: Product photo URL
- **Available sizes**: Common bottle/can sizes

### How it works

1. **Trigger**: New canonical product created (via user scan or manual add)
2. **Web search**: Search for `"{product name}" {category} ABV` using a search API
3. **LLM extraction**: Send top search results to Claude Haiku with structured extraction prompt
4. **Store**: Save enrichment data on canonical product record
5. **Cost**: ~$0.02/product (web search + Haiku extraction) — one-time, shared across all users

### Cost control

- **One-time per canonical product**: Once enriched, never needs to re-run (unless data is flagged as wrong)
- **Batch processing**: Don't enrich in real-time during invoice scanning. Queue enrichment jobs and run them in batches during off-peak hours
- **Amortized**: If 1,000 users all scan Tito's, we only enrich it once. The cost is effectively $0.00002/user for that product
- **No user-triggered enrichment**: Users can't click "enrich" on their own ingredients. Only global canonical products get enriched, which are shared.

### Pre-seeding

Before launch, pre-enrich the top ~2,000 spirits, beers, and wines. Cost: ~$40 total. This means most users' first scans will already have full metadata.

---

## 6. Cost Estimation & Tier Economics

### Per-invoice processing cost

| Tier                 | When                            | OCR     | Extraction                 | Matching     | Total       |
| -------------------- | ------------------------------- | ------- | -------------------------- | ------------ | ----------- |
| 1 - Template         | Known distributor, known format | $0.0015 | $0 (regex)                 | $0 (DB)      | ~$0.002     |
| 2 - Template + Fuzzy | Known distributor, new products | $0.0015 | $0 (regex)                 | $0 (pg_trgm) | ~$0.002     |
| 3 - LLM Extract      | Unknown distributor format      | $0.0015 | $0.01–0.03 (Haiku)         | $0 (DB)      | ~$0.02–0.04 |
| 4 - Full LLM         | Messy/handwritten/unusual       | $0.0015 | $0.05–0.15 (Sonnet vision) | $0.02        | ~$0.08–0.15 |

### Expected tier distribution over time

| Phase                              | Tier 1 | Tier 2 | Tier 3 | Tier 4 |
| ---------------------------------- | ------ | ------ | ------ | ------ |
| Launch (month 1)                   | 10%    | 10%    | 70%    | 10%    |
| Month 6 (template library growing) | 40%    | 20%    | 35%    | 5%     |
| Month 12+ (mature system)          | 65%    | 20%    | 13%    | 2%     |

### Unit economics at scale

Assuming Lite tier ($49/mo), average 15 invoices/month per user:

| Phase     | Avg cost/invoice | Monthly cost/user | Margin on $49 |
| --------- | ---------------- | ----------------- | ------------- |
| Launch    | ~$0.04           | $0.60             | 98.8%         |
| Month 6   | ~$0.02           | $0.30             | 99.4%         |
| Month 12+ | ~$0.008          | $0.12             | 99.8%         |

Even at launch with mostly LLM processing, the margins are excellent. The template library is a compounding asset that only gets cheaper over time.

### Product enrichment cost (one-time)

- Pre-seed 2,000 products: ~$40
- Ongoing: ~$0.02/new product, amortized across all users who scan it
- At 10,000 canonical products: total enrichment spend ~$200 lifetime

---

## 7. New Database Tables

These tables extend the existing schema in `supabase/schema.sql`. Designed to be additive — no changes to existing tables except adding an optional `canonical_product_id` column to `ingredients`.

### Global tables (not user-scoped)

```sql
-- Canonical product catalog — the "source of truth" identity layer
canonical_products (
  id UUID PK,
  name TEXT NOT NULL,                  -- "Tito's Handmade Vodka"
  brand TEXT,                          -- "Tito's"
  category TEXT,                       -- Spirit, Beer, Wine, Mixer, Garnish
  subcategory TEXT,                    -- Vodka, Bourbon, IPA, Pinot Noir
  default_sizes JSONB,                 -- common Volume values: [750ml, 1L, 1.75L]
  abv NUMERIC(5,2),
  origin TEXT,                         -- "Austin, Texas, USA"
  description TEXT,
  image_url TEXT,
  flavor_notes JSONB,                  -- ["clean", "crisp", "peppery"]
  enrichment_status TEXT DEFAULT 'pending',  -- pending, complete, failed
  enriched_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
)

-- Known distributors
distributors (
  id UUID PK,
  name TEXT NOT NULL,                  -- "Southern Glazer's"
  type TEXT,                           -- broadline, spirits, beer, wine
  regions JSONB,                       -- ["TX", "FL", "CA"]
  created_at TIMESTAMPTZ DEFAULT now()
)

-- Parsing templates for known invoice formats
invoice_templates (
  id UUID PK,
  distributor_id UUID FK → distributors,
  version INTEGER DEFAULT 1,
  format_type TEXT,                    -- tabular, list, custom
  column_mapping JSONB,               -- {sku: col_index, name: col_index, ...}
  parsing_rules JSONB,                -- regex patterns, delimiters, markers
  sample_count INTEGER DEFAULT 0,     -- how many invoices built this template
  created_at TIMESTAMPTZ DEFAULT now()
)

-- Maps distributor SKUs to canonical products
distributor_skus (
  id UUID PK,
  distributor_id UUID FK → distributors,
  sku TEXT,
  raw_product_name TEXT,               -- name as printed on invoice
  canonical_product_id UUID FK → canonical_products,
  product_size JSONB,                  -- Volume (750ml, 1.75L, etc.)
  pack_size INTEGER,                   -- 1 = single, 6 = 6-pack, 12 = case
  confidence NUMERIC(3,2) DEFAULT 0,
  verified BOOLEAN DEFAULT false,
  verified_by_count INTEGER DEFAULT 0,
  region TEXT,                         -- state code, nullable (if region-specific)
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(distributor_id, sku, region)
)
```

### User/org-scoped tables

```sql
-- Scanned invoices
invoices (
  id UUID PK,
  user_id UUID FK → profiles,         -- becomes org_id later
  distributor_id UUID FK → distributors (nullable),
  invoice_date DATE,
  invoice_number TEXT,
  image_urls JSONB,                    -- array of Storage paths (multi-page)
  raw_ocr_text TEXT,
  status TEXT DEFAULT 'processing',    -- processing, review, complete, failed
  processing_tier TEXT,                -- template, fuzzy, llm, vision
  processing_cost_cents INTEGER DEFAULT 0,
  total_items INTEGER DEFAULT 0,
  matched_items INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
)

-- Parsed line items from invoices
invoice_line_items (
  id UUID PK,
  invoice_id UUID FK → invoices ON DELETE CASCADE,
  line_number INTEGER,
  raw_text TEXT,
  sku TEXT,
  product_name TEXT,
  quantity NUMERIC(10,2),
  unit TEXT,                           -- case, bottle, each
  unit_price NUMERIC(10,2),
  total_price NUMERIC(10,2),
  pack_size INTEGER,

  -- Matching results
  matched_ingredient_id UUID FK → ingredients (nullable),
  canonical_product_id UUID FK → canonical_products (nullable),
  distributor_sku_id UUID FK → distributor_skus (nullable),
  match_method TEXT,                   -- sku_exact, fuzzy, llm, manual
  match_confidence NUMERIC(3,2),
  match_status TEXT DEFAULT 'unmatched',  -- auto_matched, confirmed, corrected, unmatched, skipped
  created_at TIMESTAMPTZ DEFAULT now()
)

-- Org-level product identity mappings
org_product_mappings (
  id UUID PK,
  user_id UUID FK → profiles,         -- becomes org_id later
  canonical_product_id UUID FK → canonical_products,
  ingredient_id UUID FK → ingredients,
  custom_name TEXT,                    -- bar's own name if different
  auto_update_price BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, canonical_product_id)
)

-- Prepped ingredient recipes (links to existing ingredients table)
prepped_ingredient_recipes (
  id UUID PK,
  ingredient_id UUID FK → ingredients UNIQUE,  -- the prepped ingredient itself
  user_id UUID FK → profiles,
  template_name TEXT,                  -- which template it was based on (nullable)
  components JSONB NOT NULL,           -- [{ingredient_id, quantity: Volume, notes}]
  yield JSONB NOT NULL,                -- Volume — how much the recipe makes
  cost_per_oz NUMERIC(10,4),           -- calculated from component costs
  last_calculated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
)

-- Templates for common prepped ingredients
prepped_ingredient_templates (
  id UUID PK,
  name TEXT NOT NULL,                  -- "Simple Syrup 1:1"
  category TEXT,                       -- Syrup, Juice, Infusion, Brine
  description TEXT,
  default_recipe JSONB,                -- [{ingredient_type: "sugar", ratio: 1}, ...]
  default_yield TEXT,                  -- "~24oz per batch"
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
)

-- Price history for trend tracking
ingredient_price_history (
  id UUID PK,
  ingredient_id UUID FK → ingredients,
  invoice_line_item_id UUID FK → invoice_line_items (nullable),
  old_price NUMERIC(10,2),
  new_price NUMERIC(10,2),
  price_change_pct NUMERIC(5,2),
  recorded_at TIMESTAMPTZ DEFAULT now()
)
```

### Modification to existing tables

```sql
-- Add to ingredients table:
ALTER TABLE ingredients ADD COLUMN canonical_product_id UUID
  REFERENCES canonical_products(id);

CREATE INDEX idx_ingredients_canonical ON ingredients(canonical_product_id);
```

---

## 8. Prepped Ingredient Costing Tool (In-App Feature)

### User Flow

1. User creates a new ingredient with `type = 'Prepped'`
2. App offers template picker: "Start from a template?" → shows common prepped ingredients
3. Recipe builder screen:
   - Add component ingredients (search from user's ingredient list)
   - Set quantity for each component (e.g., "1 lb sugar", "16 oz water")
   - Set recipe yield (e.g., "24 oz")
4. System calculates:
   - Total recipe cost = sum of (component cost per oz × component quantity in oz)
   - Cost per oz = total recipe cost / yield in oz
5. This cost per oz becomes the prepped ingredient's `productCost` / `productSize` equivalent
6. When component prices change (via invoice scan), cost auto-recalculates

### The Invoice Connection

This is where prepped ingredients and invoice scanning create a feedback loop:

```
Invoice scan → Sugar price updates ($0.89/5lb → $0.95/5lb)
  → Simple Syrup recipe recalculates (uses sugar as component)
    → Every cocktail using Simple Syrup recalculates
      → Bar manager sees updated pour costs across entire menu
```

This cascade is invisible to the user but immensely valuable. One invoice scan can ripple through dozens of cocktails.

---

## 9. Implementation Phases

### Phase 1: Foundation (MVP for Lite tier)

- [ ] Supabase schema: canonical_products, distributors, distributor_skus, invoices, invoice_line_items, org_product_mappings
- [ ] Image capture UI (camera + photo library)
- [ ] OCR integration (Google Vision API via Edge Function)
- [ ] LLM extraction via Claude Haiku (Tier 3 — no templates yet)
- [ ] Basic matching: exact SKU → fuzzy name → unmatched
- [ ] Review screen UI (auto-matched / needs confirmation / unmatched)
- [ ] Price update pipeline with change detection
- [ ] Seed canonical_products with top ~500 spirits
- [ ] Pre-build templates for top 3 distributors: Southern Glazer's, Republic National, Breakthru Beverage

### Phase 2: Intelligence

- [ ] Product enrichment pipeline (background job)
- [ ] Pre-seed enrichment for top 2,000 products
- [ ] Template auto-generation from accumulated LLM extractions
- [ ] Ingredient price history tracking + UI
- [ ] Price change alerts ("Tito's went up 12% this month")
- [ ] Confidence calibration: tune auto-match thresholds based on user correction rates

### Phase 3: Prepped Ingredients

- [ ] Prepped ingredient recipe builder UI
- [ ] prepped_ingredient_recipes + prepped_ingredient_templates tables
- [ ] Cost cascade: component price change → recipe recalculate → cocktail recalculate
- [ ] Ship 20+ prepped ingredient templates (syrups, juices, infusions, common garnish prep)

### Phase 4: Analytics (Pro tier)

- [ ] Regional price snapshots (anonymized aggregates)
- [ ] Price comparison: "Your price vs. regional average"
- [ ] Distributor comparison: if user has invoices from multiple distributors
- [ ] Cost trend dashboard: price direction over time per ingredient
- [ ] Menu profitability suggestions: "Raise Old Fashioned by $1 — your pour cost is 8% below target"

---

## 9.5. Implementation Complexity Guide (Opus vs. Sonnet)

### Use Opus for these tasks

These involve tricky logic, multi-step reasoning, or ambiguous edge cases where getting it wrong means bad data propagating through the system:

| Task                                                     | Why Opus                                                                                                                                                                                                            |
| -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Matching cascade logic** (Section 1, Step 5)           | Multi-level fallback with confidence scoring, fuzzy matching thresholds, deciding when to auto-match vs. ask the user. Getting this wrong means wrong prices on cocktails.                                          |
| **LLM extraction prompts** (Section 1, Step 4 Tier 3)    | Prompt engineering for structured invoice data extraction. Needs to handle wildly different invoice formats, abbreviations, edge cases (partial cases, split lines, multi-line items).                              |
| **Multi-pack-size resolution** (Section 13)              | When an invoice line matches an existing ingredient but at a different size/pack config — deciding whether to update existing config, create new one, or prompt user. Interacts with default config logic.          |
| **Cost cascade engine** (Section 8)                      | Invoice → ingredient price update → prepped ingredient recalc → cocktail recalc. Must handle circular deps (prepped ingredient A uses prepped ingredient B), partial updates, and avoid unnecessary recalculations. |
| **Template auto-generation** (Section 12, Q7)            | Analyzing 10+ LLM extraction results to reverse-engineer a regex/column-mapping template. Essentially building a parser from examples.                                                                              |
| **Pack size disambiguation** (Section 12, Q3)            | Determining from invoice text whether "6 × 750ml" means 6 individual bottles or 1 case of 6. Context-dependent, distributor-specific.                                                                               |
| **Distributor detection heuristics** (Section 1, Step 3) | Pattern matching against invoice headers to identify distributors. Needs to handle variations, regional branches, subsidiary names.                                                                                 |
| **Verification anti-spam logic** (Section 12, Q6)        | Anomaly detection on SKU mapping verification patterns. Edge cases around contested mappings.                                                                                                                       |

### Sonnet handles these fine

Straightforward implementation with clear specs — the hard thinking is already done in this doc:

| Task                                          | Why Sonnet is fine                                                                                                                              |
| --------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| **Supabase schema migrations**                | SQL is fully specified in Section 7. Just needs to be turned into migration files.                                                              |
| **Image capture UI**                          | Standard Expo camera/image picker. Well-documented APIs.                                                                                        |
| **OCR Edge Function**                         | API wrapper around Google Vision. Send image, get text back. Minimal logic.                                                                     |
| **Review screen UI**                          | React Native screen with three groups (green/yellow/red). Complex visually but the logic is straightforward list rendering with action buttons. |
| **Zustand stores** (invoices, configurations) | CRUD operations following existing store patterns in the codebase.                                                                              |
| **Supabase Storage upload**                   | Standard file upload to a bucket. Existing patterns in the app.                                                                                 |
| **Price history tracking**                    | Insert a row on price change. Simple trigger or app-side logic.                                                                                 |
| **Supply type filtering**                     | Add `'Supply'` to type enum, filter cocktail picker with `type !== 'Supply'`. One-line change.                                                  |
| **ingredient_configurations CRUD**            | Standard table operations. The schema is defined, just wire it up.                                                                              |
| **Prepped ingredient recipe builder UI**      | Form with ingredient search, quantity inputs, yield input. Standard form pattern.                                                               |
| **Price change alerts UI**                    | Query price_history, show items with >X% change. Display logic.                                                                                 |
| **Settings additions** (labor rate, etc.)     | Add fields to existing settings screen. Pattern already exists.                                                                                 |
| **Ingredient detail — configurations tab**    | List of pack sizes with default toggle. Standard list UI.                                                                                       |

### Suggested workflow

1. **Opus**: Design and implement the matching cascade + cost cascade engine as services first. These are the core brain of the system. Write them as pure functions with clear inputs/outputs and thorough tests.
2. **Sonnet**: Schema migrations, all UI screens, stores, Edge Functions, and wiring. Reference the Opus-built services.
3. **Opus**: Prompt engineering for LLM extraction. Test against real invoice samples.
4. **Sonnet**: Template parsing system (the regex/column-mapping engine). The templates themselves are data, the engine is straightforward.
5. **Opus**: Template auto-generation logic, verification/anti-spam, distributor detection heuristics.
6. **Sonnet**: Everything else — price history, alerts, prepped ingredient UI, settings.

**Rule of thumb**: If the task involves deciding _what to do_ based on ambiguous input (matching, parsing, classifying), use Opus. If the task involves _doing a known thing_ (CRUD, UI, API calls), use Sonnet.

---

## 10. Ingredient Visibility & Isolation

### Preventing org data from leaking to global catalog

Canonical products should ONLY be created through controlled pathways, never directly from user ingredients:

1. **Admin-seeded**: Pre-populated by us from public product databases
2. **Crowd-validated**: When 3+ users from different orgs create ingredients with very similar names/attributes, flag for admin review → create canonical product
3. **Never auto-promoted**: A user creating "House Rum" or "Bob's Special Blend" should never become a canonical product

**Safeguards:**

- Add `is_custom BOOLEAN DEFAULT false` to ingredients table. Custom ingredients are excluded from canonical product consideration entirely.
- Only `type IN ('Spirit', 'Beer', 'Wine')` with `is_custom = false` are candidates for canonical matching
- Prepped ingredients (`type = 'Prepped'`) are always excluded — they're org-level by definition
- A "Suggest for global catalog" button lets users opt-in to contributing a product, rather than it happening silently

### Separating raw materials from cocktail ingredients

Components used in prepped ingredients (sugar, lemons, water) should NOT appear in the cocktail ingredient picker. Two approaches:

**Option A: New `type` value** (simpler)

- Add `type = 'Supply'` for raw materials used only in prep
- Cocktail ingredient picker filters: `WHERE type NOT IN ('Supply')`
- Prepped ingredient recipe builder shows ALL types including Supply
- User adds "Granulated Sugar" as type='Supply' — it shows up in recipe builder but not when building an Old Fashioned

**Option B: Visibility flag** (more flexible)

- Add `available_in_cocktails BOOLEAN DEFAULT true` to ingredients
- Any ingredient can be hidden from cocktail picker regardless of type
- More flexible but adds a setting users have to manage

**Recommendation: Option A.** It's simpler, the naming is intuitive ("Supplies" vs "Ingredients"), and it maps to how bars already think about inventory (bar inventory vs kitchen/prep supplies).

---

## 11. Labor Cost in Prep

Most costing tools ignore labor — this is a differentiator.

### Schema additions

```sql
-- Add to profiles (org-level setting):
ALTER TABLE profiles ADD COLUMN prep_labor_rate NUMERIC(10,2);  -- hourly rate, e.g. $18.00

-- Add to prepped_ingredient_recipes:
-- prep_time_minutes INTEGER  (already in JSONB is fine too)
```

### How it works

1. Org sets hourly prep labor rate in Settings (e.g., $18/hr)
2. Each prepped ingredient recipe includes estimated prep time (e.g., 15 minutes for simple syrup)
3. Cost calculation:
   ```
   ingredient_cost = sum(component costs)
   labor_cost = (prep_time_minutes / 60) × prep_labor_rate
   total_batch_cost = ingredient_cost + labor_cost
   cost_per_oz = total_batch_cost / yield_in_oz
   ```
4. Display breakdown: "Simple Syrup 1:1 — $0.037/oz ingredient + $0.019/oz labor = $0.056/oz total"

### UX consideration

- Labor cost toggle: some bars won't want to include it (keeps things simpler)
- Default OFF for Free tier, available in Lite+
- When toggled on, all prepped ingredient costs across all cocktails update to include labor

---

## 12. Resolved Questions

### 1. OCR Strategy

**Decision: Cloud-only via Edge Function (Google Vision API)**

Since we're building cross-platform with Expo, on-device OCR would require platform-specific native modules (Apple Vision for iOS, ML Kit for Android). Cloud OCR through a Supabase Edge Function works identically on both platforms and is simpler to maintain. At $0.0015/page the cost is negligible. Revisit on-device OCR only if offline scanning becomes a requirement.

### 2. Invoice Storage Retention

**Decision: 3 years included in Lite, unlimited in Pro/Enterprise**

Storage cost math:

- Average invoice image: ~2MB
- 15 invoices/month × 12 months × 2MB = 360MB/user/year
- Supabase Storage: $0.021/GB/month
- **1 year**: ~$0.008/user/month (negligible)
- **3 years**: ~$0.024/user/month (negligible)
- **7 years (IRS compliance)**: ~$0.05/user/month (still negligible)

Even "forever" storage is pennies per user. Include 3 years in Lite (covers standard business compliance), unlimited in Pro+. This also enables the accountant export feature — users can share invoice history with their accounting team. Big value prop for the Pro tier pitch.

### 3. Pack Size Handling

**Decision: Explicit pack_size field + validation step**

This is a data accuracy issue, not a question. The solution:

- `invoice_line_items.pack_size` captures units-per-case from the invoice
- `distributor_skus.pack_size` stores the known case configuration for verified SKUs
- When a known SKU's pack_size matches the invoice, auto-calculate per-unit price: `unit_price = line_total / (quantity × pack_size)`
- When pack_size is ambiguous, flag for user confirmation: "Is this 6 bottles at $X each, or 1 case of 6 at $X total?"
- Southern Glazer's data (from their product pages) shows "Packs per Case" and "Units per Pack" — this structured data will map directly to our schema when we parse their invoices

### 4. Credit Memos / Returns

**Decision: Skip for per-unit pricing, track as metadata for future accounting features**

Credit memos don't affect what a product costs — they affect what you spent. For MVP:

- Detect negative line items and flag them as `match_status = 'credit'`
- Don't use credits for cost-per-unit calculation
- Store the data so it's available when POS integration + accounting features land (Pro/Enterprise tier)
- Total spend tracking is firmly a management/accounting feature — post-MVP, pairs with POS data for actual vs. theoretical cost analysis

### 5. Multi-Distributor Price Comparison

**Decision: Yes — surface proactively as an "AI Insight"**

When a user has the same canonical product from two distributors:

- Show in a dedicated "Insights" section (not inline — avoids noise)
- Format: "You could save $X/month on [product] by ordering from [distributor Y] ($XX vs $YY per unit)"
- Only show when the savings exceed a threshold (e.g., >5% price difference)
- Pro tier feature

### 6. Verification Threshold

**Decision: 3 unique users, with anti-spam safeguards**

Spam/abuse mitigations:

- Only authenticated, verified accounts count toward verification
- Rate limit: a single user can only verify N new SKU mappings per day (e.g., 50)
- Anomaly detection: flag if one user is verifying unusual volumes of mappings
- Verified mappings can be "contested" — if a verified mapping gets corrected by 2+ users, revert to unverified and re-evaluate
- Admin review queue for contested mappings
- Worst case if bad data gets in: it only affects auto-matching suggestions. Users always confirm before prices update.

### 7. Template Building Automation

**Decision: Semi-automated — generate after 10 invoices, human review before activation**

Given that some distributors occasionally change formats:

- After 10 LLM-extracted invoices from the same distributor, auto-generate a candidate template
- Run the template against the 10 historical invoices and compare output to LLM extraction
- If accuracy >95% on historical data → flag for admin review
- Admin activates the template → moves that distributor from Tier 3 to Tier 1
- **Format change detection**: If a template-parsed invoice has >20% extraction failures, auto-fall back to LLM extraction and flag: "Distributor X may have changed their invoice format"
- Template versioning: keep old templates, create new version when format changes

### 8. Pre-Seeding Strategy

**Decision: Seed canonical PRODUCTS only (identity layer), not SKUs or prices**

This was the key confusion. We are NOT trying to seed:

- ~~Distributor SKUs~~ (built organically from scans)
- ~~Prices~~ (always org-specific from invoices)
- ~~Pack sizes~~ (these are distributor_sku attributes)

We ARE seeding:

- Product identity: "Jameson Irish Whiskey" — brand, category, ABV, origin
- This is universal. Jameson is Jameson whether you're in Texas or New York, from Southern Glazer's or Republic National.

**Data sources for canonical products:**

- **Open Food Facts** / **Open Drinks Database** — open-source product databases
- **UPC databases** (UPCitemdb.com has a free API tier) — scan a barcode, get product info
- **Distiller.com**, **Wine-Searcher** — publicly accessible spirit/wine databases
- **Manual curation**: Start with top 500 spirits by US market share (this list is readily available from industry publications like Shanken News Daily)
- **Enrichment pipeline** fills in ABV, origin, flavor notes automatically

The 9 Jameson SKUs in the Southern Glazer's screenshot? Those are all `distributor_skus` entries pointing to ONE canonical product. They'll be created the first time users scan Jameson invoices from SG — no pre-seeding needed.

---

## 13. Multi-Pack-Size Ingredients

Instead of merging duplicate ingredients, each ingredient supports **multiple pack size configurations**. This is how bars actually buy: the same product comes in different sizes and case configurations, often at different per-unit prices.

### How it works

1. **An ingredient has one identity, multiple purchase configurations**
   - "Tito's Handmade Vodka" is one ingredient
   - It can have configurations: 750ml bottle, 1L bottle, 1.75L bottle, case of 12×750ml, case of 6×1L
   - Each configuration has its own `product_size`, `product_cost`, and `pack_size`

2. **One configuration is the "default"** — used for cost-per-oz calculations
   - User sets which configuration is their standard order
   - All cocktail cost calculations use the default configuration's pricing

3. **Invoice scanning creates or updates configurations**
   - User scans an invoice with "TITOS HM VODKA 1.75L, case of 6, $149.94"
   - System matches to existing "Tito's" ingredient
   - Adds/updates the "1.75L case of 6" configuration with price $24.99/bottle
   - If this differs from their current default size, prompt: "You usually order 750ml bottles. Want to switch your default to 1.75L?"

4. **No merging needed**
   - User manually created "Titos Vodka" with a custom price? That's a "custom" configuration.
   - Invoice scan adds a "1.75L case" configuration to the same ingredient.
   - User can keep using their custom config as default, or switch to the invoice-sourced one.
   - They can delete the custom config later if they want.

### Schema

```sql
-- New table: ingredient purchase configurations
ingredient_configurations (
  id UUID PK,
  ingredient_id UUID FK → ingredients ON DELETE CASCADE,
  product_size JSONB NOT NULL,           -- Volume (750ml, 1L, 1.75L)
  product_cost NUMERIC(10,2) NOT NULL,   -- cost for this size (per bottle/unit)
  pack_size INTEGER DEFAULT 1,           -- 1 = single bottle, 6 = 6-pack, 12 = case
  pack_cost NUMERIC(10,2),               -- total case/pack price (product_cost = pack_cost / pack_size)
  is_default BOOLEAN DEFAULT false,
  source TEXT DEFAULT 'manual',          -- manual, invoice, barcode
  last_invoice_id UUID FK → invoices,    -- which invoice last updated this price
  last_updated_price_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(ingredient_id, product_size, pack_size)
)
```

**Migration path**: The current `product_size` and `product_cost` on the `ingredients` table become the initial "default" configuration. New configurations are added from invoice scans. The `ingredients` table keeps its current fields for backwards compatibility (they mirror the default configuration).

### UX flow when invoice scan finds a new configuration

```
"We found Tito's Handmade Vodka on your invoice."

Current default: 750ml bottle — $22.99
Invoice price:   1.75L case of 6 — $24.99/bottle ($149.94/case)

[Keep 750ml as default]  [Switch to 1.75L]
```

---

## 14. Resolved — Remaining Questions

### 1. Barcode Scanning

**Decision: Post-MVP, useful for inventory features**

Not difficult to implement (Expo has `expo-barcode-scanner`), but it's a different entry point than invoice scanning. Most useful for:

- Initial inventory setup (scan your whole bar)
- Spot-checking individual bottles
- Future inventory count features

Add to post-MVP roadmap. UPC → canonical product lookup is straightforward once the canonical product catalog exists.

### 2. Invoice Email Forwarding

**Decision: Post-MVP, after web app — add to feature-list.md**

The flow: forward invoice email to `scan@pourcost.com` → auto-extract PDF → process through same pipeline → push notification to review in app.

Requires:

- Email ingestion service (e.g., SendGrid Inbound Parse, Mailgun Routes)
- PDF parsing (separate from image OCR — PDFs often have extractable text layers)
- Push notification for review prompt
- Better suited for web app where review UX has more screen real estate

High value, lower urgency. Pairs well with the web app build.

### 3. Multi-Pack-Size Ingredients

**Decision: Support multiple configurations per ingredient (see Section 13)**

Resolved above — no merge flow needed. Each ingredient tracks multiple purchase configurations with one default.
