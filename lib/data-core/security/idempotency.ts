type Entry = { fingerprint: string; response: unknown; expiresAt: number };
const entries = new Map<string, Entry>();

export function remember(key: string, fingerprint: string, response: unknown, ttlMs = 86_400_000): void {
  entries.set(key, { fingerprint, response, expiresAt: Date.now() + ttlMs });
}

export function replay(key: string, fingerprint: string): { hit: boolean; response?: unknown } {
  const entry = entries.get(key);
  if (!entry || entry.expiresAt < Date.now()) { entries.delete(key); return { hit: false }; }
  if (entry.fingerprint !== fingerprint) throw new Error('Idempotency key was reused with a different request');
  return { hit: true, response: entry.response };
}
