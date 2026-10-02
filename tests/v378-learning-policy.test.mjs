import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
const root=process.cwd();
test('V378 learning policy engine assets and safety boundary',()=>{
  const lp=fs.readFileSync(path.join(root,'modules/platform/global-commerce-automation/learning-policy.ts'),'utf8');
  const core=fs.readFileSync(path.join(root,'modules/platform/global-commerce-automation/core.ts'),'utf8');
  const migration=fs.readFileSync(path.join(root,'db/migrations/207_v378_learning_policy_engine.sql'),'utf8');
  assert.match(lp,/MIN_VERIFIED_SAMPLES = 3/);
  assert.match(lp,/MAX_FAILURE_RATE = 0\.20/);
  assert.match(lp,/state='ACTIVE'/);
  assert.match(lp,/OWNER_AUTH_REQUIRED/);
  assert.match(core,/policyState/);
  assert.match(core,/learningEvidence/);
  assert.match(migration,/never authoritative for business money/);
});
