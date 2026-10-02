import type { SqlExecutor } from '../../platform/persistence/postgres-boundary';
import { enqueueReverseCommerceJob } from './worker';
import { requiredId } from './contracts';

export type ReversePlanStep = {
  key: string;
  action: string;
  required: boolean;
  status: 'READY' | 'BLOCKED' | 'COMPLETE';
  evidence: string[];
};

export async function buildReturnResolutionPlan(db: SqlExecutor, returnId: string): Promise<{ returnId: string; ready: boolean; steps: ReversePlanStep[] }> {
  const id = requiredId(returnId, 'return_id');
  const [ret, inspection, settlement, recovery, replacement, credit] = await Promise.all([
    db.query<any>('select status,customer_id from trust_returns where id=$1',[id]),
    db.query<any>('select decision,condition,recoverable,restockable from trust_return_inspections where return_id=$1 order by created_at desc limit 1',[id]),
    db.query<any>('select status,net_amount from trust_refund_settlements where return_id=$1 order by created_at desc limit 1',[id]),
    db.query<any>(`select count(*)::int count from trust_inventory_recovery_actions where return_id=$1 and status='APPLIED'`,[id]),
    db.query<any>(`select count(*)::int count from trust_replacement_orders where return_id=$1 and status not in ('CANCELLED','FAILED')`,[id]),
    db.query<any>(`select count(*)::int count from trust_store_credits where return_id=$1 and status in ('ACTIVE','EXHAUSTED')`,[id]),
  ]);
  if (!ret.rows[0]) throw new Error('RETURN_NOT_FOUND');
  const inspectionReady = Boolean(inspection.rows[0] && inspection.rows[0].decision !== 'PENDING');
  const recoveryDone = Number(recovery.rows[0]?.count || 0) > 0;
  const settlementDone = ['REQUESTED','SETTLED'].includes(settlement.rows[0]?.status || '');
  const replacementDone = Number(replacement.rows[0]?.count || 0) > 0;
  const creditDone = Number(credit.rows[0]?.count || 0) > 0;
  const steps: ReversePlanStep[] = [
    { key:'inspection', action:'Complete item inspection', required:true, status:inspectionReady?'COMPLETE':'BLOCKED', evidence:inspectionReady?['trust_return_inspections']:[] },
    { key:'recovery', action:'Apply warehouse disposition', required:false, status:recoveryDone?'COMPLETE':inspectionReady?'READY':'BLOCKED', evidence:recoveryDone?['trust_inventory_recovery_actions','trust_inventory_ledger']:[] },
    { key:'settlement', action:'Resolve refund settlement', required:false, status:settlementDone?'COMPLETE':inspectionReady?'READY':'BLOCKED', evidence:settlementDone?['trust_refund_settlements']:[] },
    { key:'replacement', action:'Create replacement order', required:false, status:replacementDone?'COMPLETE':inspectionReady?'READY':'BLOCKED', evidence:replacementDone?['trust_replacement_orders']:[] },
    { key:'credit', action:'Issue store credit when selected', required:false, status:creditDone?'COMPLETE':inspectionReady?'READY':'BLOCKED', evidence:creditDone?['trust_store_credits','trust_store_credit_transactions']:[] },
  ];
  return { returnId:id, ready:steps.filter(s=>s.required).every(s=>s.status==='COMPLETE'), steps };
}

export async function scheduleReturnReconciliation(db: SqlExecutor, returnId: string) {
  const id = requiredId(returnId, 'return_id');
  const plan = await buildReturnResolutionPlan(db, id);
  const jobs = [];
  jobs.push(await enqueueReverseCommerceJob(db,'INVENTORY_RECOVERY',id));
  jobs.push(await enqueueReverseCommerceJob(db,'LEDGER_RECONCILIATION',id));
  if (plan.steps.some(s=>s.key==='replacement' && s.status==='READY')) jobs.push(await enqueueReverseCommerceJob(db,'REPLACEMENT_RESERVATION',id));
  jobs.push(await enqueueReverseCommerceJob(db,'STORE_CREDIT_RECONCILIATION',id));
  return { returnId:id, ready:plan.ready, scheduled:jobs.map((job:any)=>({id:job.id,type:job.job_type})) };
}

export async function resolveReturnOutcome(db: SqlExecutor, input: { returnId:string; outcome:'REFUND'|'REPLACEMENT'|'STORE_CREDIT'|'REJECTED'|'NO_ACTION'; actorId:string; referenceId?:string }) {
  const returnId = requiredId(input.returnId,'return_id');
  const actorId = requiredId(input.actorId,'actor_id');
  return db.transaction(async tx => {
    const ret = await tx.query<any>('select * from trust_returns where id=$1 for update',[returnId]);
    if (!ret.rows[0]) throw new Error('RETURN_NOT_FOUND');
    if (!['APPROVED_REFUND','REFUND_PENDING','REFUNDED','CLOSED'].includes(ret.rows[0].status)) throw new Error('RETURN_OUTCOME_NOT_ALLOWED');
    const existing = await tx.query<any>(`select * from trust_return_outcomes where return_id=$1 order by created_at desc limit 1`,[returnId]);
    if (existing.rows[0] && existing.rows[0].outcome === input.outcome) return { ...existing.rows[0], replay:true };
    const inserted = await tx.query<any>(`insert into trust_return_outcomes(return_id,outcome,reference_id) values($1,$2,$3) returning *`,[returnId,input.outcome,input.referenceId||null]);
    await tx.query(`insert into trust_outbox_events(event_type,aggregate_id,payload_json) values('return.outcome.selected',$1,$2::jsonb)`,[returnId,JSON.stringify({returnId,outcome:input.outcome,actorId,referenceId:input.referenceId||null})]);
    return {...inserted.rows[0],replay:false};
  });
}

export async function closeResolvedReturn(db: SqlExecutor, input: { returnId:string; actorId:string; outcome:'REFUND'|'REPLACEMENT'|'STORE_CREDIT'|'REJECTED'|'NO_ACTION' }) {
  const returnId = requiredId(input.returnId,'return_id');
  const actorId = requiredId(input.actorId,'actor_id');
  return db.transaction(async tx => {
    const ret = await tx.query<any>('select status from trust_returns where id=$1 for update',[returnId]);
    if (!ret.rows[0]) throw new Error('RETURN_NOT_FOUND');
    const outcome = await tx.query<any>('select outcome from trust_return_outcomes where return_id=$1 order by created_at desc limit 1',[returnId]);
    if (!outcome.rows[0] || outcome.rows[0].outcome !== input.outcome) throw new Error('RETURN_OUTCOME_REQUIRED');
    if (ret.rows[0].status !== 'CLOSED') {
      if (ret.rows[0].status === 'REFUNDED') await tx.query(`update trust_returns set status='CLOSED',closed_at=now(),updated_at=now() where id=$1`,[returnId]);
      else if (ret.rows[0].status === 'REJECTED') await tx.query(`update trust_returns set status='CLOSED',closed_at=now(),updated_at=now() where id=$1`,[returnId]);
      else throw new Error('RETURN_NOT_READY_TO_CLOSE');
      await tx.query(`insert into trust_return_events(return_id,from_status,to_status,source,actor_id,note) values($1,$2,'CLOSED','reverse-commerce',$3,$4)`,[returnId,ret.rows[0].status,actorId,`outcome:${input.outcome}`]);
      await tx.query(`insert into trust_outbox_events(event_type,aggregate_id,payload_json) values('return.closed',$1,$2::jsonb)`,[returnId,JSON.stringify({returnId,actorId,outcome:input.outcome})]);
    }
    return { returnId, status:'CLOSED', outcome:input.outcome };
  });
}
