import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
test('V381 decision command gateway is durable, owner-approved, idempotent and revalidated',()=>{
 const s=fs.readFileSync('modules/platform/global-commerce-automation/decision-command-gateway.ts','utf8');
 const m=fs.readFileSync('db/migrations/210_v381_decision_command_gateway.sql','utf8');
 assert.match(s,/idempotencyKey/);assert.match(s,/DECISION_NOT_EXECUTABLE/);assert.match(s,/GOVERNED_POLICY_CHANGED/);assert.match(s,/INCIDENT_NO_LONGER_ACTIVE/);assert.match(s,/executeSafeIncidentAction/);assert.match(s,/withPgTransaction/);assert.match(m,/idempotency_key TEXT NOT NULL UNIQUE/);assert.match(m,/state TEXT NOT NULL CHECK/);assert.match(m,/directBusinessMutation|directBusinessMutation=false|DirectBusinessMutation/);
});
