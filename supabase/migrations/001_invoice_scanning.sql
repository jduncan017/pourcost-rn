-- ============================================================
-- Migration 001: Invoice Scanning — Phase 1 Foundation
-- Adds global catalog tables and user-scoped invoice tables.
-- Additive only — no changes to existing table columns except
-- two optional columns added to ingredients.
-- ============================================================

-- ============================================================
-- GLOBAL TABLES (shared across all users, no user_id)
-- ============================================================

-- Canonical product catalog — the identity layer
-- "Tito's Handmade Vodka" is one product regardless of distributor
CREATE TABLE canonical_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  brand TEXT,
  category TEXT,                    -- Spirit, Beer, Wine, Mixer, Garnish
  subcategory TEXT,                 -- Vodka, Bourbon, IPA, Pinot Noir
  default_sizes JSONB,              -- array of common Volume values
  abv NUMERIC(5,2),
  origin TEXT,
  description TEXT,
  image_url TEXT,
  flavor_notes JSONB,               -- ["clean", "crisp", "peppery"]
  enrichment_status TEXT DEFAULT 'pending' CHECK (enrichment_status IN ('pending', 'complete', 'failed')),
  enriched_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_canonical_products_name ON canonical_products(name);
CREATE INDEX idx_canonical_products_brand ON canonical_products(brand);
CREATE INDEX idx_canonical_products_category ON canonical_products(category);

-- Enable pg_trgm for fuzzy name matching (used by matching cascade)
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX idx_canonical_products_name_trgm ON canonical_products USING gin(name gin_trgm_ops);

-- Known distributors
CREATE TABLE distributors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT,                        -- broadline, spirits, beer, wine
  regions JSONB,                    -- ["TX", "FL", "CA"]
  detection_patterns JSONB,         -- header/footer text patterns for auto-detection
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_distributors_name ON distributors(name);

-- Invoice parsing templates for known distributor formats
CREATE TABLE invoice_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  distributor_id UUID NOT NULL REFERENCES distributors(id) ON DELETE CASCADE,
  version INTEGER DEFAULT 1,
  format_type TEXT,                 -- tabular, list, custom
  column_mapping JSONB,             -- {sku: col_index, name: col_index, ...}
  parsing_rules JSONB,              -- regex patterns, delimiters, markers
  sample_count INTEGER DEFAULT 0,  -- how many invoices built this template
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_invoice_templates_distributor ON invoice_templates(distributor_id);

-- Maps distributor SKUs to canonical products
CREATE TABLE distributor_skus (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  distributor_id UUID NOT NULL REFERENCES distributors(id) ON DELETE CASCADE,
  sku TEXT NOT NULL,
  raw_product_name TEXT,            -- name exactly as printed on invoice
  canonical_product_id UUID REFERENCES canonical_products(id),
  product_size JSONB,               -- Volume (750ml, 1.75L, etc.)
  pack_size INTEGER DEFAULT 1,      -- 1 = single, 6 = 6-pack, 12 = case
  confidence NUMERIC(3,2) DEFAULT 0,
  verified BOOLEAN DEFAULT false,
  verified_by_count INTEGER DEFAULT 0,
  region TEXT,                      -- state code, nullable (region-specific SKUs)
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(distributor_id, sku, region)
);

CREATE INDEX idx_distributor_skus_distributor ON distributor_skus(distributor_id);
CREATE INDEX idx_distributor_skus_canonical ON distributor_skus(canonical_product_id);
CREATE INDEX idx_distributor_skus_sku ON distributor_skus(sku);
CREATE INDEX idx_distributor_skus_name_trgm ON distributor_skus USING gin(raw_product_name gin_trgm_ops);

-- ============================================================
-- USER-SCOPED TABLES
-- ============================================================

-- Scanned invoices
CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  distributor_id UUID REFERENCES distributors(id),
  invoice_date DATE,
  invoice_number TEXT,
  image_urls JSONB DEFAULT '[]'::jsonb,  -- array of Supabase Storage paths
  raw_ocr_text TEXT,
  status TEXT DEFAULT 'processing' CHECK (status IN ('processing', 'review', 'complete', 'failed')),
  processing_tier TEXT CHECK (processing_tier IN ('template', 'fuzzy', 'llm', 'vision')),
  processing_cost_cents INTEGER DEFAULT 0,
  total_items INTEGER DEFAULT 0,
  matched_items INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_invoices_user ON invoices(user_id);
CREATE INDEX idx_invoices_status ON invoices(user_id, status);
CREATE INDEX idx_invoices_distributor ON invoices(distributor_id);

-- Parsed line items from invoices
CREATE TABLE invoice_line_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  line_number INTEGER,
  raw_text TEXT,
  sku TEXT,
  product_name TEXT,
  quantity NUMERIC(10,2),
  unit TEXT,                        -- case, bottle, each
  unit_price NUMERIC(10,2),
  total_price NUMERIC(10,2),
  pack_size INTEGER,

  -- Matching results
  matched_ingredient_id UUID REFERENCES ingredients(id),
  canonical_product_id UUID REFERENCES canonical_products(id),
  distributor_sku_id UUID REFERENCES distributor_skus(id),
  match_method TEXT CHECK (match_method IN ('sku_exact', 'fuzzy', 'llm', 'manual')),
  match_confidence NUMERIC(3,2),
  match_status TEXT DEFAULT 'unmatched' CHECK (match_status IN ('auto_matched', 'confirmed', 'corrected', 'unmatched', 'skipped', 'credit')),

  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_line_items_invoice ON invoice_line_items(invoice_id);
CREATE INDEX idx_line_items_ingredient ON invoice_line_items(matched_ingredient_id);
CREATE INDEX idx_line_items_match_status ON invoice_line_items(invoice_id, match_status);

-- Org-level product identity mappings
-- "When I scan Tito's from any distributor, map it to my 'Tito's Vodka' ingredient"
CREATE TABLE org_product_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  canonical_product_id UUID NOT NULL REFERENCES canonical_products(id),
  ingredient_id UUID NOT NULL REFERENCES ingredients(id) ON DELETE CASCADE,
  custom_name TEXT,                 -- bar's own name if different from canonical
  auto_update_price BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, canonical_product_id)
);

CREATE INDEX idx_org_mappings_user ON org_product_mappings(user_id);
CREATE INDEX idx_org_mappings_canonical ON org_product_mappings(canonical_product_id);
CREATE INDEX idx_org_mappings_ingredient ON org_product_mappings(ingredient_id);

-- Multiple purchase configurations per ingredient
-- e.g. Tito's: 750ml bottle config + 1.75L case config
CREATE TABLE ingredient_configurations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ingredient_id UUID NOT NULL REFERENCES ingredients(id) ON DELETE CASCADE,
  product_size JSONB NOT NULL,      -- Volume
  product_cost NUMERIC(10,2) NOT NULL,
  pack_size INTEGER DEFAULT 1,      -- 1 = single, 6 = 6-pack, 12 = case
  pack_cost NUMERIC(10,2),          -- total case/pack price
  is_default BOOLEAN DEFAULT false,
  source TEXT DEFAULT 'manual' CHECK (source IN ('manual', 'invoice', 'barcode')),
  last_invoice_id UUID REFERENCES invoices(id),
  last_updated_price_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(ingredient_id, product_size, pack_size)
);

CREATE INDEX idx_ingredient_configs_ingredient ON ingredient_configurations(ingredient_id);
CREATE INDEX idx_ingredient_configs_default ON ingredient_configurations(ingredient_id, is_default);

-- Price history for trend tracking
CREATE TABLE ingredient_price_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ingredient_id UUID NOT NULL REFERENCES ingredients(id) ON DELETE CASCADE,
  invoice_line_item_id UUID REFERENCES invoice_line_items(id),
  old_price NUMERIC(10,2),
  new_price NUMERIC(10,2) NOT NULL,
  price_change_pct NUMERIC(5,2),
  recorded_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_price_history_ingredient ON ingredient_price_history(ingredient_id);
CREATE INDEX idx_price_history_recorded ON ingredient_price_history(ingredient_id, recorded_at DESC);

-- ============================================================
-- ADDITIVE CHANGES TO EXISTING TABLES
-- ============================================================

-- Link ingredients to canonical products (optional — populated from invoice scans)
ALTER TABLE ingredients
  ADD COLUMN IF NOT EXISTS canonical_product_id UUID REFERENCES canonical_products(id),
  ADD COLUMN IF NOT EXISTS is_custom BOOLEAN DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_ingredients_canonical ON ingredients(canonical_product_id);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE canonical_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE distributors ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE distributor_skus ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_line_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE org_product_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE ingredient_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ingredient_price_history ENABLE ROW LEVEL SECURITY;

-- Global catalog: public read, no user writes (admin-managed)
CREATE POLICY "Anyone can read canonical_products"
  ON canonical_products FOR SELECT USING (true);

CREATE POLICY "Anyone can read distributors"
  ON distributors FOR SELECT USING (true);

CREATE POLICY "Anyone can read invoice_templates"
  ON invoice_templates FOR SELECT USING (true);

CREATE POLICY "Anyone can read distributor_skus"
  ON distributor_skus FOR SELECT USING (true);

-- User-scoped tables: users manage their own
CREATE POLICY "Users manage own invoices"
  ON invoices FOR ALL
  USING (user_id = auth.uid());

CREATE POLICY "Users manage own invoice_line_items"
  ON invoice_line_items FOR ALL
  USING (
    invoice_id IN (SELECT id FROM invoices WHERE user_id = auth.uid())
  );

CREATE POLICY "Users manage own org_product_mappings"
  ON org_product_mappings FOR ALL
  USING (user_id = auth.uid());

CREATE POLICY "Users manage own ingredient_configurations"
  ON ingredient_configurations FOR ALL
  USING (
    ingredient_id IN (SELECT id FROM ingredients WHERE user_id = auth.uid())
  );

CREATE POLICY "Users manage own ingredient_price_history"
  ON ingredient_price_history FOR ALL
  USING (
    ingredient_id IN (SELECT id FROM ingredients WHERE user_id = auth.uid())
  );

-- ============================================================
-- UPDATED_AT TRIGGERS
-- ============================================================

CREATE TRIGGER set_updated_at BEFORE UPDATE ON canonical_products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON invoices
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- SUPABASE STORAGE BUCKET
-- (Run this separately via Supabase dashboard or management API
--  if not using the SQL editor's storage functions)
-- ============================================================

-- INSERT INTO storage.buckets (id, name, public)
-- VALUES ('invoices', 'invoices', false);
--
-- CREATE POLICY "Users can upload their own invoices"
--   ON storage.objects FOR INSERT
--   WITH CHECK (bucket_id = 'invoices' AND auth.uid()::text = (storage.foldername(name))[1]);
--
-- CREATE POLICY "Users can read their own invoices"
--   ON storage.objects FOR SELECT
--   USING (bucket_id = 'invoices' AND auth.uid()::text = (storage.foldername(name))[1]);
--
-- CREATE POLICY "Users can delete their own invoices"
--   ON storage.objects FOR DELETE
--   USING (bucket_id = 'invoices' AND auth.uid()::text = (storage.foldername(name))[1]);
