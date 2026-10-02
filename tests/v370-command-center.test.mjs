import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('V370 command center correlates operations, classifies root causes and persists snapshots',()=>{
  const runtime=fs.readFileSync('modules/platform/durable-events/command-center.ts','utf8');
  const migration=fs.readFileSync('db/migrations/199_v370_commerce_command_center.sql','utf8');
  const route=fs.readFileSync('app/api/health/commerce/command-center/route.ts','utf8');
  assert.match(runtime,/captureCommerceOperationsSnapshot/);
  assert.match(runtime,/causeFromIncident/);
  assert.match(runtime,/safeNextAction/);
  assert.match(runtime,/trust_commerce_events/);
  assert.match(runtime,/recentFailureSignals/);
  assert.match(migration,/trust_commerce_command_center_snapshots/);
  assert.match(route,/captureCommerceCommandCenterSnapshot/);
});
