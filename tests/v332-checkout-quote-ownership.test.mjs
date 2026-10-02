import assert from 'node:assert/strict';
import fs from 'node:fs';

const engine = fs.readFileSync('modules/commerce/core/engine.ts', 'utf8');
const migration = fs.readFileSync('db/migrations/169_v332_checkout_quote_ownership.sql', 'utf8');
const route = fs.readFileSync('app/api/checkout/place-order/route.ts', 'utf8');

assert.match(migration, /customer_id uuid REFERENCES trust_users\(id\)/i);
assert.match(engine, /customer_id is not distinct from \$2/i);
assert.match(engine, /customer_id\) values\(\$1,\$2::jsonb,\$3::jsonb,'EGP',\$4,\$5,\$6\)/i);
assert.match(engine, /row\.customer_id !== customerId/);
assert.match(engine, /QUOTE_NOT_OWNED/);
assert.match(route, /QUOTE_NOT_OWNED/);

console.log('V332 checkout quote ownership regression: PASS');
