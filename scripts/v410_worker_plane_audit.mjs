import fs from 'node:fs';
import path from 'node:path';
const root=process.cwd();
const failures=[];
const read=f=>fs.readFileSync(path.join(root,f),'utf8');
const pkg=JSON.parse(read('package.json'));
if(pkg.version!=='410.0.0') failures.push('package.version');
if(!read('package-lock.json').includes('"version": "410.0.0"')) failures.push('package-lock.version');
if(!read('lib/runtime/version.ts').includes("'410.0.0'")) failures.push('runtime.version');
const manifest=JSON.parse(read('db/migrations/MANIFEST.json'));
const m=manifest.migrations.find(x=>x.id===235);
if(!m || m.file!=='235_v410_global_production_worker_plane.sql') failures.push('migration.235');
for(const f of ['scripts/command_worker.mjs','scripts/workflow_worker.mjs','scripts/commerce_execution_worker.mjs']) {
  const s=read(f);
  if(!s.includes('worker-plane.ts')) failures.push(`${f}:worker-plane`);
  if(s.includes('V408 ')) failures.push(`${f}:stale-version`);
}
const wp=read('modules/platform/worker-plane.ts');
for(const token of ['startWorker','heartbeatWorker','finishWorker','workerPlaneSnapshot','WORKER_LEASE_LOST']) if(!wp.includes(token)) failures.push(`worker-plane:${token}`);
if(failures.length){ console.error('V410 WORKER PLANE AUDIT FAIL',failures); process.exit(1); }
console.log('V410 WORKER PLANE AUDIT PASS');
