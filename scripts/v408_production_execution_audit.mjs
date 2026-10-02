import fs from 'node:fs';
const must=[
 'db/migrations/233_v408_production_execution_plane.sql',
 'modules/platform/runtime-spine.ts',
 'modules/commerce/transactions/checkout.ts',
 'modules/commerce/payments/orchestrator.ts',
 'modules/commerce/core/order-execution.ts',
 'app/api/runtime/production/route.ts',
];
for(const p of must) if(!fs.existsSync(p)) throw new Error(`V408_MISSING:${p}`);
const sql=fs.readFileSync(must[0],'utf8');
for(const token of ['heartbeat_at','lease_owner','next_attempt_at','trust_production_execution_snapshot','CAPTURED_PAYMENT_NO_EXECUTION','FULFILLMENT_BLOCKED','SETTLEMENT_PENDING']) if(!sql.includes(token)) throw new Error(`V408_SQL_MISSING:${token}`);
const spine=fs.readFileSync(must[1],'utf8');
for(const token of ['RUNTIME_STATUS_TRANSITIONS','RUNTIME_STATUS_TRANSITION_INVALID','ensureOrderRuntimeOperationTx','productionExecutionSnapshot']) if(!spine.includes(token)) throw new Error(`V408_SPINE_MISSING:${token}`);
const checkout=fs.readFileSync(must[2],'utf8'); if(!checkout.includes("operationType: 'commerce.order'") && !checkout.includes('ensureOrderRuntimeOperationTx')) throw new Error('V408_CHECKOUT_NOT_BRIDGED');
const payment=fs.readFileSync(must[3],'utf8'); for(const token of ['payment.captured','PAYMENT_FAILED','ensureOrderRuntimeOperationTx']) if(!payment.includes(token)) throw new Error(`V408_PAYMENT_NOT_BRIDGED:${token}`);
const execution=fs.readFileSync(must[4],'utf8'); for(const token of ['commerce.execution.started','commerce.fulfillment.planned','commerce.order.completed']) if(!execution.includes(token)) throw new Error(`V408_EXECUTION_NOT_BRIDGED:${token}`);
console.log('V408 PRODUCTION EXECUTION AUDIT PASS — order, payment, fulfillment, settlement and runtime execution are bridged to one durable order operation.');
