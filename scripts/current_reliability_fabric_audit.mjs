import fs from 'node:fs';
const checks=[];
const read=p=>fs.readFileSync(p,'utf8');
const runtime=read('modules/platform/durable-events/reliability-fabric.ts');
const migration=read('db/migrations/201_v372_commerce_reliability_fabric.sql');
const route=read('app/api/health/commerce/reliability/[orderId]/route.ts');
const test=read('tests/v372-reliability-fabric.test.mjs');
for(const [name,ok] of [
 ['runtime exists',fs.existsSync('modules/platform/durable-events/reliability-fabric.ts')],
 ['migration exists',fs.existsSync('db/migrations/201_v372_commerce_reliability_fabric.sql')],
 ['trace table',migration.includes('trust_commerce_reliability_traces')],
 ['node table',migration.includes('trust_commerce_reliability_trace_nodes')],
 ['edge table',migration.includes('trust_commerce_reliability_trace_edges')],
 ['order authority',runtime.includes('trust_orders')],
 ['payment authority',runtime.includes('trust_payments')],
 ['inventory authority',runtime.includes('trust_inventory_reservations')],
 ['fulfillment authority',runtime.includes('trust_marketplace_fulfillment_orders')],
 ['delivery authority',runtime.includes('trust_shipments')],
 ['execution authority',runtime.includes('trust_commerce_execution_jobs')],
 ['revenue authority',runtime.includes('trust_revenue_ledger')],
 ['event authority',runtime.includes('trust_commerce_events')],
 ['root-cause classifier',runtime.includes('function rootCause')],
 ['api route wired',route.includes('getCommerceReliabilityTrace')],
 ['smoke test wired',test.includes('V372 reliability fabric')],
]) checks.push({name,ok});
const failed=checks.filter(x=>!x.ok); if(failed.length){console.error(`V372 RELIABILITY FABRIC AUDIT FAILED (${failed.length}/${checks.length})`);failed.forEach(x=>console.error(`- ${x.name}`));process.exit(1)}
console.log(`V372 RELIABILITY FABRIC AUDIT PASS — ${checks.length}/${checks.length}`);
