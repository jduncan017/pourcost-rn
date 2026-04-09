/**
 * Test-only Supabase client using the service role key.
 * Bypasses RLS so integration tests can run without an app auth session.
 *
 * NEVER import this from app code — only from __tests__/.
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

// Load .env from project root (jest runs from project root)
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  throw new Error(
    'Missing EXPO_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env — cannot run integration tests'
  );
}

export const testSupabase = createClient(url, serviceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});
