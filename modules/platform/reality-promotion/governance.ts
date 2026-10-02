import crypto from 'node:crypto';
import type { PoolClient } from 'pg';

export const PROMOTION_GOVERNANCE_POLICY_VERSION = 'V267';
export const DEFAULT_MAX_AUTHORIZATION_TTL_SECONDS = 600;

export type PromotionGovernancePolicy = {
  policyId: string;
  version: string;
  maxAuthorizationTtlSeconds: number;
  requireSeparationOfDuties: boolean;
  requireFreshNonce: boolean;
  autoPromotion: boolean;
};

export function assertAuthorizationWindow(input: { signedAt: Date; expiresAt: Date; now?: Date; maxTtlSeconds?: number }) {
  const now = input.now ?? new Date();
  const maxTtl = input.maxTtlSeconds ?? DEFAULT_MAX_AUTHORIZATION_TTL_SECONDS;
  const ttl = input.expiresAt.getTime() - input.signedAt.getTime();
  if (!Number.isFinite(input.signedAt.getTime()) || !Number.isFinite(input.expiresAt.getTime())) throw new Error('PROMOTION_AUTHORIZATION_TIME_WINDOW_INVALID');
  if (ttl <= 0 || ttl > maxTtl * 1000) throw new Error('PROMOTION_AUTHORIZATION_TTL_POLICY_VIOLATION');
  if (input.signedAt.getTime() > now.getTime() + 5000) throw new Error('PROMOTION_AUTHORIZATION_FUTURE_DATED');
  if (input.expiresAt.getTime() <= now.getTime()) throw new Error('PROMOTION_AUTHORIZATION_EXPIRED');
}

export async function loadPromotionGovernancePolicyTx(client: PoolClient): Promise<PromotionGovernancePolicy> {
  const r = await client.query(`SELECT policy_id,version,max_authorization_ttl_seconds,require_separation_of_duties,require_fresh_nonce,auto_promotion FROM trust_reality_promotion_governance_policies WHERE active=true ORDER BY created_at DESC LIMIT 1`);
  const row = r.rows[0];
  if (!row) throw new Error('PROMOTION_GOVERNANCE_POLICY_MISSING');
  if (row.auto_promotion) throw new Error('PROMOTION_AUTO_PROMOTION_POLICY_FORBIDDEN');
  return { policyId: row.policy_id, version: row.version, maxAuthorizationTtlSeconds: row.max_authorization_ttl_seconds, requireSeparationOfDuties: row.require_separation_of_duties, requireFreshNonce: row.require_fresh_nonce, autoPromotion: row.auto_promotion };
}

export async function assertFreshAuthorizationNonceTx(client: PoolClient, nonce: string) {
  const normalized = nonce.trim();
  if (!normalized) throw new Error('PROMOTION_AUTHORIZATION_NONCE_REQUIRED');
  const existing = await client.query(`SELECT authorization_id FROM trust_reality_promotion_authorizations WHERE authorization_nonce=$1 LIMIT 1`, [normalized]);
  if (existing.rows[0]) throw new Error('PROMOTION_AUTHORIZATION_NONCE_REPLAY');
}

export async function assertSeparationOfDutiesTx(client: PoolClient, decisionId: string, actorId: string, toState: string) {
  if (toState !== 'PROMOTED') return;
  const r = await client.query(`SELECT reviewer_id FROM trust_reality_promotion_decisions WHERE decision_id=$1`, [decisionId]);
  if (r.rows[0]?.reviewer_id && r.rows[0].reviewer_id === actorId) throw new Error('PROMOTION_SEPARATION_OF_DUTIES_VIOLATION');
}

export function governanceEventHash(input: { eventType: string; decisionId?: string | null; authorizationId?: string | null; actorId?: string | null; reason: string; previousEventHash?: string | null }) {
  return crypto.createHash('sha256').update(JSON.stringify(input, Object.keys(input).sort())).digest('hex');
}
