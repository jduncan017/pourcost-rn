-- Supports the "optional email verification" flow.
--
-- Our Supabase project runs with `enable_confirmations = false` — email signup
-- auto-confirms the user and issues a session. That gives great UX (no "check
-- your email before you can use the app" gate) but means we never track who
-- has actually verified their email.
--
-- This RPC runs as service role (called from the `request-email-verification`
-- edge function) and clears `email_confirmed_at` on the specified user, so a
-- subsequent `supabase.auth.resend({ type: 'signup' })` can fire Supabase's
-- native verification email. When the user clicks the link, Supabase's verify
-- endpoint sets `email_confirmed_at` back to now().
--
-- Note: `auth.users.confirmed_at` is a generated column (coalesce of
-- email_confirmed_at and phone_confirmed_at) on modern Supabase projects,
-- so we only touch `email_confirmed_at` — the computed column follows.

CREATE OR REPLACE FUNCTION public.mark_email_unverified(p_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  UPDATE auth.users
  SET email_confirmed_at = NULL
  WHERE id = p_user_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.mark_email_unverified(UUID) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.mark_email_unverified(UUID) TO service_role;
