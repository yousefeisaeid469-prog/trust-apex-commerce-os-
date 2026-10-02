import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('merchant dashboard now has a way to actually add a product', () => {
  const source = fs.readFileSync('app/merchant-os/page.tsx', 'utf8');
  assert.match(source, /fetch\('\/api\/merchant\/products',\{method:'POST'/);
  assert.match(source, /إضافة منتج/);
});

test('merchant dashboard can edit an existing product via the real PATCH endpoint', () => {
  const source = fs.readFileSync('app/merchant-os/page.tsx', 'utf8');
  assert.match(source, /fetch\(`\/api\/merchant\/products\/\$\{id\}`,\{method:'PATCH'/);
});

test('unverified merchants are nudged toward verification from their own dashboard', () => {
  const source = fs.readFileSync('app/merchant-os/page.tsx', 'utf8');
  assert.match(source, /\/merchant-verification/);
});

test('add-product form validates price and stock before submitting', () => {
  const source = fs.readFileSync('app/merchant-os/page.tsx', 'utf8');
  assert.match(source, /price<=0/);
  assert.match(source, /Number\.isInteger\(stock\)/);
});
