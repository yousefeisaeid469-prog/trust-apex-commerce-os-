import fs from 'node:fs';
import path from 'node:path';
const root=process.cwd();
const read=f=>fs.readFileSync(path.join(root,f),'utf8');
const failures=[];
const pkg=JSON.parse(read('package.json'));
if(pkg.version!=='412.0.0') failures.push('package.version');
if(!read('lib/runtime/version.ts').includes("RUNTIME_VERSION='412.0.0'")) failures.push('runtime.version');
if(!read('db/migrations/MANIFEST.json').includes('237_v412_global_execution_idempotency_mesh.sql')) failures.push('migration.manifest');
if(!read('modules/platform/execution-idempotency.ts').includes('fencing_token=fencing_token+1')) failures.push('fencing.takeover');
if(!read('scripts/command_worker.mjs').includes("scope:'command'")) failures.push('command.scope');
if(!read('modules/commerce/core/execution-worker.ts').includes("scope: 'commerce-job'")) failures.push('commerce.scope');
if(read('modules/commerce/core/execution-worker.ts').includes('commerce-worker:${job.id}:${job.attempts}')) failures.push('attempt-varying-commerce-idempotency');
if(failures.length) { console.error('V412 EXECUTION IDEMPOTENCY AUDIT FAIL',failures); process.exit(1);}
console.log('V412 EXECUTION IDEMPOTENCY AUDIT PASS');
