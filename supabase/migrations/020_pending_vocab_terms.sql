-- Staging table for flavor/aroma vocabulary terms that surface from product descriptions
-- but haven't been reviewed for inclusion in the controlled vocabulary.
-- Self-healing expansion: when the canonical matching pipeline encounters an unknown term
-- it writes here; a periodic review promotes approved terms to the flavor vocab.
CREATE TABLE IF NOT EXISTS pending_vocab_terms (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  term        text NOT NULL,
  source_text text,                         -- excerpt that contained the term
  category    text,                         -- 'flavor' | 'aroma' | 'texture' | etc.
  occurrences integer NOT NULL DEFAULT 1,
  first_seen  timestamptz NOT NULL DEFAULT now(),
  last_seen   timestamptz NOT NULL DEFAULT now(),
  reviewed    boolean NOT NULL DEFAULT false,
  approved    boolean,                      -- null = pending, true = promote, false = reject
  UNIQUE (term)
);

ALTER TABLE pending_vocab_terms ENABLE ROW LEVEL SECURITY;

-- Service-role-only writes (pipeline); no direct user access needed
CREATE POLICY "service role only" ON pending_vocab_terms
  USING (false)
  WITH CHECK (false);
