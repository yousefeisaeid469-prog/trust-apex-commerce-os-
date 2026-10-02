import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(process.cwd());
const migration = fs.readFileSync(path.join(root, 'db/migrations/164_v326_commerce_journey_completion.sql'), 'utf8');
const service = fs.readFileSync(path.join(root, 'modules/commerce/core/production-journey.ts'), 'utf8');
const route = fs.readFileSync(path.join(root, 'app/api/commerce/journey/[id]/route.ts'), 'utf8');

assert.match(migration, /trust_cod_collections/);
assert.match(migration, /UNIQUE\(order_id\)/);
assert.match(service, /prepareOrderFulfillmentTx/);
assert.match(service, /captureCodAtDeliveryTx/);
assert.match(service, /settleCapturedPaymentTx/);
assert.match(service, /createFulfillmentOrderTx/);
assert.match(service, /bindFulfillmentShipmentTx/);
assert.match(service, /for update/gi);
assert.match(service, /on conflict/gi);
assert.match(service, /trust_shipments/);
assert.match(service, /trust_order_status_history/);
assert.match(service, /trust_outbox_events/);
assert.match(route, /PREPARE_FULFILLMENT/);
assert.match(route, /CAPTURE_COD/);
assert.match(route, /orders:operate/);
console.log('V326 commerce journey source tests PASS');
