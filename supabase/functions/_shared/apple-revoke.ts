/**
 * Shared Apple token revocation. Used by:
 *   - delete-account (before deleting the user)
 *   - revoke-apple-token (on Apple unlink)
 *
 * Looks up the user's stored Apple refresh_token, calls Apple's /auth/revoke,
 * and removes the row from apple_refresh_tokens. All steps are best-effort:
 * failures are logged but don't throw, so callers can continue their primary
 * flow (delete / unlink) without being blocked by Apple-side hiccups.
 */

import type { createClient } from "jsr:@supabase/supabase-js@2";
import { generateAppleClientSecret, APPLE_CLIENT_ID } from "./apple-client-secret.ts";

type SupabaseAdmin = ReturnType<typeof createClient>;

export interface AppleRevokeResult {
  revoked: boolean;
  reason?: 'no_token' | 'lookup_failed' | 'apple_error' | 'revoke_threw';
  detail?: string;
}

export async function revokeAppleForUser(
  admin: SupabaseAdmin,
  userId: string,
): Promise<AppleRevokeResult> {
  const { data: row, error: lookupErr } = await admin
    .from('apple_refresh_tokens')
    .select('refresh_token')
    .eq('user_id', userId)
    .maybeSingle();

  if (lookupErr) {
    console.warn('Could not look up Apple refresh token', lookupErr.message);
    return { revoked: false, reason: 'lookup_failed', detail: lookupErr.message };
  }
  if (!row?.refresh_token) {
    return { revoked: false, reason: 'no_token' };
  }

  let appleOk = false;
  let appleDetail: string | undefined;
  try {
    const clientSecret = await generateAppleClientSecret();
    const form = new URLSearchParams({
      client_id: APPLE_CLIENT_ID,
      client_secret: clientSecret,
      token: row.refresh_token,
      token_type_hint: 'refresh_token',
    });
    const res = await fetch('https://appleid.apple.com/auth/revoke', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: form.toString(),
    });
    if (!res.ok) {
      appleDetail = await res.text();
      console.warn('Apple revoke returned non-OK', res.status, appleDetail);
    } else {
      appleOk = true;
    }
  } catch (err) {
    appleDetail = err instanceof Error ? err.message : String(err);
    console.warn('Apple revoke threw', appleDetail);
  }

  // Drop the stored refresh_token regardless — it's tied to this session/grant
  // which we're tearing down either way.
  const { error: deleteErr } = await admin
    .from('apple_refresh_tokens')
    .delete()
    .eq('user_id', userId);
  if (deleteErr) console.warn('Failed to delete apple_refresh_tokens row', deleteErr.message);

  if (!appleOk) {
    return { revoked: false, reason: appleDetail ? 'apple_error' : 'revoke_threw', detail: appleDetail };
  }
  return { revoked: true };
}
