import { createHash } from 'node:crypto';
import type { SqlExecutor } from './persistence/postgres-boundary';

export type ExternalEffectIntent = {
  id: string;
  scope: string;
  effectKey: string;
  fingerprint: string;
  status: string;
  attempts: number;
  provider: string | null;
  providerReference: string | null;
  requestJson: Record<string, unknown>;
  responseJson: Record<string, unknown> | null;
};

const stable = (value: unknown): string => {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stable).join(',')}]`;
  const obj = value as Record<string, unknown>;
  return `{${Object.keys(obj).sort().map(k => `${JSON.stringify(k)}:${stable(obj[k])}`).join(',')}}`;
};
export const consistencyFingerprint = (value: unknown) => createHash('sha256').update(stable(value)).digest('hex');

export async function enqueueTransactionalOutboxTx(tx: SqlExecutor, input: {
  tenantId?: string;
  eventType: string;
  aggregateId: string;
  eventKey: string;
  payload: Record<string, unknown>;
  correlationId?: string | null;
  causationId?: string | null;
}) {
  const tenantId = input.tenantId ?? 'default';
  const result = await tx.query<{ id: string }>(
    `INSERT INTO trust_outbox_events(event_type,aggregate_id,payload_json,tenant_id,correlation_id,causation_id,event_key)
     VALUES($1,$2,$3::jsonb,$4,$5,$6,$7)
     ON CONFLICT(tenant_id,event_type,aggregate_id,event_key)
     WHERE event_key IS NOT NULL DO UPDATE SET event_key=EXCLUDED.event_key
     RETURNING id`,
    [input.eventType,input.aggregateId,JSON.stringify(input.payload),tenantId,input.correlationId ?? null,input.causationId ?? null,input.eventKey],
  );
  if (!result.rows[0]) throw new Error('TRANSACTIONAL_OUTBOX_WRITE_FAILED');
  return String(result.rows[0].id);
}

export async function ensureExternalEffectIntentTx(tx: SqlExecutor, input: {
  scope: string;
  effectKey: string;
  request: Record<string, unknown>;
  provider?: string | null;
  fingerprint?: string;
}) : Promise<{ intent: ExternalEffectIntent; replay: boolean }> {
  const fingerprint = input.fingerprint ?? consistencyFingerprint(input.request);
  const existing = await tx.query<any>(
    `SELECT id,scope,effect_key,fingerprint,status,attempts,provider,provider_reference,request_json,response_json
       FROM trust_external_effect_intents WHERE scope=$1 AND effect_key=$2 FOR UPDATE`,
    [input.scope,input.effectKey],
  );
  if (existing.rows[0]) {
    const row = existing.rows[0];
    if (String(row.fingerprint) !== fingerprint) throw new Error('EXTERNAL_EFFECT_FINGERPRINT_MISMATCH');
    await tx.query(`INSERT INTO trust_external_effect_events(intent_id,action,metadata_json) VALUES($1,'REPLAYED',$2::jsonb)`,[row.id,JSON.stringify({status:row.status})]);
    return { replay: true, intent: mapIntent(row) };
  }
  const inserted = await tx.query<any>(
    `INSERT INTO trust_external_effect_intents(scope,effect_key,fingerprint,provider,request_json)
     VALUES($1,$2,$3,$4,$5::jsonb) RETURNING id,scope,effect_key,fingerprint,status,attempts,provider,provider_reference,request_json`,
    [input.scope,input.effectKey,fingerprint,input.provider ?? null,JSON.stringify(input.request)],
  );
  const row = inserted.rows[0];
  await tx.query(`INSERT INTO trust_external_effect_events(intent_id,action,metadata_json) VALUES($1,'INTENDED',$2::jsonb)`,[row.id,JSON.stringify({scope:input.scope,effectKey:input.effectKey})]);
  return { replay: false, intent: mapIntent(row) };
}

export async function claimExternalEffectTx(tx: SqlExecutor, intent: ExternalEffectIntent, ownerId: string, fencingToken?: bigint) {
  const result = await tx.query(
    `UPDATE trust_external_effect_intents
        SET status='EXECUTING',owner_id=$2,fencing_token=$3,attempts=attempts+1,lease_until=now()+interval '2 minutes',updated_at=now()
      WHERE id=$1 AND (status IN ('INTENDED','FAILED') OR (status='EXECUTING' AND lease_until < now()))
      RETURNING id`,
    [intent.id,ownerId,fencingToken?.toString() ?? null],
  );
  if (!result.rows[0]) throw new Error('EXTERNAL_EFFECT_NOT_CLAIMABLE');
  await tx.query(`INSERT INTO trust_external_effect_events(intent_id,action,owner_id,fencing_token) VALUES($1,'CLAIMED',$2,$3)`,[intent.id,ownerId,fencingToken?.toString() ?? null]);
}

export async function completeExternalEffectTx(tx: SqlExecutor, intentId: string, ownerId: string, result: { providerReference?: string | null; response?: unknown }, fencingToken?: bigint) {
  const updated = await tx.query(
    `UPDATE trust_external_effect_intents SET status='SUCCEEDED',provider_reference=coalesce($3,provider_reference),response_json=$4::jsonb,lease_until=null,completed_at=now(),updated_at=now()
      WHERE id=$1 AND owner_id=$2 AND status='EXECUTING' AND ($5::bigint IS NULL OR fencing_token=$5) RETURNING id`,
    [intentId,ownerId,result.providerReference ?? null,JSON.stringify(result.response ?? {}),fencingToken?.toString() ?? null],
  );
  if (!updated.rows[0]) throw new Error('EXTERNAL_EFFECT_FENCED');
  await tx.query(`INSERT INTO trust_external_effect_events(intent_id,action,owner_id,fencing_token,metadata_json) VALUES($1,'SUCCEEDED',$2,$3,$4::jsonb)`,[intentId,ownerId,fencingToken?.toString() ?? null,JSON.stringify({providerReference:result.providerReference ?? null})]);
}

export async function failExternalEffectTx(tx: SqlExecutor, intentId: string, ownerId: string, errorCode: string, retrySeconds = 30, fencingToken?: bigint) {
  const updated = await tx.query(
    `UPDATE trust_external_effect_intents SET status='FAILED',last_error=$3,available_at=now()+($4 || ' seconds')::interval,lease_until=null,updated_at=now()
      WHERE id=$1 AND owner_id=$2 AND status='EXECUTING' AND ($5::bigint IS NULL OR fencing_token=$5) RETURNING id`,
    [intentId,ownerId,errorCode.slice(0,2000),retrySeconds,fencingToken?.toString() ?? null],
  );
  if (!updated.rows[0]) throw new Error('EXTERNAL_EFFECT_FENCED');
  await tx.query(`INSERT INTO trust_external_effect_events(intent_id,action,owner_id,fencing_token,metadata_json) VALUES($1,'FAILED',$2,$3,$4::jsonb)`,[intentId,ownerId,fencingToken?.toString() ?? null,JSON.stringify({errorCode})]);
}

function mapIntent(row: any): ExternalEffectIntent {
  return { id:String(row.id),scope:String(row.scope),effectKey:String(row.effect_key),fingerprint:String(row.fingerprint),status:String(row.status),attempts:Number(row.attempts),provider:row.provider==null?null:String(row.provider),providerReference:row.provider_reference==null?null:String(row.provider_reference),requestJson:row.request_json ?? {},responseJson:row.response_json ?? null };
}


export async function recoverExpiredExternalEffectsTx(tx: SqlExecutor, limit = 100) {
  const safeLimit = Math.max(1, Math.min(500, Math.trunc(limit)));
  const rows = await tx.query<any>(
    `WITH expired AS (
       SELECT id FROM trust_external_effect_intents
       WHERE status='EXECUTING' AND lease_until < now()
       ORDER BY lease_until ASC, id ASC
       FOR UPDATE SKIP LOCKED LIMIT $1
     )
     UPDATE trust_external_effect_intents i
        SET status='FAILED',
            owner_id=null,
            fencing_token=null,
            last_error='EXTERNAL_EFFECT_LEASE_EXPIRED',
            available_at=now(),
            lease_until=null,
            updated_at=now()
       FROM expired e
      WHERE i.id=e.id
      RETURNING i.id,i.scope,i.effect_key,i.attempts`,
    [safeLimit],
  );
  for (const row of rows.rows) {
    await tx.query(
      `INSERT INTO trust_external_effect_events(intent_id,action,metadata_json)
       VALUES($1,'FENCED',$2::jsonb)`,
      [row.id, JSON.stringify({ reason:'EXTERNAL_EFFECT_LEASE_EXPIRED', scope:row.scope, effectKey:row.effect_key, attempts:Number(row.attempts) })],
    );
  }
  return rows.rows;
}

export async function externalEffectRecoverySnapshot() {
  const { query } = await import('./db/postgres.ts');
  const [summary, providers] = await Promise.all([
    query(`SELECT * FROM trust_external_effect_recovery_snapshot`),
    query(`SELECT * FROM trust_external_effect_provider_recovery ORDER BY pending DESC, provider, scope`),
  ]);
  return { summary: summary.rows[0] ?? {}, providers: providers.rows };
}

export const GLOBAL_TRANSACTION_CONSISTENCY_VERSION = 'V414.0.0';
