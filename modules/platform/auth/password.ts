const ITERATIONS = 120_000;
const KEY_LENGTH = 256;
const SALT_BYTES = 16;

function toBase64(bytes: Uint8Array) {
  return Buffer.from(bytes).toString('base64url');
}

function fromBase64(value: string) {
  return new Uint8Array(Buffer.from(value, 'base64url'));
}

export async function hashPassword(password: string) {
  if (password.length < 8 || password.length > 128) throw new Error('Password must be 8-128 characters');
  const salt = crypto.getRandomValues(new Uint8Array(SALT_BYTES));
  const material = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt, iterations: ITERATIONS, hash: 'SHA-256' }, material, KEY_LENGTH);
  return `pbkdf2-sha256$${ITERATIONS}$${toBase64(salt)}$${toBase64(new Uint8Array(bits))}`;
}

export async function verifyPassword(password: string, encoded: string) {
  const [scheme, iterationText, saltText, digestText] = encoded.split('$');
  if (scheme !== 'pbkdf2-sha256') return false;
  const iterations = Number(iterationText);
  if (!Number.isInteger(iterations) || iterations < 100_000) return false;
  const salt = fromBase64(saltText);
  const expected = fromBase64(digestText);
  const material = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt, iterations, hash: 'SHA-256' }, material, expected.byteLength * 8);
  const actual = new Uint8Array(bits);
  if (actual.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < actual.length; i++) diff |= actual[i] ^ expected[i];
  return diff === 0;
}
