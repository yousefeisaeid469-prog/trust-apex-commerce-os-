import fs from 'node:fs'; import path from 'node:path';
const root=process.cwd(); const read=f=>fs.readFileSync(path.join(root,f),'utf8'); const failures=[];
const migration=read('db/migrations/242_v417_commerce_execution_graph.sql');
const graph=read('modules/commerce/core/execution-graph.ts');
const kernel=read('modules/commerce/core/canonical-commerce-kernel.ts');
const payment=read('modules/commerce/payments/orchestrator.ts');
const delivery=read('modules/platform/fulfillment-tracking-3/core.ts');
const route=read('app/api/commerce/execution-graph/[id]/route.ts');
for(const s of ['trust_commerce_execution_graphs','graph_state','gaps_json','edges_json']) if(!migration.includes(s)) failures.push(`migration:${s}`);
for(const s of ['refreshCommerceExecutionGraphTx','CAPTURED_PAYMENT_NO_EXECUTION','DELIVERED_WITHOUT_SETTLEMENT','SETTLEMENT_BEFORE_DELIVERY']) if(!graph.includes(s)) failures.push(`graph:${s}`);
if(!kernel.includes('commitCanonicalCheckout') || !kernel.includes('refreshCommerceExecutionGraphTx')) failures.push('canonical kernel graph hook missing');
if(!payment.includes('refreshCommerceExecutionGraphTx')) failures.push('payment capture graph sync missing');
if(!delivery.includes('refreshCommerceExecutionGraphTx')) failures.push('delivery graph sync missing');
if(!route.includes('refreshCommerceExecutionGraphTx') || !route.includes('AUTH_REQUIRED')) failures.push('graph API missing auth/refresh');
if(failures.length){console.error('V417 EXECUTION GRAPH TEST FAIL',failures);process.exit(1)}
console.log('V417 EXECUTION GRAPH TEST PASS');
