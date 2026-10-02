import { createHash } from 'node:crypto';
import type { SqlExecutor } from '../persistence/postgres-boundary';

export function fingerprint(input: unknown) { return createHash('sha256').update(JSON.stringify(input)).digest('hex'); }
export async function claimIdempotency(db: SqlExecutor, key:string, scope:string, requestFingerprint:string, ttlSeconds=86400) {
  const r=await db.query<{id:string;request_fingerprint:string;response_json:unknown;status_code:number;expires_at:string}>(`insert into trust_idempotency_keys(key,scope,request_fingerprint,expires_at) values($1,$2,$3,now()+($4::text || ' seconds')::interval) on conflict(key,scope) do update set updated_at=now() returning id,request_fingerprint,response_json,status_code,expires_at`,[key,scope,requestFingerprint,ttlSeconds]);
  const row=r.rows[0];
  if(row.request_fingerprint!==requestFingerprint) throw new Error('IDEMPOTENCY_FINGERPRINT_MISMATCH');
  return { id:row.id, replay:row.response_json!==null, response:row.response_json, statusCode:row.status_code };
}
export async function completeIdempotency(db: SqlExecutor,id:string,response:unknown,statusCode:number) { await db.query(`update trust_idempotency_keys set response_json=$2::jsonb,status_code=$3,updated_at=now() where id=$1`,[id,JSON.stringify(response),statusCode]); }
