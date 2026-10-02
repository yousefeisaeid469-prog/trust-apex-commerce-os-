import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';

const KEY_BYTES = 32;
function keyFromEnv() {
  const raw = process.env.TRUST_FIELD_ENCRYPTION_KEY;
  if (!raw) throw new Error('FIELD_ENCRYPTION_KEY_REQUIRED');
  const key = Buffer.from(raw, 'base64');
  if (key.length !== KEY_BYTES) throw new Error('FIELD_ENCRYPTION_KEY_MUST_BE_32_BYTES_BASE64');
  return key;
}

export function encryptSensitive(plaintext: string): string {
  if (typeof plaintext !== 'string') throw new Error('PLAINTEXT_REQUIRED');
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', keyFromEnv(), iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `v1.${iv.toString('base64url')}.${tag.toString('base64url')}.${ciphertext.toString('base64url')}`;
}

export function decryptSensitive(encoded: string): string {
  const [version, ivRaw, tagRaw, ciphertextRaw] = encoded.split('.');
  if (version !== 'v1' || !ivRaw || !tagRaw || !ciphertextRaw) throw new Error('INVALID_ENCRYPTED_FIELD');
  const decipher = createDecipheriv('aes-256-gcm', keyFromEnv(), Buffer.from(ivRaw, 'base64url'));
  decipher.setAuthTag(Buffer.from(tagRaw, 'base64url'));
  return Buffer.concat([decipher.update(Buffer.from(ciphertextRaw, 'base64url')), decipher.final()]).toString('utf8');
}
