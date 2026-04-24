/**
 * Password strength rules — shared between signup and change-password flows.
 * Match exactly what the server-side Supabase policy enforces so there are no
 * client-vs-server mismatches.
 */

export interface PasswordRule {
  label: string;
  test: (password: string) => boolean;
}

export const PASSWORD_RULES: PasswordRule[] = [
  { label: '8+ characters', test: (pw) => pw.length >= 8 },
  { label: 'Uppercase letter', test: (pw) => /[A-Z]/.test(pw) },
  { label: 'Number', test: (pw) => /[0-9]/.test(pw) },
  { label: 'Symbol', test: (pw) => /[^A-Za-z0-9]/.test(pw) },
];
