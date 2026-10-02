import type { PoolClient } from 'pg';
import crypto from 'node:crypto';

export const PROMOTION_KEY_STATUSES = ['ACTIVE','RETIRED','REVOKED','EXPIRED'] as const;
export type PromotionKeyStatus = typeof PROMOTION_KEY_STATUSES[number];

export function assertKeyUsable(input: { status: PromotionKeyStatus; notBefore: Date; expiresAt: Date | null }, now = new Date()) {
  if (input.status !== 'ACTIVE') throw new Error(`PROMOTION_SIGNING_KEY_NOT_ACTIVE:${input.status}`);
  if (now < input.notBefore) throw new Error('PROMOTION_SIGNING_KEY_NOT_YET_VALID');
  if (input.expiresAt && now >= input.expiresAt) throw new Error('PROMOTION_SIGNING_KEY_EXPIRED');
}

export async function registerPromotionSigningKeyTx(client: PoolClient, input: {
  keyId: string; actorId: string; algorithm: 'ed25519'; publicKeyPem: string; notBefore?: Date; expiresAt?: Date | null; supersedesKeyId?: string | null; reason: string;
}) {
  if (!input.keyId || !input.actorId || !input.publicKeyPem || !input.reason) throw new Error('PROMOTION_KEY_REGISTRATION_FIELDS_REQUIRED');
  const notBefore = input.notBefore ?? new Date();
  if (input.expiresAt && input.expiresAt <= notBefore) throw new Error('PROMOTION_KEY_EXPIRY_MUST_FOLLOW_NOT_BEFORE');
  if (input.supersedesKeyId) {
    await client.query(`UPDATE trust_reality_promotion_signing_keys SET status='RETIRED', status_v266='RETIRED', retired_at=now(), lifecycle_version=lifecycle_version+1 WHERE key_id=$1 AND status_v266='ACTIVE'`, [input.supersedesKeyId]);
  }
  await client.query(`INSERT INTO trust_reality_promotion_signing_keys(key_id,actor_id,algorithm,public_key_pem,status,status_v266,not_before,expires_at,supersedes_key_id) VALUES($1,$2,$3,$4,'ACTIVE','ACTIVE',$5,$6,$7)`, [input.keyId,input.actorId,input.algorithm,input.publicKeyPem,notBefore,input.expiresAt ?? null,input.supersedesKeyId ?? null]);
  await client.query(`INSERT INTO trust_reality_promotion_key_lifecycle_events(key_id,from_status,to_status,actor_id,reason,supersedes_key_id) VALUES($1,NULL,'ACTIVE',$2,$3,$4)`, [input.keyId,input.actorId,input.reason,input.supersedesKeyId ?? null]);
  return { keyId: input.keyId, status: 'ACTIVE' as const };
}

export async function revokePromotionSigningKeyTx(client: PoolClient, input: { keyId: string; actorId: string; reason: string }) {
  if (!input.actorId || !input.reason) throw new Error('PROMOTION_KEY_REVOCATION_FIELDS_REQUIRED');
  const current = await client.query<any>(`SELECT key_id,status_v266 FROM trust_reality_promotion_signing_keys WHERE key_id=$1 FOR UPDATE`, [input.keyId]);
  if (!current.rows[0]) throw new Error('PROMOTION_SIGNING_KEY_NOT_FOUND');
  if (current.rows[0].status_v266 === 'REVOKED') return { keyId: input.keyId, status: 'REVOKED' as const };
  await client.query(`UPDATE trust_reality_promotion_signing_keys SET status='REVOKED',status_v266='REVOKED',revoked_at=now(),lifecycle_version=lifecycle_version+1 WHERE key_id=$1`, [input.keyId]);
  await client.query(`INSERT INTO trust_reality_promotion_key_lifecycle_events(key_id,from_status,to_status,actor_id,reason) VALUES($1,$2,'REVOKED',$3,$4)`, [input.keyId,current.rows[0].status_v266,input.actorId,input.reason]);
  return { keyId: input.keyId, status: 'REVOKED' as const };
}

export async function expirePromotionSigningKeysTx(client: PoolClient, now = new Date()) {
  const expired = await client.query<any>(`UPDATE trust_reality_promotion_signing_keys SET status='EXPIRED',status_v266='EXPIRED',lifecycle_version=lifecycle_version+1 WHERE status_v266='ACTIVE' AND expires_at IS NOT NULL AND expires_at <= $1 RETURNING key_id, actor_id`, [now]);
  for (const row of expired.rows) {
    await client.query(`INSERT INTO trust_reality_promotion_key_lifecycle_events(key_id,from_status,to_status,actor_id,reason) VALUES($1,'ACTIVE','EXPIRED',$2,$3)`, [row.key_id,row.actor_id,'authorization key reached expiry']);
    await client.query(`INSERT INTO trust_reality_promotion_key_lifecycle_events_v267(key_id,from_status,to_status,actor_id,reason,event_hash) VALUES($1,'ACTIVE','EXPIRED',$2,$3,$4)`, [row.key_id,row.actor_id,'authorization key reached expiry',cryptoHash(`${row.key_id}:EXPIRED:${now.toISOString()}`)]);
  }
  return expired.rows.length;
}

function cryptoHash(value: string) {
  return crypto.createHash('sha256').update(value).digest('hex');
}
