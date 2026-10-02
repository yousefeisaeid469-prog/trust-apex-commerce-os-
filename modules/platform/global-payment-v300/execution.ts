import type { SqlExecutor } from '../persistence/postgres-boundary';

export const GLOBAL_PAYMENT_EXECUTION_VERSION = 'V300.0.0';

export type GlobalPaymentExecutionStatus = 'pending'|'requires_action'|'authorized'|'captured'|'failed'|'cancelled'|'refunded'|'partially_refunded';

const eventFor: Record<GlobalPaymentExecutionStatus, string> = {
  pending: 'PROVIDER_PROCESSING',
  requires_action: 'REQUIRES_ACTION',
  authorized: 'AUTHORIZED',
  captured: 'CAPTURED',
  failed: 'FAILED',
  cancelled: 'CANCELLED',
  refunded: 'REFUNDED',
  partially_refunded: 'PARTIALLY_REFUNDED'
};


export async function recordGlobalPaymentCreatedTx(tx: SqlExecutor, attemptId:string) {
  const attempt=(await tx.query<any>(`select id,order_id,payment_id,provider from trust_global_payment_attempts where id=$1 for update`,[attemptId])).rows[0];
  if(!attempt) throw new Error('GLOBAL_PAYMENT_ATTEMPT_NOT_FOUND');
  await tx.query(`insert into trust_global_payment_lifecycle_events(global_payment_attempt_id,order_id,payment_id,event_type,provider,provider_reference,payload) values($1,$2,$3,'CREATED',$4,'created','{}'::jsonb) on conflict(global_payment_attempt_id,event_type,provider_reference) do nothing`,[attempt.id,attempt.order_id,attempt.payment_id,attempt.provider]);
}

export async function recordGlobalPaymentLifecycleTx(
  tx: SqlExecutor,
  input: { attemptId:string; status:GlobalPaymentExecutionStatus; provider:string; providerReference?:string|null; payload?:unknown }
) {
  const attempt = (await tx.query<any>(`select id,order_id,payment_id from trust_global_payment_attempts where id=$1 for update`, [input.attemptId])).rows[0];
  if (!attempt) throw new Error('GLOBAL_PAYMENT_ATTEMPT_NOT_FOUND');
  const eventType = eventFor[input.status];
  await tx.query(`insert into trust_global_payment_lifecycle_events(global_payment_attempt_id,order_id,payment_id,event_type,provider,provider_reference,payload)
    values($1,$2,$3,$4,$5,$6,$7::jsonb)
    on conflict(global_payment_attempt_id,event_type,provider_reference) do nothing`,
    [input.attemptId,attempt.order_id,attempt.payment_id,eventType,input.provider,input.providerReference ?? `status:${input.status}`,JSON.stringify(input.payload ?? {})]);

  const timestampColumn: Record<string,string> = {
    pending: 'provider_processing_at', requires_action: 'provider_processing_at', authorized: 'authorized_at',
    captured: 'captured_at', failed: 'failed_at', cancelled: 'cancelled_at', refunded: 'refunded_at', partially_refunded: 'refunded_at'
  };
  await tx.query(`update trust_global_payment_attempts set status=$2, provider_reference=coalesce($3,provider_reference), ${timestampColumn[input.status]}=coalesce(${timestampColumn[input.status]},now()), updated_at=now() where id=$1`,
    [input.attemptId,input.status,input.providerReference ?? null]);
  return { attemptId:String(input.attemptId), eventType, status:input.status };
}

export async function recordGlobalPaymentProviderQueuedTx(tx: SqlExecutor, attemptId:string) {
  const attempt=(await tx.query<any>(`select id,order_id,payment_id,provider from trust_global_payment_attempts where id=$1 for update`,[attemptId])).rows[0];
  if(!attempt) throw new Error('GLOBAL_PAYMENT_ATTEMPT_NOT_FOUND');
  await tx.query(`insert into trust_global_payment_lifecycle_events(global_payment_attempt_id,order_id,payment_id,event_type,provider,provider_reference,payload) values($1,$2,$3,'PROVIDER_QUEUED',$4,'queued','{}'::jsonb) on conflict(global_payment_attempt_id,event_type,provider_reference) do nothing`,[attempt.id,attempt.order_id,attempt.payment_id,attempt.provider]);
  await tx.query(`update trust_global_payment_attempts set provider_queued_at=coalesce(provider_queued_at,now()),execution_attempts=execution_attempts+1,updated_at=now() where id=$1`,[attempt.id]);
}
