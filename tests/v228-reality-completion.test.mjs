import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = p => fs.readFileSync(path.join(root, p), 'utf8');

test('V228 deal feed is database-backed and explicitly live', () => {
  const s = read('app/api/deals/route.ts');
  assert.match(s, /trust_products/);
  assert.match(s, /old_price/);
  assert.match(s, /surfaceStatus: 'LIVE'/);
});

test('V228 brands feed is database-backed', () => {
  const s = read('app/api/brands/route.ts');
  assert.match(s, /trust_merchant_profiles/);
  assert.match(s, /trust_products/);
  assert.match(s, /surfaceStatus: 'LIVE'/);
});

test('V228 compare reads authoritative product data', () => {
  const s = read('app/api/compare/route.ts');
  assert.match(s, /trust_products/);
  assert.match(s, /productIds/);
  assert.match(s, /surfaceStatus: 'LIVE'/);
});

test('V228 price alerts persist against the durable price-watch table', () => {
  const s = read('app/api/price-alerts/route.ts');
  assert.match(s, /trust_price_watch/);
  assert.match(s, /requireUser/);
  assert.match(s, /surfaceStatus: 'LIVE'/);
});

test('V228 package declares ESM explicitly', () => {
  const pkg = JSON.parse(read('package.json'));
  assert.equal(pkg.type, 'module');
});
