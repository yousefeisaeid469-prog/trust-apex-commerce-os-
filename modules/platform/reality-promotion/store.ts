import crypto from 'node:crypto';
import type { PoolClient } from 'pg';
import { assertTransition, type PromotionState } from './contracts.ts';
import { assertPromotionCommand, commandTargetState, promotionCommandHash, type PromotionCommand } from './command.ts';
import { promotionAuthorizationPayloadHash, verifyPromotionSignature, type PromotionAuthorizationPayload } from './authorization.ts';
import { assertKeyUsable } from './key-lifecycle.ts';
import { assertAuthorizationWindow, assertFreshAuthorizationNonceTx, assertSeparationOfDutiesTx, loadPromotionGovernancePolicyTx, governanceEventHash } from './governance.ts';

const digest = (value: string) => crypto.createHash('sha256').update(value).digest('hex');
const signatureDigest = (value: string) => digest(value);

export async function transitionPromotionTx(client: PoolClient, input: {
  decisionId: string;
  toState: PromotionState;
  actorId: string;
  keyId: string;
  signatureBase64: string;
  rationale: string;
  attestationRoot: string;
  evidenceLeaf: string;
  authorizationNonce: string;
  signedAt: string;
  authorizationExpiresAt: string;
  commandId: string;
}) {
  if (!input.actorId || !input.keyId || !input.signatureBase64 || !input.rationale || !input.commandId) throw new Error('PROMOTION_ACTOR_KEY_SIGNATURE_AND_RATIONALE_REQUIRED');
  await client.query('SELECT pg_advisory_xact_lock(hashtext($1))', [`trust-reality-promotion:${input.decisionId}`]);
  const current = await client.query<any>(`SELECT decision_id, state, attestation_root, evidence_leaf, baseline_evidence_digest, decision_hash FROM trust_reality_promotion_decisions WHERE decision_id=$1 FOR UPDATE`, [input.decisionId]);
  if (!current.rows[0]) throw new Error('PROMOTION_DECISION_NOT_FOUND');
  const row = current.rows[0];
  if (row.attestation_root !== input.attestationRoot || row.evidence_leaf !== input.evidenceLeaf) throw new Error('PROMOTION_EVIDENCE_BINDING_MISMATCH');
  const inferredCommandType: PromotionCommand['commandType'] | null =
    row.state === 'PENDING_EXPLICIT_REVIEW' ? (input.toState === 'APPROVED' ? 'APPROVE' : input.toState === 'REJECTED' ? 'REJECT' : null) :
    row.state === 'APPROVED' && input.toState === 'PROMOTED' ? 'PROMOTE' :
    (row.state === 'APPROVED' || row.state === 'PROMOTED') && input.toState === 'REVOKED' ? 'REVOKE' : null;
  if (!inferredCommandType) throw new Error('PROMOTION_COMMAND_TYPE_UNRESOLVED');
  const command: PromotionCommand = { commandId: input.commandId, commandType: inferredCommandType as PromotionCommand['commandType'], decisionId: row.decision_id, actorId: input.actorId, keyId: input.keyId, rationale: input.rationale, attestationRoot: input.attestationRoot, evidenceLeaf: input.evidenceLeaf, authorizationNonce: input.authorizationNonce, signedAt: input.signedAt, authorizationExpiresAt: input.authorizationExpiresAt };
  assertPromotionCommand(command);
  if (commandTargetState(command.commandType) !== input.toState) throw new Error('PROMOTION_COMMAND_TARGET_MISMATCH');
  const commandHash = promotionCommandHash(command);
  const existingCommand = await client.query<any>(`SELECT command_id,status,result_event_hash,command_hash,signature_digest FROM trust_reality_promotion_commands WHERE command_id=$1 FOR UPDATE`, [input.commandId]);
  if (existingCommand.rows[0]) {
    if (existingCommand.rows[0].command_hash !== commandHash) throw new Error('PROMOTION_COMMAND_ID_REUSE_MISMATCH');
    if (existingCommand.rows[0].signature_digest !== signatureDigest(input.signatureBase64)) throw new Error('PROMOTION_COMMAND_SIGNATURE_REPLAY_MISMATCH');
    if (existingCommand.rows[0].status === 'APPLIED') return { decisionId: input.decisionId, fromState: row.state, toState: input.toState, eventHash: existingCommand.rows[0].result_event_hash, authorizationPayloadHash: null, keyId: input.keyId, idempotentReplay: true };
    assertTransition(row.state, input.toState);
  } else {
    assertTransition(row.state, input.toState);
    await client.query(`INSERT INTO trust_reality_promotion_commands(command_id,decision_id,command_type,actor_id,key_id,rationale,attestation_root,evidence_leaf,authorization_nonce,signed_at,authorization_expires_at,command_hash,signature_digest,status) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,'RECEIVED')`, [input.commandId,row.decision_id,command.commandType,input.actorId,input.keyId,input.rationale,input.attestationRoot,input.evidenceLeaf,input.authorizationNonce,new Date(input.signedAt),new Date(input.authorizationExpiresAt),commandHash,signatureDigest(input.signatureBase64)]);
  }

  const keyResult = await client.query<any>(`SELECT key_id, actor_id, algorithm, public_key_pem, status_v266, not_before, expires_at FROM trust_reality_promotion_signing_keys WHERE key_id=$1`, [input.keyId]);
  const key = keyResult.rows[0];
  if (!key) throw new Error('PROMOTION_SIGNING_KEY_NOT_ACTIVE');
  assertKeyUsable({ status: key.status_v266, notBefore: new Date(key.not_before), expiresAt: key.expires_at ? new Date(key.expires_at) : null });
  const policy = await loadPromotionGovernancePolicyTx(client);
  if (policy.version !== 'V267') throw new Error('PROMOTION_GOVERNANCE_POLICY_VERSION_UNSUPPORTED');
  const signedAt = new Date(input.signedAt);
  const authorizationExpiresAt = new Date(input.authorizationExpiresAt);
  // V266 compatibility marker: PROMOTION_AUTHORIZATION_STALE_OR_FUTURE remains represented by V267 window errors.
  assertAuthorizationWindow({ signedAt, expiresAt: authorizationExpiresAt, maxTtlSeconds: policy.maxAuthorizationTtlSeconds });
  await assertSeparationOfDutiesTx(client, input.decisionId, input.actorId, input.toState);
  if (policy.requireFreshNonce) await assertFreshAuthorizationNonceTx(client, input.authorizationNonce);
  if (key.actor_id !== input.actorId) throw new Error('PROMOTION_SIGNER_ACTOR_MISMATCH');

  const payload: PromotionAuthorizationPayload = {
    decisionId: row.decision_id,
    decisionHash: row.decision_hash,
    fromState: row.state,
    toState: input.toState,
    actorId: input.actorId,
    keyId: input.keyId,
    rationale: input.rationale,
    attestationRoot: input.attestationRoot,
    evidenceLeaf: input.evidenceLeaf,
    authorizationNonce: input.authorizationNonce,
    signedAt: signedAt.toISOString(),
    authorizationExpiresAt: authorizationExpiresAt.toISOString(),
    commandId: input.commandId,
  };
  if (!verifyPromotionSignature({ algorithm: key.algorithm, publicKeyPem: key.public_key_pem, signatureBase64: input.signatureBase64, payload })) {
    throw new Error('PROMOTION_SIGNATURE_INVALID');
  }
  const payloadHash = promotionAuthorizationPayloadHash(payload);
  const nonce = input.authorizationNonce.trim();
  if (!nonce) throw new Error('PROMOTION_AUTHORIZATION_NONCE_REQUIRED');
  const prior = await client.query<any>(`SELECT event_hash FROM trust_reality_promotion_events WHERE decision_id=$1 ORDER BY event_id DESC LIMIT 1`, [input.decisionId]);
  const previousEventHash = prior.rows[0]?.event_hash ?? null;
  const eventHash = digest(JSON.stringify({ ...payload, payloadHash, signatureBase64: input.signatureBase64, previousEventHash }));

  await client.query(`INSERT INTO trust_reality_promotion_authorizations(decision_id,key_id,actor_id,algorithm,payload_hash,signature_base64,authorization_nonce,signed_at,authorization_expires_at,policy_version,command_id) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`, [input.decisionId,input.keyId,input.actorId,key.algorithm,payloadHash,input.signatureBase64,nonce,signedAt,authorizationExpiresAt,policy.version,input.commandId]);
  const authInsert = await client.query<any>(`SELECT authorization_id FROM trust_reality_promotion_authorizations WHERE decision_id=$1 AND payload_hash=$2 FOR UPDATE`, [input.decisionId,payloadHash]);
  const authorizationId = authInsert.rows[0]?.authorization_id;
  if (!authorizationId) throw new Error('PROMOTION_AUTHORIZATION_PERSISTENCE_FAILED');
  await client.query(`INSERT INTO trust_reality_promotion_events(decision_id,from_state,to_state,actor_id,rationale,attestation_root,evidence_leaf,previous_event_hash,event_hash,authorization_id,command_id) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`, [input.decisionId,row.state,input.toState,input.actorId,input.rationale,input.attestationRoot,input.evidenceLeaf,previousEventHash,eventHash,authorizationId,input.commandId]);
  const priorGov = await client.query<any>(`SELECT event_hash FROM trust_reality_promotion_governance_events ORDER BY governance_event_id DESC LIMIT 1`);
  const previousGovHash = priorGov.rows[0]?.event_hash ?? null;
  const govHash = governanceEventHash({eventType:'AUTHORIZATION_ACCEPTED',decisionId:input.decisionId,authorizationId:String(authorizationId),actorId:input.actorId,reason:input.rationale,previousEventHash:previousGovHash});
  await client.query(`INSERT INTO trust_reality_promotion_governance_events(decision_id,authorization_id,event_type,actor_id,reason,event_hash,previous_event_hash) VALUES($1,$2,'AUTHORIZATION_ACCEPTED',$3,$4,$5,$6)`, [input.decisionId,authorizationId,input.actorId,input.rationale,govHash,previousGovHash]);
  await client.query(`UPDATE trust_reality_promotion_decisions SET state=$2, reviewer_id=$3, rationale=$4, updated_at=now() WHERE decision_id=$1`, [input.decisionId,input.toState,input.actorId,input.rationale]);
  await client.query(`UPDATE trust_reality_promotion_commands SET status='APPLIED', result_event_hash=$2, applied_at=now() WHERE command_id=$1`, [input.commandId,eventHash]);
  return { decisionId: input.decisionId, fromState: row.state, toState: input.toState, eventHash, authorizationPayloadHash: payloadHash, keyId: input.keyId };
}

export async function seedPromotionDecisionsTx(client: PoolClient, decisions: Array<{
  decisionId: string;
  capabilityId: string;
  state: PromotionState;
  attestationRoot: string;
  evidenceLeaf: string;
  baselineEvidenceDigest: string;
  decisionHash: string;
  rationale: string;
}>) {
  for (const decision of decisions) {
    if (decision.state !== 'PENDING_EXPLICIT_REVIEW') throw new Error('PROMOTION_SEED_MUST_START_PENDING');
    await client.query(`INSERT INTO trust_reality_promotion_decisions
      (decision_id,capability_id,state,attestation_root,evidence_leaf,baseline_evidence_digest,decision_hash,rationale)
      VALUES($1,$2,$3,$4,$5,$6,$7,$8)
      ON CONFLICT(decision_id) DO NOTHING`, [decision.decisionId, decision.capabilityId, decision.state, decision.attestationRoot, decision.evidenceLeaf, decision.baselineEvidenceDigest, decision.decisionHash, decision.rationale]);
  }
  return decisions.length;
}
