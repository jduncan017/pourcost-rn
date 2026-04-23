/**
 * Supabase Edge Function: request-email-verification
 *
 * Called right after an email signup (or anytime the user taps "Verify Email"
 * in Settings). Nulls the user's `email_confirmed_at` via the
 * `mark_email_unverified` RPC so Supabase considers them unverified. The
 * client then calls `supabase.auth.resend({ type: 'signup', email })` to
 * trigger Supabase's native signup-confirmation email.
 *
 * Splitting this into two steps (server-side un-confirm, then client-side
 * resend) lets us lean on Supabase's built-in email-template + verify endpoint
 * without running our own token store.
 */

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return json({ error: 'Missing Authorization header' }, 401);
    const token = authHeader.replace(/^Bearer\s+/i, '');

    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { data: userData, error: userErr } = await admin.auth.getUser(token);
    if (userErr || !userData?.user) return json({ error: 'Invalid session' }, 401);
    const userId = userData.user.id;

    // Null the confirmation timestamp so the next resend request is accepted.
    const { error: rpcErr } = await admin.rpc('mark_email_unverified', { p_user_id: userId });
    if (rpcErr) {
      console.error('mark_email_unverified failed', rpcErr);
      return json({ error: 'Could not flag email as unverified' }, 500);
    }

    return json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('request-email-verification error', err);
    return json({ error: message }, 500);
  }
});
