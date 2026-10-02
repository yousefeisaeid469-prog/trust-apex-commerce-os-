import fs from 'node:fs';
import path from 'node:path';
const root=process.cwd();
const read=f=>fs.readFileSync(path.join(root,f),'utf8');
const checks=[
 ['migration',read('db/migrations/236_v411_global_worker_scheduling_recovery_mesh.sql'),[/trust_worker_queue_policies/,/trust_worker_queue_slots/,/trust_worker_dispatch_events/,/trust_worker_scheduling_snapshot/]],
 ['scheduler',read('modules/platform/worker-scheduler.ts'),[/acquireWorkerSlot/,/heartbeatWorkerSlot/,/reclaimStaleWorkerSlots/,/withWorkerSlot/]],
 ['recovery worker',read('scripts/recovery_scheduler_worker.mjs'),[/trust_commerce_recovery_cases/,/enqueueCommerceExecutionJobTx/,/SKIP LOCKED/]],
 ['command worker',read('scripts/command_worker.mjs'),[/acquireWorkerSlot\('command'/]],
 ['workflow worker',read('scripts/workflow_worker.mjs'),[/acquireWorkerSlot\('workflow'/]],
 ['commerce worker',read('scripts/commerce_execution_worker.mjs'),[/acquireWorkerSlot\('commerce-execution'/]],
];
for(const [name,text,patterns] of checks) for(const re of patterns) if(!re.test(text)) throw new Error(`V411_AUDIT_FAIL:${name}:${re}`);
console.log('V411 WORKER SCHEDULING AUDIT PASS');
