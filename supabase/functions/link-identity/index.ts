/**
 * Supabase Edge Function: link-identity
 *
 * Links an Apple or Google identity to the currently authenticated user using
 * a native id_token. Mirrors the UX of native sign-in (Face ID prompt, no
 * browser leave) without falling back to Supabase's browser-OAuth linkIdentity.
 *
 * Flow:
 *   1. Verify caller's session JWT → extract user_id
 *   2. Verify the supplied id_token against the provider's JWKS (Apple/Google)
 *   3. Validate audience, issuer, expiry, and nonce (Apple only)
 *   4. Insert into auth.identities via the `link_user_identity` RPC
 *      (handles cross-user conflict detection)
 *
 * Request body:
 *   { provider: "apple" | "google", idToken: string, rawNonce?: string }
 *
 * Environment variables (set in Supabase Dashboard → Edge Functions → Secrets):
 *   APPLE_CLIENT_ID         — iOS Bundle ID (e.g. "clutterbuck.PourCostFree")
 *   GOOGLE_WEB_CLIENT_ID    — Google Web OAuth client ID (primary audience)
 *   GOOGLE_IOS_CLIENT_ID    — Google iOS OAuth client ID (fallback audience)
 *   SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY  — auto-injected
 */

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { jwtVerify, createRemoteJWKSet } from "npm:jose@5.9.6";

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
// Fail loud on missing APPLE_CLIENT_ID — a silent fallback would cause
// audience-check success for the primary target while silently rejecting any
// multi-target bundle IDs, which is worse than an obvious error.
const APPLE_CLIENT_ID = Deno.env.get('APPLE_CLIENT_ID');
if (!APPLE_CLIENT_ID) {
  throw new Error('APPLE_CLIENT_ID env secret is required for link-identity');
}
const GOOGLE_WEB_CLIENT_ID = Deno.env.get('GOOGLE_WEB_CLIENT_ID');
const GOOGLE_IOS_CLIENT_ID = Deno.env.get('GOOGLE_IOS_CLIENT_ID');

const APPLE_JWKS = createRemoteJWKSet(new URL('https://appleid.apple.com/auth/keys'));
const GOOGLE_JWKS = createRemoteJWKSet(new URL('https://www.googleapis.com/oauth2/v3/certs'));

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

async function sha256Hex(input: string): Promise<string> {
  const buf = new TextEncoder().encode(input);
  const hash = await crypto.subtle.digest('SHA-256', buf);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

interface VerifiedIdentity {
  sub: string;
  email?: string;
  email_verified?: boolean;
  name?: string;
  raw: Record<string, unknown>;
}

async function verifyAppleIdToken(idToken: string, rawNonce: string): Promise<VerifiedIdentity> {
  const { payload } = await jwtVerify(idToken, APPLE_JWKS, {
    issuer: 'https://appleid.apple.com',
    audience: APPLE_CLIENT_ID,
  });
  if (!payload.sub) throw new Error('Apple id_token missing sub');

  // Apple linking always requires nonce verification. Prevents id_token
  // replay — an attacker-captured token can't be used to link an Apple
  // identity to their own account without also knowing the rawNonce (which
  // only the originating client ever possesses in plaintext).
  const hashed = await sha256Hex(rawNonce);
  if (payload.nonce !== hashed) throw new Error('Apple nonce mismatch');

  return {
    sub: payload.sub,
    email: (payload.email as string | undefined) ?? undefined,
    email_verified: (payload.email_verified as boolean | undefined) ?? undefined,
    raw: payload as Record<string, unknown>,
  };
}

async function verifyGoogleIdToken(idToken: string): Promise<VerifiedIdentity> {
  const audience = [GOOGLE_WEB_CLIENT_ID, GOOGLE_IOS_CLIENT_ID].filter(
    (v): v is string => typeof v === 'string' && v.length > 0
  );
  if (audience.length === 0) {
    throw new Error('GOOGLE_WEB_CLIENT_ID / GOOGLE_IOS_CLIENT_ID not configured');
  }
  const { payload } = await jwtVerify(idToken, GOOGLE_JWKS, {
    issuer: ['https://accounts.google.com', 'accounts.google.com'],
    audience,
  });
  if (!payload.sub) throw new Error('Google id_token missing sub');

  return {
    sub: payload.sub,
    email: (payload.email as string | undefined) ?? undefined,
    email_verified: (payload.email_verified as boolean | undefined) ?? undefined,
    name: (payload.name as string | undefined) ?? undefined,
    raw: payload as Record<string, unknown>,
  };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return json({ error: 'Missing Authorization header' }, 401);
    const token = authHeader.replace(/^Bearer\s+/i, '');

    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { data: userData, error: userErr } = await admin.auth.getUser(token);
    if (userErr || !userData?.user) {
      console.warn('getUser failed', userErr?.message);
      return json({ error: 'Invalid session' }, 401);
    }
    const userId = userData.user.id;

    const body = await req.json().catch(() => null) as {
      provider?: 'apple' | 'google';
      idToken?: string;
      rawNonce?: string;
    } | null;

    if (!body) return json({ error: 'Invalid body' }, 400);
    if (body.provider !== 'apple' && body.provider !== 'google') {
      return json({ error: 'Invalid provider' }, 400);
    }
    if (!body.idToken) return json({ error: 'Missing idToken' }, 400);
    if (body.provider === 'apple' && !body.rawNonce) {
      return json({ error: 'Apple linking requires rawNonce' }, 400);
    }

    let verified: VerifiedIdentity;
    try {
      verified = body.provider === 'apple'
        ? await verifyAppleIdToken(body.idToken, body.rawNonce!)
        : await verifyGoogleIdToken(body.idToken);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'token verification failed';
      console.warn('id_token verification failed', message);
      return json({ error: `Invalid id_token: ${message}` }, 400);
    }

    // Build the identity_data blob to mirror what Supabase writes on native signInWithIdToken.
    const identityData: Record<string, unknown> = {
      sub: verified.sub,
      email: verified.email ?? null,
      email_verified: verified.email_verified ?? false,
      provider_id: verified.sub,
    };
    if (verified.name) identityData.full_name = verified.name;

    const { data: rpcResult, error: rpcErr } = await admin.rpc('link_user_identity', {
      p_user_id: userId,
      p_provider: body.provider,
      p_provider_id: verified.sub,
      p_identity_data: identityData,
    });

    if (rpcErr) {
      console.error('link_user_identity RPC error', rpcErr);
      return json({ error: `Link failed: ${rpcErr.message}` }, 500);
    }

    const status = (rpcResult as { status?: string } | null)?.status;
    if (status === 'already_linked') {
      return json({ error: 'This account is already linked.' }, 409);
    }
    if (status === 'in_use_by_other') {
      return json({ error: 'This identity is linked to another account.' }, 409);
    }
    if (status !== 'linked') {
      return json({ error: 'Unexpected link result' }, 500);
    }

    return json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('link-identity error', err);
    return json({ error: message }, 500);
  }
});
