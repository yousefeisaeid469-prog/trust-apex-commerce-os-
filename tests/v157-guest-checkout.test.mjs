import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('checkout commit route does not require a login session', () => {
  const source = fs.readFileSync('app/api/checkout/commit/route.ts', 'utf8');
  assert.equal(source.includes("if (!user) return NextResponse.json({ ok: false, error: 'AUTH_REQUIRED'"), false);
});

test('guest checkout is only permitted for cash on delivery, never card', () => {
  const source = fs.readFileSync('modules/commerce/transactions/checkout.ts', 'utf8');
  assert.match(source, /GUEST_CHECKOUT_REQUIRES_COD/);
});

test('guest phone is validated as a real Egyptian mobile number', () => {
  const source = fs.readFileSync('modules/commerce/transactions/checkout.ts', 'utf8');
  assert.match(source, /PHONE_RE = \/\^01\[0125\]\\d\{8\}\$\//);
});

test('trust_orders allows a null customer_id when guest fields are present', () => {
  const text = fs.readFileSync('db/migrations/046_v157_guest_checkout.sql', 'utf8');
  assert.match(text, /ALTER COLUMN customer_id DROP NOT NULL/);
  assert.match(text, /trust_orders_buyer_identity_check/);
});

test('storefront shows a guest form instead of forcing login before checkout', () => {
  const source = fs.readFileSync('components/trust-os-shell.tsx', 'utf8');
  assert.equal(source.includes('guest-form'), true);
  assert.equal(source.includes("window.location.href = '/customer-login?next=/'; return;"), false);
});
