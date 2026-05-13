-- Admin review tracking for canonical_products.
--
-- Enrichment writes (Gemini → canonical_products) flow through the admin
-- canonical-enrichment page. Once an admin has eyeballed and approved a
-- row's enriched data, we mark it reviewed. This lets the admin queue
-- ("Load from DB" → unreviewed) focus on rows that still need human
-- attention, separately from enrichment_status (pending/complete) which
-- only tracks whether Gemini has touched the row, not whether a human has.
--
-- Later: the self-healing cycle will CLEAR reviewed_at when user-override
-- quorum signals the canonical may be wrong → it falls back into the
-- admin's review queue.

ALTER TABLE canonical_products
  ADD COLUMN IF NOT EXISTS reviewed_at timestamptz,
  ADD COLUMN IF NOT EXISTS reviewed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;

-- Lookup index for the unreviewed-queue filter — most admin queries will
-- filter by `reviewed_at IS NULL`.
CREATE INDEX IF NOT EXISTS canonical_products_reviewed_at_idx
  ON canonical_products (reviewed_at)
  WHERE reviewed_at IS NULL;
