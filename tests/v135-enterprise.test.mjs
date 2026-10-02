import test from 'node:test'; import assert from 'node:assert/strict'; import fs from 'node:fs';
const read=f=>fs.readFileSync(f,'utf8');
test('current canonical version and enterprise control plane exist',()=>{assert.match(read('lib/runtime/version.ts'),/V\d+\.0\.0/);assert.equal(JSON.parse(read('package.json')).version.match(/^\d+\.0\.0$/)?.[0],JSON.parse(read('package.json')).version);assert.match(read('db/migrations/025_v135_enterprise_control_plane.sql'),/trust_tenants/);});
test('V135 usage is database-idempotent',()=>{const s=read('db/migrations/025_v135_enterprise_control_plane.sql');assert.match(s,/UNIQUE\(tenant_id,metric,idempotency_key\)/);});
test('V135 billing state machine is explicit',()=>{const s=read('modules/enterprise/billing.ts');assert.match(s,/INVALID_BILLING_TRANSITION/);assert.match(s,/past_due/);});
test('V135 abuse suite has deterministic thresholds',()=>{const s=read('modules/security/abuse-rules.ts');assert.match(s,/duplicateRate>=0\.8/);assert.match(s,/authFailures>=10/);});
test('V135 observability exposes SLOs and correlation IDs',()=>{assert.match(read('modules/observability/slo.ts'),/api-availability/);assert.match(read('modules/observability/correlation.ts'),/x-request-id/);});
