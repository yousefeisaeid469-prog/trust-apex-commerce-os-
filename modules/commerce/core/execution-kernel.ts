import type { PoolClient } from 'pg';
import { prepareOrderFulfillmentTx } from './production-journey';
import { completeDeliveredOrderExecutionTx, type CommerceExecutionStatus } from './order-execution';

export type CommerceExecutionStep =
  | 'CAPTURE'
  | 'FULFILLMENT_PREPARE'
  | 'FULFILLMENT_PROGRESS'
  | 'DELIVERY_FINALIZE'
  | 'SETTLEMENT_RELEASE'
  | 'COMPLETE';

export type ExecutionStepStatus = 'PENDING' | 'RUNNING' | 'SUCCEEDED' | 'BLOCKED' | 'FAILED';

async function ensureStepTx(tx: PoolClient, input: {
  runId: string;
  orderId: string;
  step: CommerceExecutionStep;
  idempotencyKey: string;
}) {
  const row = (await tx.query<any>(
    `insert into trust_commerce_execution_steps(execution_run_id,order_id,step_code,idempotency_key)
     values($1,$2,$3,$4)
     on conflict(execution_run_id,step_code) do update set idempotency_key=trust_commerce_execution_steps.idempotency_key
     returning *`,
    [input.runId, input.orderId, input.step, input.idempotencyKey],
  )).rows[0];
  if (!row) throw new Error('EXECUTION_STEP_CREATE_FAILED');
  return row;
}

export async function beginCommerceExecutionStepTx(tx: PoolClient, input: {
  runId: string;
  orderId: string;
  step: CommerceExecutionStep;
  idempotencyKey: string;
}) {
  const step = await ensureStepTx(tx, input);
  if (String(step.status) === 'SUCCEEDED') return { ...step, replay: true };
  if (String(step.status) === 'RUNNING') {
    const age = step.started_at ? Date.now() - new Date(step.started_at).getTime() : 0;
    if (age < 5 * 60_000) return { ...step, replay: true, active: true };
  }
  const updated = (await tx.query<any>(
    `update trust_commerce_execution_steps
        set status='RUNNING',attempt_count=attempt_count+1,started_at=coalesce(started_at,now()),
            last_error_code=null,updated_at=now()
      where id=$1
      returning *`,
    [step.id],
  )).rows[0];
  return { ...updated, replay: false, active: false };
}

export async function finishCommerceExecutionStepTx(tx: PoolClient, input: {
  stepId: string;
  status: Exclude<ExecutionStepStatus, 'RUNNING' | 'PENDING'>;
  result?: Record<string, unknown>;
  errorCode?: string | null;
}) {
  const row = (await tx.query<any>(
    `update trust_commerce_execution_steps
        set status=$2,
            completed_at=case when $2='SUCCEEDED' then coalesce(completed_at,now()) else completed_at end,
            last_error_code=$3,result_json=$4::jsonb,updated_at=now()
      where id=$1
      returning *`,
    [input.stepId, input.status, input.errorCode ?? null, JSON.stringify(input.result ?? {})],
  )).rows[0];
  if (!row) throw new Error('EXECUTION_STEP_NOT_FOUND');
  return row;
}

export async function startCapturedOrderKernelTx(tx: PoolClient, input: {
  orderId: string;
  paymentId: string;
  idempotencyKey: string;
}) {
  const { startCapturedOrderExecutionTx } = await import('./order-execution');
  const result = await startCapturedOrderExecutionTx(tx, input);
  const run = (await tx.query<any>(`select * from trust_commerce_execution_runs where id=$1 for update`, [result.executionId])).rows[0];
  if (!run) throw new Error('COMMERCE_EXECUTION_RUN_NOT_FOUND');

  const step = await beginCommerceExecutionStepTx(tx, {
    runId: String(run.id), orderId: input.orderId, step: 'FULFILLMENT_PREPARE',
    idempotencyKey: `${input.idempotencyKey}:step:fulfillment-prepare`,
  });
  if (!step.replay && !step.active) {
    if (result.status === 'FULFILLMENT_PLANNED') {
      await finishCommerceExecutionStepTx(tx, { stepId: String(step.id), status: 'SUCCEEDED', result: { fulfillmentOrderCount: result.fulfillmentOrderCount } });
    } else {
      await finishCommerceExecutionStepTx(tx, { stepId: String(step.id), status: 'BLOCKED', errorCode: 'FULFILLMENT_PREPARE_BLOCKED', result });
    }
  }
  return { ...result, kernel: true, stepId: String(step.id) };
}

export async function resumeCommerceExecutionTx(tx: PoolClient, input: {
  orderId: string;
  idempotencyKey: string;
}) {
  const run = (await tx.query<any>(
    `select * from trust_commerce_execution_runs where order_id=$1 for update`,
    [input.orderId],
  )).rows[0];
  if (!run) throw new Error('COMMERCE_EXECUTION_RUN_NOT_FOUND');
  const status = String(run.status) as CommerceExecutionStatus;
  if (status === 'COMPLETED' || status === 'REFUNDED') return { orderId: input.orderId, status, replay: true, action: 'NONE' };

  if (status === 'CAPTURED' || status === 'BLOCKED') {
    const step = await beginCommerceExecutionStepTx(tx, { runId: String(run.id), orderId: input.orderId, step: 'FULFILLMENT_PREPARE', idempotencyKey: `${input.idempotencyKey}:prepare` });
    if (step.replay && step.active) return { orderId: input.orderId, status, action: 'WAIT', replay: true };
    try {
      const prepared = await prepareOrderFulfillmentTx(tx, { orderId: input.orderId, idempotencyKey: `${input.idempotencyKey}:fulfillment` });
      await finishCommerceExecutionStepTx(tx, { stepId: String(step.id), status: 'SUCCEEDED', result: { fulfillmentOrderCount: prepared.fulfillmentOrders?.length ?? 0 } });
      return { orderId: input.orderId, status: 'FULFILLMENT_PLANNED', action: 'FULFILLMENT_PREPARE', replay: false, prepared };
    } catch (error) {
      const code = error instanceof Error ? error.message : 'FULFILLMENT_PREPARE_FAILED';
      await finishCommerceExecutionStepTx(tx, { stepId: String(step.id), status: 'BLOCKED', errorCode: code });
      return { orderId: input.orderId, status: 'BLOCKED', action: 'FULFILLMENT_PREPARE', replay: false, errorCode: code };
    }
  }

  const counts = (await tx.query<any>(
    `select count(*)::int total,count(*) filter(where status='DELIVERED')::int delivered
       from trust_marketplace_fulfillment_orders where order_id=$1`,
    [input.orderId],
  )).rows[0];
  const total = Number(counts?.total ?? 0);
  const delivered = Number(counts?.delivered ?? 0);
  if (total > 0 && delivered === total) {
    const step = await beginCommerceExecutionStepTx(tx, { runId: String(run.id), orderId: input.orderId, step: 'DELIVERY_FINALIZE', idempotencyKey: `${input.idempotencyKey}:delivery-finalize` });
    if (step.replay && step.active) return { orderId: input.orderId, status, action: 'WAIT', replay: true };
    const result = await completeDeliveredOrderExecutionTx(tx, { orderId: input.orderId, shipmentId: 'kernel-recovery', triggerKey: `${input.idempotencyKey}:delivery` });
    await finishCommerceExecutionStepTx(tx, { stepId: String(step.id), status: result.completed ? 'SUCCEEDED' : 'BLOCKED', result, errorCode: result.completed ? null : 'DELIVERY_FINALIZE_INCOMPLETE' });
    return { orderId: input.orderId, status: result.status, action: 'DELIVERY_FINALIZE', replay: false, result };
  }

  const step = await beginCommerceExecutionStepTx(tx, { runId: String(run.id), orderId: input.orderId, step: 'FULFILLMENT_PROGRESS', idempotencyKey: `${input.idempotencyKey}:progress` });
  if (!step.replay && !step.active) await finishCommerceExecutionStepTx(tx, { stepId: String(step.id), status: 'BLOCKED', errorCode: 'FULFILLMENT_WAITING_FOR_OPERATIONAL_PROGRESS', result: { total, delivered } });
  return { orderId: input.orderId, status, action: 'WAIT_FULFILLMENT', replay: Boolean(step.replay), total, delivered };
}

export async function getCommerceExecutionKernelTx(tx: PoolClient, orderId: string) {
  const run = (await tx.query<any>(`select * from trust_commerce_execution_runs where order_id=$1`, [orderId])).rows[0];
  if (!run) return null;
  const steps = (await tx.query<any>(`select id,step_code,status,attempt_count,idempotency_key,started_at,completed_at,last_error_code,result_json,updated_at from trust_commerce_execution_steps where execution_run_id=$1 order by created_at,id`, [run.id])).rows;
  return { run, steps };
}
