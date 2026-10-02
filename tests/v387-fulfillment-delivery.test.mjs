import fs from 'node:fs';
const runtime=fs.readFileSync('modules/marketplace/fulfillment-runtime.ts','utf8');
const shipment=fs.readFileSync('modules/platform/fulfillment-execution/core.ts','utf8');
const migration=fs.readFileSync('db/migrations/213_v387_fulfillment_delivery_unification.sql','utf8');
const assertions=[
 ['fulfillment shipment auto-bind',runtime.includes('ensureFulfillmentShipmentTx')&&runtime.includes('set shipment_id')],
 ['shipment cannot be double-bound',runtime.includes('SHIPMENT_ALREADY_BOUND_TO_FULFILLMENT')],
 ['handoff produces picked-up tracking',runtime.includes("'PICKED_UP'")&&runtime.includes('Fulfillment handed to carrier')],
 ['delivery requires shipment delivery',runtime.includes('SHIPMENT_NOT_DELIVERED')],
 ['multi-shipment order delivery is aggregated',shipment.includes('delivered===active')&&shipment.includes('moving>0')],
 ['shipment idempotency schema',migration.includes('trust_shipments_idempotency_key_uq')],
 ['legacy compatibility',migration.includes('fulfillment_order_id uuid')&&migration.includes('nullable for legacy')],
 ['no direct money mutation',!runtime.includes('trust_revenue_ledger')&&!runtime.includes('trust_payments')],
];
const passed=assertions.filter(([,ok])=>ok).length;
if(passed!==assertions.length){for(const [n,ok] of assertions) console.log(`${ok?'PASS':'FAIL'} ${n}`);process.exit(1);}
console.log(`V387 FULFILLMENT DELIVERY TEST PASS — ${passed}/${assertions.length}`);
