import { randomUUID } from 'node:crypto';
import { query, withPgTransaction } from '../db/postgres.ts';
import { observeCommerceCommandCenter, type CommerceCommandCenter } from './command-center.ts';
import { recoverStaleConsumerDeliveries } from './consumer-control-plane.ts';

export type RecoveryActionKind = 'RECLAIM_CONSUMER_LEASES' | 'RECLAIM_EXECUTION_LEASES' | 'NOOP';
export type RecoveryStep = {
  action: RecoveryActionKind;
  requested: boolean;
  changed: number;
  reason: string;
  verified: boolean;
};

async function reclaimExecutionLeases(): Promise<number> {
  const result = await query<any>(
    `WITH stale AS (
       SELECT id FROM trust_commerce_execution_jobs
        WHERE status='PROCESSING' AND lease_until < now()
        ORDER BY lease_until ASC
        FOR UPDATE SKIP LOCKED LIMIT 500
     )
     UPDATE trust_commerce_execution_jobs j
        SET status='PENDING', lease_until=NULL, lease_token=NULL, available_at=now(), updated_at=now()
       FROM stale s WHERE j.id=s.id
     RETURNING j.id`,
  );
  return result.rowCount ?? 0;
}

function staleConsumerCount(center: CommerceCommandCenter) {
  return center.pipeline.consumerProcessing > 0 && center.incidents.some(i => i.code === 'STALE_CONSUMER_DELIVERIES');
}

async function hasStaleExecutionLeases() {
  const result = await query<any>(`select count(*)::int count from trust_commerce_execution_jobs where status='PROCESSING' and lease_until < now()`);
  return Number(result.rows[0]?.count || 0) > 0;
}

export async function runVerifiedCommerceRecovery(trigger='manual') {
  const runKey = `recovery:${trigger}:${randomUUID()}`;
  const before = await observeCommerceCommandCenter();
  const steps: RecoveryStep[] = [];

  if (staleConsumerCount(before)) {
    const result = await recoverStaleConsumerDeliveries();
    steps.push({
      action: 'RECLAIM_CONSUMER_LEASES', requested: true, changed: result.recovered + result.deadLettered,
      reason: `stale consumer deliveries detected; reclaimed=${result.recovered}, deadLettered=${result.deadLettered}`,
      verified: false,
    });
  }

  if (await hasStaleExecutionLeases()) {
    const changed = await reclaimExecutionLeases();
    steps.push({
      action: 'RECLAIM_EXECUTION_LEASES', requested: true, changed,
      reason: `stale execution leases detected; reclaimed=${changed}`,
      verified: false,
    });
  }

  if (!steps.length) steps.push({ action: 'NOOP', requested: false, changed: 0, reason: 'No safe automatic recovery action was indicated by the command center.', verified: true });

  const after = await observeCommerceCommandCenter();
  for (const step of steps) {
    if (step.action === 'RECLAIM_CONSUMER_LEASES') {
      step.verified = after.incidents.every(i => i.code !== 'STALE_CONSUMER_DELIVERIES') || after.pipeline.consumerProcessing < before.pipeline.consumerProcessing;
    } else if (step.action === 'RECLAIM_EXECUTION_LEASES') {
      step.verified = after.pipeline.executionProcessing < before.pipeline.executionProcessing || after.incidents.every(i => i.code !== 'EXECUTION_NOT_DRAINING');
    }
  }

  const verified = steps.every(s => s.verified);
  await withPgTransaction(async client => {
    await client.query(
      `INSERT INTO trust_commerce_recovery_runs(run_key,trigger,state,before_state,after_state,steps,verified)
       VALUES($1,$2,$3,$4,$5,$6::jsonb,$7)`,
      [runKey, trigger, verified ? 'VERIFIED' : 'UNVERIFIED', before.state, after.state, JSON.stringify(steps), verified],
    );
  });

  return { runKey, trigger, before, after, steps, verified };
}
