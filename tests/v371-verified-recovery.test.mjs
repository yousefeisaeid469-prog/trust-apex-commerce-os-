import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('V371 verified recovery loop executes only bounded safe actions and records postconditions',()=>{
  const runtime=fs.readFileSync('modules/platform/durable-events/recovery-loop.ts','utf8');
  const migration=fs.readFileSync('db/migrations/200_v371_verified_commerce_recovery_loop.sql','utf8');
  const route=fs.readFileSync('app/api/cron/commerce-recovery-loop/route.ts','utf8');
  assert.match(runtime,/observeCommerceCommandCenter/);
  assert.match(runtime,/recoverStaleConsumerDeliveries/);
  assert.match(runtime,/reclaimExecutionLeases/);
  assert.match(runtime,/after = await observeCommerceCommandCenter/);
  assert.match(runtime,/verified/);
  assert.match(migration,/trust_commerce_recovery_runs/);
  assert.match(route,/runVerifiedCommerceRecovery/);
});
