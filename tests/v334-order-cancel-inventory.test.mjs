import assert from 'node:assert/strict';
import fs from 'node:fs';

const service = fs.readFileSync('modules/commerce/inventory/reservations.ts', 'utf8');
const route = fs.readFileSync('app/api/orders/[id]/cancel/route.ts', 'utf8');
const migration = fs.readFileSync('db/migrations/170_v334_order_cancel_inventory_integrity.sql', 'utf8');

assert.match(service, /releaseOrderReservationsForCancellationTx/);
assert.match(service, /status IN \('reserved','consumed'\)/);
assert.match(service, /WHERE id=\$1 AND status IN \('reserved','consumed'\)/);
assert.match(service, /restoreStockTx\(tx, row\)/);
assert.match(service, /lifecycleEventTx\(tx, row, 'RELEASED'/);
assert.match(route, /releaseOrderReservationsForCancellationTx\(client, params\.id, 'ORDER_CANCELLED'\)/);
assert.doesNotMatch(route, /update trust_products set stock=stock\+\$1/);
assert.match(migration, /idx_trust_inventory_reservations_cancel_order_status/);

console.log('V334 order cancellation inventory integrity regression: PASS');
