import fs from 'node:fs';
const core=fs.readFileSync('modules/platform/order-journey-os/core.ts','utf8');
const api=fs.readFileSync('app/api/orders/[id]/journey/route.ts','utf8');
const migration=fs.readFileSync('db/migrations/214_v388_global_marketplace_order_os.sql','utf8');
const assertions=[
  ['live PostgreSQL query',/from trust_orders/.test(core)],
  ['payment + fulfillment join surface',/trust_payments[\s\S]*trust_marketplace_fulfillment_orders/.test(core)],
  ['returns + refunds surface',/trust_returns[\s\S]*trust_refunds/.test(core)],
  ['payout + revenue surface',/trust_marketplace_payout_requests[\s\S]*trust_revenue_ledger/.test(core)],
  ['timeline aggregation',/events\.sort\(/.test(core)],
  ['customer isolation',/customerId/.test(core)&&/ORDER_NOT_FOUND/.test(api)],
  ['no static order payload',!/const\s+DEMO|mockOrder|fakeOrder/i.test(core)],
  ['migration indexes',/CREATE INDEX IF NOT EXISTS/.test(migration)],
];
const passed=assertions.filter(([,ok])=>ok).length;
console.log(`V388 GLOBAL MARKETPLACE ORDER OS TEST ${passed===assertions.length?'PASS':'FAIL'} — ${passed}/${assertions.length}`);
if(passed!==assertions.length)process.exit(1);
