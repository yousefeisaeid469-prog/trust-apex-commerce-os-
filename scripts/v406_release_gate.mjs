import fs from 'node:fs'; import crypto from 'node:crypto';
const read=f=>fs.readFileSync(f,'utf8'), exists=f=>fs.existsSync(f), errors=[];
const pkg=JSON.parse(read('package.json')); const lock=JSON.parse(read('package-lock.json')); const runtime=read('lib/runtime/version.ts'); const manifest=JSON.parse(read('db/migrations/MANIFEST.json'));
if(pkg.version!=='406.0.0'||lock.version!=='406.0.0'||lock.packages?.['']?.version!=='406.0.0')errors.push('version mismatch');
for(const t of ["TRUST_RUNTIME_VERSION='V406.0.0'","TRUST_VERSION='V406.0.0'","TRUST_VERSION_NUMBER='V406.0.0'"])if(!runtime.includes(t))errors.push('runtime '+t);
const head=manifest.migrations.at(-1); if(manifest.version!=='V406.0.0'||String(head?.id)!=='231'||head?.version!=='V406.0.0')errors.push('migration head');
const mf='db/migrations/231_v406_order_journey_workflow_bridge.sql'; if(!exists(mf))errors.push('missing migration'); else if(head.checksum!==crypto.createHash('sha256').update(fs.readFileSync(mf)).digest('hex'))errors.push('migration checksum');
for(const f of ['modules/platform/workflow-orchestrator.ts','modules/platform/commands/registry.ts','modules/platform/fulfillment-tracking-3/core.ts','modules/commerce/payments/orchestrator.ts','scripts/workflow_worker.mjs','scripts/v406_order_journey_audit.mjs','tests/v406-order-journey-workflow.test.mjs'])if(!exists(f))errors.push('missing '+f);
if(errors.length){console.error('V406 RELEASE GATE FAILED');errors.forEach(e=>console.error('- '+e));process.exit(1)} console.log('V406 RELEASE GATE PASS — durable order journey workflow bridge is structurally wired; live PostgreSQL still requires DATABASE_URL.');
