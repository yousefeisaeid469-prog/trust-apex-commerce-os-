import assert from 'node:assert/strict';
import { rateLimitDistributed } from '../modules/platform/security/rate-limit/distributed.ts';

process.env.NODE_ENV = 'test';

const key = `v335-regression-${Date.now()}-${Math.random()}`;
let allowed = 0;
for (let i = 0; i < 10; i++) {
  const result = await rateLimitDistributed(key, 10, 60_000);
  if (result.allowed) allowed++;
}
const blocked = await rateLimitDistributed(key, 10, 60_000);
assert.equal(allowed, 10);
assert.equal(blocked.allowed, false);
assert.equal(blocked.remaining, 0);
console.log('V335 order lookup abuse-rate-limit regression: PASS');
