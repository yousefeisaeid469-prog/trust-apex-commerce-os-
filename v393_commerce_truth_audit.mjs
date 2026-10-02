import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = (f) => fs.readFileSync(path.join(root, f), 'utf8');
const errors = [];

const criticalRoutes = [
  'app/api/checkout/commit/route.ts',
  'app/api/checkout/cart/commit/route.ts',
  'app/api/checkout/global/commit/route.ts',
  'app/api/payments/intent/route.ts',
  'app/api/payments/webhook/route.ts',
];

for (const file of criticalRoutes) {
  const source = read(file);
  if (!source.includes('modules/platform/db/postgres')) errors.push(`${file}: missing PostgreSQL boundary`);
}

const commit = read('app/api/checkout/commit/route.ts');
for (const token of [
  'getPaymentProviderReadiness',
  'createPaymentIntent',
  'checkout-payment:${key}',
  'transaction: async work => work(client)',
  'paymentMethod === \'card\'',
]) if (!commit.includes(token)) errors.push(`checkout/commit missing atomic card payment invariant: ${token}`);

const repo = 'modules/commerce/repository/orders.ts';
if (fs.existsSync(path.join(root, repo))) {
  const files = [];
  const walk = (dir) => {
    for (const entry of fs.readdirSync(path.join(root, dir), { withFileTypes: true })) {
      const rel = path.join(dir, entry.name);
      if (entry.isDirectory() && !['node_modules','.next','.git'].includes(entry.name)) walk(rel);
      else if (entry.isFile() && /\.(ts|tsx|mjs|js)$/.test(entry.name)) files.push(rel);
    }
  };
  walk('.');
  for (const file of files) {
    if (file === repo || file === 'scripts/v393_commerce_truth_audit.mjs') continue;
    const source = read(file);
    if (source.includes('commerce/repository/orders') || source.includes('@/modules/commerce/repository/orders')) {
      errors.push(`legacy in-memory order repository imported by ${file}`);
    }
  }
}

const checkout = read('modules/commerce/transactions/checkout.ts');
for (const token of ['trust_orders', 'trust_order_items', 'trust_outbox_events', 'trust_idempotency_keys']) {
  if (!checkout.includes(token)) errors.push(`canonical checkout missing ${token}`);
}

if (errors.length) {
  console.error('V393 COMMERCE TRUTH AUDIT FAILED');
  for (const e of errors) console.error(`- ${e}`);
  process.exit(1);
}
console.log('V393 COMMERCE TRUTH AUDIT PASS — critical checkout/payment routes use durable PostgreSQL paths; no runtime imports of the legacy in-memory order repository were found.');
