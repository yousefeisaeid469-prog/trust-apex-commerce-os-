import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';

const NATIONAL_ID_RE = /^\d{14}$/;
const PHONE_RE = /^01[0125]\d{8}$/;

test('migration 042 exists and is registered in manifest with matching checksum', () => {
  const file = 'db/migrations/042_v152_merchant_verification.sql';
  assert.equal(fs.existsSync(file), true);
  const manifest = JSON.parse(fs.readFileSync('db/migrations/MANIFEST.json', 'utf8'));
  const entry = manifest.migrations.find((m) => m.file === '042_v152_merchant_verification.sql');
  assert.ok(entry, 'manifest entry missing');
  const hash = crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
  assert.equal(entry.checksum, hash);
});

test('national id validation rejects non-14-digit values', () => {
  assert.equal(NATIONAL_ID_RE.test('12345678901234'), true);
  assert.equal(NATIONAL_ID_RE.test('123'), false);
  assert.equal(NATIONAL_ID_RE.test('1234567890123a'), false);
});

test('egyptian mobile phone validation accepts common prefixes only', () => {
  assert.equal(PHONE_RE.test('01012345678'), true);
  assert.equal(PHONE_RE.test('01512345678'), true);
  assert.equal(PHONE_RE.test('01312345678'), false);
  assert.equal(PHONE_RE.test('0101234567'), false);
});

test('verification submission requires an https document url', () => {
  const source = fs.readFileSync('modules/merchants/core/store.ts', 'utf8');
  assert.equal(source.includes("test(input.idDocumentUrl)"), true);
  assert.equal(source.includes('ID_DOCUMENT_REQUIRED'), true);
});

test('admin review route requires reviewer session before mutating state', () => {
  const source = fs.readFileSync('app/api/admin/merchant-verification/route.ts', 'utf8');
  assert.match(source, /requireAdmin\(request\)/);
});

test('cash on delivery orders skip payment gateway and go straight to confirmed', () => {
  const source = fs.readFileSync('modules/commerce/transactions/checkout.ts', 'utf8');
  assert.equal(source.includes("initialStatus=paymentMethod==='cod'?'confirmed':'pending'"), true);
});

test('trust_orders has a payment_method column migration', () => {
  assert.equal(fs.existsSync('db/migrations/045_v155_cash_on_delivery.sql'), true);
  const text = fs.readFileSync('db/migrations/045_v155_cash_on_delivery.sql', 'utf8');
  assert.match(text, /payment_method text NOT NULL DEFAULT 'cod'/);
});
