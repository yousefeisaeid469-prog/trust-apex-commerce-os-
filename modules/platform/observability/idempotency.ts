const seen = new Map<string, { value: unknown; expiresAt: number }>();
export function getIdempotent<T>(key: string): T | undefined {
  const row = seen.get(key);
  if (!row) return undefined;
  if (row.expiresAt <= Date.now()) { seen.delete(key); return undefined; }
  return row.value as T;
}
export function setIdempotent(key: string, value: unknown, ttlMs = 24 * 60 * 60_000) {
  seen.set(key, { value, expiresAt: Date.now() + Math.max(1000, ttlMs) });
}
export function requireIdempotencyKey(value: string | null | undefined) {
  const key = value?.trim();
  if (!key || key.length < 8 || key.length > 128) throw new Error('IDEMPOTENCY_KEY_REQUIRED');
  return key;
}
