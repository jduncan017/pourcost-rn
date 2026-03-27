/**
 * Input sanitization for user-provided text before it reaches Supabase.
 * Strips control characters, enforces length limits, and trims whitespace.
 */

import { VALIDATION_LIMITS } from '@/src/constants/appConstants';

/** Strip control characters (except newlines/tabs) that could cause display issues */
function stripControlChars(str: string): string {
  return str.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
}

/** Sanitize a name field: trim, strip control chars, enforce max length */
export function sanitizeName(raw: string): string {
  return stripControlChars(raw.trim()).slice(0, VALIDATION_LIMITS.MAX_NAME_LENGTH);
}

/** Sanitize a description/notes field: trim, strip control chars, enforce max length */
export function sanitizeDescription(raw: string): string {
  return stripControlChars(raw.trim()).slice(0, VALIDATION_LIMITS.MAX_DESCRIPTION_LENGTH);
}
