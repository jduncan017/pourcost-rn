/**
 * Normalize a value that may be a Date, ISO string, or number to a Date object.
 * Used to handle dates that may have been serialized through JSON (AsyncStorage).
 */
export function ensureDate(value: Date | string | number): Date {
  if (value instanceof Date) return value;
  return new Date(value);
}
