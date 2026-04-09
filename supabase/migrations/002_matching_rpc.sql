-- ============================================================
-- Migration 002: Matching Cascade — RPC Functions
-- Server-side fuzzy matching using pg_trgm for the matching
-- cascade service (Level 3: canonical product matching).
-- ============================================================

-- Fuzzy-match a product name against canonical_products using pg_trgm.
-- Returns top N matches above a similarity threshold.
CREATE OR REPLACE FUNCTION match_canonical_products(
  search_name TEXT,
  min_similarity FLOAT DEFAULT 0.6,
  max_results INT DEFAULT 5
)
RETURNS TABLE(id UUID, name TEXT, similarity FLOAT, ingredient_name TEXT) AS $$
BEGIN
  RETURN QUERY
  SELECT
    cp.id,
    cp.name,
    similarity(cp.name, search_name)::FLOAT AS sim,
    cp.name AS ingredient_name
  FROM canonical_products cp
  WHERE similarity(cp.name, search_name) >= min_similarity
  ORDER BY similarity(cp.name, search_name) DESC
  LIMIT max_results;
END;
$$ LANGUAGE plpgsql STABLE;
