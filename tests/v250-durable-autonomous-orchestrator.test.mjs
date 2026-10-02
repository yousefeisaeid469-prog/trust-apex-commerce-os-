import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
const root=process.cwd();
const read=f=>fs.readFileSync(path.join(root,f),'utf8');

test('V250 has an atomic durable acceptance path',()=>{
 const s=read('modules/platform/autonomous-commerce-orchestrator/durable.ts');
 assert.match(s,/withPgTransaction/); assert.match(s,/appendEventTx/); assert.match(s,/trust_autonomous_orchestration_runs/);
});

test('V250 registers the orchestrator in the durable consumer mesh',()=>{
 const s=read('modules/platform/commerce-events/contracts.ts');
 assert.match(s,/autonomous-commerce-orchestrator/); assert.match(s,/modules\/platform\/autonomous-commerce-orchestrator\/consumer\.ts/);
});

test('V250 persists completion and exposes status lookup',()=>{
 assert.match(read('modules/platform/autonomous-commerce-orchestrator/consumer.ts'),/completeOrchestration/);
 assert.match(read('app/api/autonomous-commerce-orchestrator/route.ts'),/getDurableOrchestrationRun/);
});

test('V250 refuses function-valued adapters at the durable boundary',()=>{
 assert.match(read('modules/platform/autonomous-commerce-orchestrator/durable.ts'),/DURABLE_ORCHESTRATOR_ADAPTER_MUST_BE_PROVIDER_REGISTERED/);
});

console.log('V250 durable autonomous orchestrator test PASS.');
