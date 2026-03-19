import crypto from 'node:crypto';

const ALPHABET = 'abcdefghijklmnopqrstuvwxyz0123456789';

/**
 * Generates a random slug using a lowercase alphanumeric alphabet.
 * @param length - The desired slug length. Defaults to 8.
 * @returns A random slug string.
 */
export function generateSlug(length = 8): string {
  const bytes = crypto.randomBytes(length);
  return Array.from(bytes)
    .map((b) => ALPHABET[b % ALPHABET.length])
    .join('');
}
