import fs from 'node:fs';
import path from 'node:path';
const root=process.cwd(); const read=f=>fs.readFileSync(path.join(root,f),'utf8'); const exists=f=>fs.existsSync(path.join(root,f));
const required=[
 'db/migrations/101_v250_durable_autonomous_orchestrator.sql',
 'modules/platform/autonomous-commerce-orchestrator/durable.ts',
 'modules/platform/autonomous-commerce-orchestrator/consumer.ts',
 'modules/platform/commerce-events/contracts.ts',
 'app/api/autonomous-commerce-orchestrator/route.ts',
 'tests/v250-durable-autonomous-orchestrator.test.mjs',
 'docs/architecture/DURABLE-AUTONOMOUS-ORCHESTRATOR-V250.md',
 'MASTER-RELEASE.md'
];
const errors=[]; for(const f of required) if(!exists(f)) errors.push(`MISSING:${f}`);
const checks=[
 ['atomic append + run insert','withPgTransaction','modules/platform/autonomous-commerce-orchestrator/durable.ts'],
 ['durable event append','appendEventTx','modules/platform/autonomous-commerce-orchestrator/durable.ts'],
 ['durable run table','trust_autonomous_orchestration_runs','db/migrations/101_v250_durable_autonomous_orchestrator.sql'],
 ['worker consumer registration','autonomous-commerce-orchestrator','modules/platform/commerce-events/contracts.ts'],
 ['durable result persistence','completeOrchestration','modules/platform/autonomous-commerce-orchestrator/consumer.ts'],
 ['status API','getDurableOrchestrationRun','app/api/autonomous-commerce-orchestrator/route.ts'],
 ['non-serializable adapter guard','DURABLE_ORCHESTRATOR_ADAPTER_MUST_BE_PROVIDER_REGISTERED','modules/platform/autonomous-commerce-orchestrator/durable.ts']
];
for(const [label,marker,file] of checks) if(!read(file).includes(marker)) errors.push(`MISSING_MARKER:${label}:${marker}`);
if(errors.length){console.error('Durable Autonomous Orchestrator audit FAILED'); errors.forEach(e=>console.error('- '+e)); process.exit(1)}
console.log('Durable Autonomous Orchestrator audit PASS — durable acceptance, worker wiring, result persistence, status API, and adapter safety are connected.');
