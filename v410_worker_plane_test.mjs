import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
const root=process.cwd();
const workerPlane=fs.readFileSync(path.join(root,'modules/platform/worker-plane.ts'),'utf8');
const migration=fs.readFileSync(path.join(root,'db/migrations/235_v410_global_production_worker_plane.sql'),'utf8');
for(const name of ['startWorker','heartbeatWorker','finishWorker','workerPlaneSnapshot']) assert(workerPlane.includes(`export async function ${name}`),`missing ${name}`);
for(const table of ['trust_worker_instances','trust_worker_runs','trust_production_worker_snapshot']) assert(migration.includes(table),`missing ${table}`);
for(const worker of ['scripts/command_worker.mjs','scripts/workflow_worker.mjs','scripts/commerce_execution_worker.mjs']) {
  const s=fs.readFileSync(path.join(root,worker),'utf8');
  assert(s.includes("from '../modules/platform/worker-plane.ts'"),`${worker} not wired to worker plane`);
  assert(s.includes('startWorker'),`${worker} missing startWorker`);
  assert(s.includes('heartbeatWorker'),`${worker} missing heartbeatWorker`);
  assert(s.includes('finishWorker'),`${worker} missing finishWorker`);
  assert(!s.includes('V408 '),`${worker} has stale V408 worker marker`);
}
assert(workerPlane.includes("GLOBAL_WORKER_PLANE_VERSION = 'V410.0.0'"));
console.log('V410 WORKER PLANE TEST PASS');
