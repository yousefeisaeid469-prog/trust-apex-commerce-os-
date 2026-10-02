import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('storefront no longer contains a hardcoded fake exchange rate', () => {
  const source = fs.readFileSync('components/trust-os-shell.tsx', 'utf8');
  assert.equal(source.includes('n / 50'), false, 'fake ÷50 USD conversion should be removed');
});

test('currency module exposes indicative rates with a dated timestamp, not a live claim', () => {
  const source = fs.readFileSync('lib/i18n/currency.ts', 'utf8');
  assert.match(source, /RATES_AS_OF/);
  assert.match(source, /INDICATIVE_RATES_EGP/);
});

test('checkout always settles in EGP regardless of display currency', () => {
  const source = fs.readFileSync('modules/commerce/transactions/checkout.ts', 'utf8');
  assert.match(source, /currency:'EGP'/);
});

test('formatIndicative marks converted amounts as approximate', () => {
  const source = fs.readFileSync('lib/i18n/currency.ts', 'utf8');
  assert.match(source, /`≈ \$\{/);
});
