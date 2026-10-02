import assert from 'node:assert/strict';
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
const required=[
 'db/migrations/138_v300_global_payment_execution.sql',
 'modules/platform/global-payment-v300/execution.ts',
 'modules/platform/global-payment-v300/index.ts',
 'modules/commerce/payments/global-runtime.ts',
 'modules/commerce/payments/orchestrator.ts',
 'scripts/global_payment_v300_audit.mjs'
];
for(const f of required) assert.ok(fs.existsSync(f),`missing ${f}`);
const migration=fs.readFileSync(required[0],'utf8');
for(const token of ['trust_global_payment_lifecycle_events','provider_queued_at','captured_at','failed_at','execution_attempts']) assert.match(migration,new RegExp(token));
const runtime=fs.readFileSync(required[1],'utf8');
for(const token of ['recordGlobalPaymentCreatedTx','recordGlobalPaymentProviderQueuedTx','recordGlobalPaymentLifecycleTx','V300.0.0']) assert.match(runtime,new RegExp(token));
const flow=fs.readFileSync(required[3],'utf8'); assert.match(flow,/recordGlobalPaymentCreatedTx/); assert.match(flow,/recordGlobalPaymentProviderQueuedTx/);
const orch=fs.readFileSync(required[4],'utf8'); assert.match(orch,/recordGlobalPaymentLifecycleTx/); assert.match(orch,/global_payment_attempts/);
execFileSync(process.execPath,['--experimental-strip-types','-e',`const m=await import(new URL('modules/platform/global-payment-v300/execution.ts','file://'+process.cwd()+'/')); if(m.GLOBAL_PAYMENT_EXECUTION_VERSION!=='V300.0.0') throw new Error('version'); console.log('V300 execution module PASS')`],{stdio:'inherit'});
console.log('V300 global payment execution contract PASS');
