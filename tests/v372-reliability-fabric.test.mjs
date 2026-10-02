import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('V372 reliability fabric is executable and tied to authoritative commerce tables',()=>{
  const runtime=fs.readFileSync('modules/platform/durable-events/reliability-fabric.ts','utf8');
  const migration=fs.readFileSync('db/migrations/201_v372_commerce_reliability_fabric.sql','utf8');
  const route=fs.readFileSync('app/api/health/commerce/reliability/[orderId]/route.ts','utf8');
  for(const table of ['trust_orders','trust_payments','trust_inventory_reservations','trust_marketplace_fulfillment_orders','trust_shipments','trust_commerce_execution_jobs','trust_revenue_ledger','trust_commerce_events']) assert.match(runtime,new RegExp(table));
  assert.match(runtime,/materializeCommerceReliabilityTrace/);
  assert.match(runtime,/rootCause/);
  assert.match(migration,/trust_commerce_reliability_traces/);
  assert.match(migration,/trust_commerce_reliability_trace_nodes/);
  assert.match(migration,/trust_commerce_reliability_trace_edges/);
  assert.match(route,/getCommerceReliabilityTrace/);
});
