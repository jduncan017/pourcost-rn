/**
 * Supabase Edge Function: delete-account
 *
 * Permanently deletes the authenticated user and all their data.
 * Required by Apple Guideline 5.1.1(v).
 *
 * Flow:
 *   1. Verify the caller's JWT and extract their user_id
 *   2. If the user has an Apple refresh token stored, call Apple's /auth/revoke
 *      endpoint so the app is removed from their Apple ID's "Sign in with Apple"
 *      list. Failures here are logged but don't block deletion.
 *   3. Delete their invoice images from Storage (under `{user_id}/` prefix)
 *   4. Call auth.admin.deleteUser — ON DELETE CASCADE handles profiles,
 *      ingredients, cocktails, invoices, apple_refresh_tokens, etc.
 *
 * Environment variables (auto-injected by Supabase):
 *   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 * Apple secrets (manual — see _shared/apple-client-secret.ts):
 *   APPLE_TEAM_ID, APPLE_KEY_ID, APPLE_CLIENT_ID, APPLE_PRIVATE_KEY
 */

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { revokeAppleForUser } from "../_shared/apple-revoke.ts";

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
    if (userErr || !userData?.user) {
      console.warn('admin.auth.getUser failed', {
        message: userErr?.message,
        status: userErr?.status,
        hasUser: !!userData?.user,
      });
      return json({ error: 'Invalid session', detail: userErr?.message ?? 'no user' }, 401);
    }

    const userId = userData.user.id;

    // Revoke Apple BEFORE deleting, so we still have the refresh_token row.
    const revokeResult = await revokeAppleForUser(admin, userId);
    if (!revokeResult.revoked && revokeResult.reason !== 'no_token') {
      console.warn('Apple revoke incomplete during delete', revokeResult);
    }

    // Delete invoice storage objects under `{userId}/`
    const { data: objects, error: listErr } = await admin.storage
      .from('invoices')
      .list(userId, { limit: 1000 });
    if (!listErr && objects && objects.length > 0) {
      const paths = objects.map((o) => `${userId}/${o.name}`);
      await admin.storage.from('invoices').remove(paths);
    }

    const { error: deleteErr } = await admin.auth.admin.deleteUser(userId);
    if (deleteErr) {
      return json({ error: `Failed to delete account: ${deleteErr.message}` }, 500);
    }

    return json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return json({ error: message }, 500);
  }
});
