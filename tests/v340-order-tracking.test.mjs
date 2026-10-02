import assert from 'node:assert/strict';
import fs from 'node:fs';

const service=fs.readFileSync('modules/commerce/order-tracking.ts','utf8');
const customer=fs.readFileSync('app/api/customer/orders/[id]/tracking/route.ts','utf8');
const merchant=fs.readFileSync('app/api/merchant/fulfillment/[id]/route.ts','utf8');
const page=fs.readFileSync('app/orders/[id]/page.tsx','utf8');
const migration=fs.readFileSync('db/migrations/173_v340_order_tracking_indexes.sql','utf8');

assert.match(service,/trust_order_items/);
assert.match(service,/trust_marketplace_fulfillment_orders/);
assert.match(service,/trust_marketplace_fulfillment_events/);
assert.match(service,/listShipmentsForOrder/);
assert.match(service,/serverAuthoritative: true/);
assert.match(customer,/order\.customer_id!==user\.id/);
assert.match(customer,/getOrderTracking\(params\.id\)/);
assert.match(merchant,/getMerchantByUserId/);
assert.match(merchant,/transitionFulfillmentOrderTx/);
assert.match(merchant,/idempotency-key/);
assert.match(page,/\/api\/customer\/orders\/\$\{params\.id\}\/tracking/);
assert.match(page,/الشحن والتتبع/);
assert.match(migration,/idx_trust_shipment_events_shipment_occurred/);
console.log('V340 order tracking source contract: PASS');
