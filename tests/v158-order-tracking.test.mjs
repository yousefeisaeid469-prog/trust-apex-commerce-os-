import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('order tracker page is no longer a static hardcoded fake timeline', () => {
  const source = fs.readFileSync('app/order-tracker/page.tsx', 'utf8');
  assert.equal(source.includes('Immersive Live Order Tracker'), false);
  assert.equal(source.includes("fetch(`/api/orders/lookup"), true);
});

test('guest order lookup requires the phone used at checkout to match', () => {
  const source = fs.readFileSync('app/api/orders/lookup/route.ts', 'utf8');
  assert.match(source, /phone === guestPhone/);
  assert.match(source, /ORDER_ACCESS_DENIED/);
});

test('order lookup validates order id format before querying', () => {
  const source = fs.readFileSync('app/api/orders/lookup/route.ts', 'utf8');
  assert.match(source, /UUID_RE/);
  assert.match(source, /INVALID_ORDER_ID/);
});
