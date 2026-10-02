import test from 'node:test';
import assert from 'node:assert/strict';
import { assertMinorAmount, toMinorUnits } from '../modules/platform/production-integration/core.ts';

test('V181 money boundary converts EGP deterministically to minor units',()=>{
  assert.equal(toMinorUnits(12.34),1234); assert.equal(assertMinorAmount(1),1);
  assert.throws(()=>toMinorUnits(Number.POSITIVE_INFINITY),/INVALID_MONEY/);
  assert.throws(()=>assertMinorAmount(0),/INVALID_MINOR_AMOUNT/);
  assert.throws(()=>assertMinorAmount(1.5),/INVALID_MINOR_AMOUNT/);
});

test('V181 route imports canonical createOrder boundary',async()=>{
  const fs=await import('node:fs/promises'); const text=await fs.readFile(new URL('../app/api/checkout/commit/route.ts',import.meta.url),'utf8');
  assert.match(text,/import \{ createOrder \}/); assert.doesNotMatch(text,/import \{ commitCheckout \}/);
});

test('V181 integration contracts expose provider boundaries',async()=>{
  const fs=await import('node:fs/promises'); const text=await fs.readFile(new URL('../modules/platform/production-integration/contracts.ts',import.meta.url),'utf8');
  assert.match(text,/PaymentGateway/); assert.match(text,/FulfillmentGateway/); assert.match(text,/OutboxPublisher/);
});
