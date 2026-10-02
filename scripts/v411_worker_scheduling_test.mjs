import fs from 'node:fs';
import path from 'node:path';
const root=process.cwd();
const migration=fs.readFileSync(path.join(root,'db/migrations/236_v411_global_worker_scheduling_recovery_mesh.sql'),'utf8');
const scheduler=fs.readFileSync(path.join(root,'modules/platform/worker-scheduler.ts'),'utf8');
const recovery=fs.readFileSync(path.join(root,'scripts/recovery_scheduler_worker.mjs'),'utf8');
const workers=['command_worker.mjs','workflow_worker.mjs','commerce_execution_worker.mjs'].map(f=>fs.readFileSync(path.join(root,'scripts',f),'utf8'));
const required=[
 ['migration queue policy',/trust_worker_queue_policies/],
 ['migration slots',/trust_worker_queue_slots/],
 ['migration backpressure',/BACKPRESSURED/],
 ['migration priority',/priority integer/],
 ['scheduler admission',/acquireWorkerSlot/],
 ['scheduler stale reclaim',/reclaimStaleWorkerSlots/],
 ['recovery dispatch',/enqueueCommerceExecutionJobTx/],
 ['recovery claim',/FOR UPDATE SKIP LOCKED/],
];
for(const [name,re] of required){ if(!(re.test(migration)||re.test(scheduler)||re.test(recovery))) throw new Error(`V411_TEST_MISSING:${name}`); }
for(const [i,w] of workers.entries()) if(!/acquireWorkerSlot/.test(w)||!/releaseWorkerSlot/.test(w)) throw new Error(`V411_WORKER_NOT_SCHEDULED:${i}`);
if((migration.match(/INSERT INTO trust_worker_queue_policies/g)||[]).length!==1) throw new Error('V411_POLICY_SEED_MISSING');
console.log('V411 WORKER SCHEDULING TEST PASS');
