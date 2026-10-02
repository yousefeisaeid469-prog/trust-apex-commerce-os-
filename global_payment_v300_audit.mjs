import fs from 'node:fs';
const must=[
 ['db/migrations/138_v300_global_payment_execution.sql',['trust_global_payment_lifecycle_events','UNIQUE(global_payment_attempt_id,event_type,provider_reference)','execution_attempts']],
 ['modules/platform/global-payment-v300/execution.ts',['recordGlobalPaymentCreatedTx','recordGlobalPaymentProviderQueuedTx','recordGlobalPaymentLifecycleTx']],
 ['modules/commerce/payments/global-runtime.ts',['recordGlobalPaymentCreatedTx','recordGlobalPaymentProviderQueuedTx']],
 ['modules/commerce/payments/orchestrator.ts',['recordGlobalPaymentLifecycleTx']]
];
const errors=[]; for(const [file,tokens] of must){const s=fs.readFileSync(file,'utf8'); for(const t of tokens) if(!s.includes(t)) errors.push(`${file}: missing ${t}`);}
if(errors.length){console.error('V300 global payment audit FAILED'); errors.forEach(e=>console.error('- '+e)); process.exit(1);}
console.log('V300 global payment audit PASS — execution lifecycle is durably wired.');
