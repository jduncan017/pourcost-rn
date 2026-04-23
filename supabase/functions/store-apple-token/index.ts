/**
 * Supabase Edge Function: store-apple-token
 *
 * Called from the client immediately after a successful Sign in with Apple.
 * Exchanges the one-time Apple authorization_code for a refresh_token, then
 * stores it so we can call Apple's /auth/revoke endpoint when the user deletes
 * their account (App Store Guideline 5.1.1(v) / SIWA compliance).
 *
 * Apple authorization_codes expire in ~5 minutes and are single-use, so this
 * must run promptly after sign-in.
 *
 * Request body:
 *   { authorizationCode: string }
 *
 * Auth: requires a valid Supabase session JWT in Authorization: Bearer header.
 *
 * Environment:
 *   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (auto-injected)
 *   APPLE_TEAM_ID, APPLE_KEY_ID, APPLE_CLIENT_ID, APPLE_PRIVATE_KEY (manual)
 */

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { generateAppleClientSecret, APPLE_CLIENT_ID } from "../_shared/apple-client-secret.ts";

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

    const { authorizationCode } = await req.json().catch(() => ({}));
    if (!authorizationCode || typeof authorizationCode !== 'string') {
      return json({ error: 'Missing authorizationCode' }, 400);
    }

    // Exchange the authorization_code for a refresh_token.
    const clientSecret = await generateAppleClientSecret();
    const form = new URLSearchParams({
      client_id: APPLE_CLIENT_ID,
      client_secret: clientSecret,
      code: authorizationCode,
      grant_type: 'authorization_code',
    });

    const tokenRes = await fetch('https://appleid.apple.com/auth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: form.toString(),
    });

    if (!tokenRes.ok) {
      const body = await tokenRes.text();
      console.error('Apple token exchange failed', tokenRes.status, body);
      return json({ error: 'Apple token exchange failed', detail: body }, 502);
    }

    const tokenBody = await tokenRes.json() as { refresh_token?: string };
    const refreshToken = tokenBody.refresh_token;
    if (!refreshToken) {
      return json({ error: 'Apple response missing refresh_token' }, 502);
    }

    const { error: upsertErr } = await admin
      .from('apple_refresh_tokens')
      .upsert({ user_id: userId, refresh_token: refreshToken }, { onConflict: 'user_id' });

    if (upsertErr) {
      console.error('Failed to store apple refresh token', upsertErr);
      return json({ error: 'Failed to store token' }, 500);
    }

    return json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('store-apple-token error', err);
    return json({ error: message }, 500);
  }
});
