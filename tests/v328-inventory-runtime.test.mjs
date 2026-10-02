import fs from 'node:fs';
import assert from 'node:assert/strict';

const migration = fs.readFileSync('db/migrations/166_v328_inventory_reservation_runtime.sql','utf8');
const service = fs.readFileSync('modules/commerce/inventory/reservations.ts','utf8');
const execution = fs.readFileSync('modules/commerce/core/order-execution.ts','utf8');
const orchestrator = fs.readFileSync('modules/commerce/payments/orchestrator.ts','utf8');
const worker = fs.readFileSync('scripts/inventory_reservation_worker.mjs','utf8');

assert.match(migration,/trust_inventory_reservation_events/);
assert.match(migration,/status = 'reserved'/);
for (const token of ['FOR UPDATE','SKIP LOCKED','RESERVATION_EXPIRED','reservation_release','trust_outbox_events']) assert.ok(service.includes(token), token);
assert.ok(execution.includes('consumeOrderReservationsTx'));
assert.ok(orchestrator.includes('releaseOrderReservationsTx'));
assert.match(worker,/expireInventoryReservationsTx/);
console.log('V328 inventory reservation runtime tests PASS');
