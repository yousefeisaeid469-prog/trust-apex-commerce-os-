import { createHash } from 'crypto';
import type { SqlExecutor } from './postgres-boundary';

export type TransactionResult = { committed: true; reference: string };

export function stableReference(parts: readonly string[]) {
  return createHash('sha256').update(parts.join('|')).digest('hex').slice(0, 32);
}

export function stableJson(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return '[' + value.map(stableJson).join(',') + ']';
  const obj = value as Record<string, unknown>;
  return '{' + Object.keys(obj).sort().map((key) => JSON.stringify(key) + ':' + stableJson(obj[key])).join(',') + '}';
}

export function requestHash(scope: string, payload: unknown) {
  return createHash('sha256').update(scope + '|' + stableJson(payload)).digest('hex');
}

export async function withTransaction<T>(db: SqlExecutor, work: (tx: SqlExecutor) => Promise<T>) {
  return db.transaction(work);
}

export async function ensureIdempotency(tx: SqlExecutor, key: string, scope: string, expectedRequestHash?: string) {
  const ref = stableReference([scope, key]);
  const existing = await tx.query<{ result_json: unknown; request_hash: string | null }>(
    'select result_json,request_hash from trust_idempotency_keys where key_hash = $1 and scope = $2 and expires_at > now()', [ref, scope],
  );
  if (!existing.rows[0]) return undefined;
  if (expectedRequestHash && existing.rows[0].request_hash && existing.rows[0].request_hash !== expectedRequestHash) {
    throw new Error('IDEMPOTENCY_KEY_REUSED');
  }
  return existing.rows[0].result_json;
}

export async function saveIdempotency(tx: SqlExecutor, key: string, scope: string, result: unknown, ttlSeconds = 86400, expectedRequestHash?: string) {
  const ref = stableReference([scope, key]);
  await tx.query(
    `insert into trust_idempotency_keys(key_hash,scope,result_json,request_hash,expires_at)
     values($1,$2,$3::jsonb,$4,now()+($5 || ' seconds')::interval)
     on conflict(key_hash,scope) do update set result_json=excluded.result_json,request_hash=coalesce(excluded.request_hash,trust_idempotency_keys.request_hash),expires_at=excluded.expires_at`,
    [ref, scope, JSON.stringify(result), expectedRequestHash ?? null, ttlSeconds],
  );
}
