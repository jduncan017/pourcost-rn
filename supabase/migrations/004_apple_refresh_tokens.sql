-- Stores Apple OAuth refresh tokens per user. Required to call Apple's
-- /auth/revoke endpoint on account deletion (App Store SIWA compliance).
--
-- Access is restricted to the service role (edge functions) — no RLS policies
-- means no anon/authenticated access, even though RLS is enabled.

CREATE TABLE IF NOT EXISTS public.apple_refresh_tokens (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  refresh_token TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.apple_refresh_tokens ENABLE ROW LEVEL SECURITY;

-- Keep updated_at fresh on updates
CREATE OR REPLACE FUNCTION public.touch_apple_refresh_tokens_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_apple_refresh_tokens_updated_at ON public.apple_refresh_tokens;
CREATE TRIGGER trg_apple_refresh_tokens_updated_at
  BEFORE UPDATE ON public.apple_refresh_tokens
  FOR EACH ROW EXECUTE FUNCTION public.touch_apple_refresh_tokens_updated_at();
