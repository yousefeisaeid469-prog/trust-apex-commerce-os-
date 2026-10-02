import fs from 'node:fs';
import assert from 'node:assert/strict';
const migration=fs.readFileSync(new URL('../db/migrations/160_v322_seller_services_b2b_membership.sql',import.meta.url),'utf8');
const service=fs.readFileSync(new URL('../modules/platform/v322/revenue-expansion.ts',import.meta.url),'utf8');
for(const t of ['trust_seller_service_orders','trust_b2b_service_charges','trust_customer_membership_billing_events']) assert.match(migration,new RegExp(`CREATE TABLE IF NOT EXISTS ${t}`));
for(const token of ['purchaseSellerService','chargeB2BService','billMembershipRenewal','SELLER_SERVICES','B2B','SUBSCRIPTION','withPgTransaction','idempotency_key','on conflict']) assert.match(service,new RegExp(token,'i'));
assert.match(service,/for update/i);
console.log('V322 revenue expansion source tests PASS');
