import { createHmac, timingSafeEqual } from 'crypto';

export function signWebhook(payload: string, secret: string) {
  return createHmac('sha256', secret).update(payload).digest('hex');
}

export function verifyWebhook(payload: string, signature: string | null, secret: string | undefined) {
  if (!secret || !signature) return false;
  const expected = signWebhook(payload, secret);
  const a = Buffer.from(expected, 'utf8');
  const b = Buffer.from(signature, 'utf8');
  return a.length === b.length && timingSafeEqual(a, b);
}
