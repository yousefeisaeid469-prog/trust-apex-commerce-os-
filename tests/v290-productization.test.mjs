import fs from 'node:fs';
import assert from 'node:assert/strict';

const migration=fs.readFileSync('db/migrations/128_v290_productization_foundation.sql','utf8');
assert.match(migration,/trust_merchant_store_settings/);
assert.match(migration,/trust_product_variants/);
assert.match(migration,/trust_accounting_journals/);
assert.match(migration,/trust_accounting_entries/);
assert.match(migration,/trust_ai_decisions/);
assert.match(migration,/trust_security_events/);
assert.match(migration,/trust_marketplace_regions/);
assert.match(migration,/trust_tax_rules/);
assert.match(migration,/trust_integration_registry/);
assert.match(migration,/trust_notifications/);

const product=fs.readFileSync('modules/platform/product-core.ts','utf8');
assert.match(product,/createSellerStore/); assert.match(product,/createVariant/); assert.match(product,/recordAiDecision/); assert.match(product,/recordSecurityEvent/); assert.match(product,/queueNotification/);
const accounting=fs.readFileSync('modules/platform/accounting-core.ts','utf8');
assert.match(accounting,/UNBALANCED_JOURNAL/); assert.match(accounting,/JOURNAL_CURRENCY_MISMATCH/); assert.match(accounting,/postDoubleEntryJournal/);
const sellerApi=fs.readFileSync('app/api/auth/register/seller/route.ts','utf8'); assert.match(sellerApi,/createSellerStore/);
for(const f of ['app/api/buyer/dashboard/route.ts','app/api/seller/dashboard/route.ts','app/api/admin/dashboard/route.ts']) assert.match(fs.readFileSync(f,'utf8'),/getCurrentUser/);
console.log('V290 productization foundation: 19/19 PASS');
