import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const read=f=>fs.readFileSync(f,'utf8');
test('decision ledger no longer reports simulated persistence',()=>{const s=read('app/api/decision-ledger/route.ts');assert.ok(!s.includes('DEC-SIMULATED'));assert.ok(s.includes('persisted'));assert.ok(s.includes("mode:'durable'"));});
test('refund endpoint no longer throws after authorization',()=>{const s=read('app/api/payments/refund/route.ts');assert.ok(!s.includes("requirePermission(req,'orders:operate'); throw new AuthRequiredError"));});
test('critical fabric mutations require authorization',()=>{for(const f of ['app/api/fabric/action/route.ts','app/api/fabric/decision/route.ts','app/api/fabric/events/route.ts'])assert.ok(read(f).includes('requirePermission'));});
test('auth store has no process-local user/session maps',()=>{const s=read('modules/platform/auth/store.ts');assert.ok(!s.includes('new Map'));assert.ok(s.includes('trust_users'));assert.ok(s.includes('trust_sessions'));});
test('control state is durable',()=>{const s=read('modules/platform/admin/control.ts');assert.ok(s.includes('trust_admin_control_state'));assert.ok(!s.includes('let mode'));});
test('admin redirect target is constrained',()=>{const s=read('app/admin-login/page.tsx');assert.ok(s.includes("!rawNext.startsWith('//')"));assert.ok(s.includes("!rawNext.includes('://')"));});
test('admin MFA is represented in login UI and API',()=>{const page=read('app/admin-login/page.tsx');const api=read('app/api/admin/session/route.ts');assert.ok(page.includes('one-time-code'));assert.ok(api.includes('verifyTotp'));});
test('agent control no longer stores approvals/messages in process memory',()=>{const s=read('modules/agents/control-plane.ts');assert.ok(!s.includes('const approvals = new Map'));assert.ok(!s.includes('const messages: AgentMessage[]'));assert.ok(s.includes('trust_agent_approvals'));assert.ok(s.includes('trust_agent_messages'));});

test('operational job state is durable', () => {
  const jobs = read('modules/platform/jobs/index.ts');
  assert.equal(jobs.includes('const jobs:Job[]'), false);
  assert.equal(jobs.includes('trust_jobs'), true);
});

test('production readiness gate exists', () => {
  const gate = read('scripts/production_readiness.mjs');
  assert.equal(gate.includes('DATABASE_URL'), true);
  assert.equal(gate.includes('trust_jobs'), true);
  assert.equal(gate.includes('MANIFEST.json'), true);
});

test('current canonical runtime version is not stale', () => {
  const version = read('lib/runtime/version.ts');
  const pkg = JSON.parse(read('package.json'));
  const lock = JSON.parse(read('package-lock.json'));
  const runtime = version.match(/TRUST_RUNTIME_VERSION\s*=\s*['"](V\d+\.\d+\.\d+)['"]/)?.[1];
  assert.ok(runtime);
  assert.equal(`V${pkg.version}`, runtime);
  assert.equal(lock.version, pkg.version);
  assert.equal(lock.packages?.['']?.version, pkg.version);
  assert.doesNotMatch(version, /V102\.0\.0/);
});

test('durable jobs expose idempotency and lease semantics', () => {
  const migration = read('db/migrations/021_v131_operational_excellence.sql');
  const jobs = read('modules/platform/jobs/index.ts');
  assert.match(migration, /idempotency_key/);
  assert.match(migration, /locked_until/);
  assert.match(jobs, /on conflict \(idempotency_key\)/);
  assert.match(jobs, /skip locked/);
});
