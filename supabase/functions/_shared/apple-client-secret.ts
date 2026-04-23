/**
 * Generates an Apple "client secret" JWT used to authenticate with
 * appleid.apple.com for the token exchange and revoke endpoints.
 *
 * Spec: https://developer.apple.com/documentation/sign_in_with_apple/generate_and_validate_tokens
 *
 * Required environment variables (set via Supabase dashboard → Edge Functions → Secrets):
 *   APPLE_TEAM_ID      — 10-char Apple Developer Team ID (e.g. "ABCD12EF34")
 *   APPLE_KEY_ID       — 10-char Key ID from the AuthKey_XXXXXXXXXX.p8 file
 *   APPLE_CLIENT_ID    — for native iOS flow, this is your app's bundle ID
 *                        (e.g. "clutterbuck.PourCostFree"). For web/services flow,
 *                        it would be a Services ID.
 *   APPLE_PRIVATE_KEY  — full contents of the .p8 file, including the
 *                        -----BEGIN PRIVATE KEY----- / -----END PRIVATE KEY----- lines.
 */

import { create } from "https://deno.land/x/djwt@v3.0.2/mod.ts";

const APPLE_TEAM_ID = Deno.env.get('APPLE_TEAM_ID');
const APPLE_KEY_ID = Deno.env.get('APPLE_KEY_ID');
const APPLE_CLIENT_ID_RAW = Deno.env.get('APPLE_CLIENT_ID');
const APPLE_PRIVATE_KEY = Deno.env.get('APPLE_PRIVATE_KEY');

function assertAppleEnv(): asserts APPLE_TEAM_ID is string {
  if (!APPLE_TEAM_ID || !APPLE_KEY_ID || !APPLE_CLIENT_ID_RAW || !APPLE_PRIVATE_KEY) {
    throw new Error(
      'Apple SIWA secrets missing. Set APPLE_TEAM_ID, APPLE_KEY_ID, APPLE_CLIENT_ID, APPLE_PRIVATE_KEY.'
    );
  }
}

export const APPLE_CLIENT_ID = APPLE_CLIENT_ID_RAW ?? '';

async function importApplePrivateKey(): Promise<CryptoKey> {
  assertAppleEnv();
  const pemContents = (APPLE_PRIVATE_KEY as string)
    .replace(/-----BEGIN PRIVATE KEY-----/, '')
    .replace(/-----END PRIVATE KEY-----/, '')
    .replace(/\s+/g, '');
  const binaryDer = Uint8Array.from(atob(pemContents), (c) => c.charCodeAt(0));
  return crypto.subtle.importKey(
    'pkcs8',
    binaryDer.buffer as ArrayBuffer,
    { name: 'ECDSA', namedCurve: 'P-256' },
    false,
    ['sign']
  );
}

export async function generateAppleClientSecret(): Promise<string> {
  assertAppleEnv();
  const key = await importApplePrivateKey();
  const now = Math.floor(Date.now() / 1000);
  return await create(
    { alg: 'ES256', kid: APPLE_KEY_ID!, typ: 'JWT' },
    {
      iss: APPLE_TEAM_ID!,
      iat: now,
      exp: now + 60 * 60, // 1h — token-exchange/revoke calls are instant
      aud: 'https://appleid.apple.com',
      sub: APPLE_CLIENT_ID_RAW!,
    },
    key
  );
}
