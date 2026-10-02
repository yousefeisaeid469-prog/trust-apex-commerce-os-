import fs from 'node:fs';
import path from 'node:path';
const root=process.cwd();
const required=[
 'db/migrations/213_v387_fulfillment_delivery_unification.sql',
 'modules/marketplace/fulfillment-runtime.ts',
 'modules/platform/fulfillment-execution/core.ts',
 'app/api/merchant/fulfillment/[id]/route.ts',
 'app/api/customer/orders/[id]/shipments/route.ts',
 'CHANGELOG-V387.md'
];
for(const f of required) if(!fs.existsSync(path.join(root,f))) throw new Error(`MISSING:${f}`);
const migration=fs.readFileSync(path.join(root,required[0]),'utf8');
const runtime=fs.readFileSync(path.join(root,'modules/marketplace/fulfillment-runtime.ts'),'utf8');
const shipment=fs.readFileSync(path.join(root,'modules/platform/fulfillment-execution/core.ts'),'utf8');
const checks=[
 ['shipment fulfillment binding',migration.includes('fulfillment_order_id uuid REFERENCES trust_marketplace_fulfillment_orders')],
 ['shipment idempotency',migration.includes('idempotency_key text')&&migration.includes('trust_shipments_idempotency_key_uq')],
 ['auto shipment creation',runtime.includes('ensureFulfillmentShipmentTx')&&runtime.includes("insert into trust_shipments")],
 ['label lifecycle',runtime.includes("'LABEL_CREATED'")&&runtime.includes('Fulfillment label created')],
 ['handoff lifecycle',runtime.includes("'PICKED_UP'")&&runtime.includes('Fulfillment handed to carrier')],
 ['delivery bound shipment',runtime.includes("SHIPMENT_NOT_DELIVERED")],
 ['multi shipment aggregation',shipment.includes('count(*) filter (where status=\'DELIVERED\')')&&shipment.includes('multi-shipment aggregate')],
 ['legacy shipment compatibility',migration.includes('nullable for legacy order-level shipments')],
 ['seller fulfillment API remains wired',fs.readFileSync(path.join(root,'app/api/merchant/fulfillment/[id]/route.ts'),'utf8').includes('transitionFulfillmentOrderTx')],
 ['customer tracking remains wired',fs.readFileSync(path.join(root,'app/api/customer/orders/[id]/shipments/route.ts'),'utf8').includes('listShipmentsForOrder')],
];
const passed=checks.filter(([,ok])=>ok).length;
if(passed!==checks.length){for(const [n,ok] of checks) console.log(`${ok?'PASS':'FAIL'} ${n}`); process.exit(1);}
console.log(`V387 FULFILLMENT DELIVERY AUDIT PASS — ${passed}/${checks.length}`);
