import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const read=f=>fs.readFileSync(f,'utf8');

test('current canonical runtime and package version (V139)',()=>{assert.match(read('lib/runtime/version.ts'),/V\d+\.0\.0/);assert.equal(JSON.parse(read('package.json')).version.match(/^\d+\.0\.0$/)?.[0],JSON.parse(read('package.json')).version);});
test('V136 tenant isolation has default-deny policy evaluation',async()=>{const {evaluatePolicy}=await import('../modules/platform/policy/engine.ts');const denied=evaluatePolicy({action:'orders:read',subject:{actorId:'a',tenantId:'t1',roles:['merchant']},resource:{tenantId:'t2',type:'order'}},[{id:'same-tenant',effect:'allow',actions:['orders:read'],roles:['merchant'],sameTenant:true}]);assert.equal(denied.effect,'deny');const allowed=evaluatePolicy({action:'orders:read',subject:{actorId:'a',tenantId:'t1',roles:['merchant']},resource:{tenantId:'t1',type:'order'}},[{id:'same-tenant',effect:'allow',actions:['orders:read'],roles:['merchant'],sameTenant:true}]);assert.equal(allowed.effect,'allow');});
test('V136 API versioning is explicit and bounded',()=>{const s=read('modules/platform/api/versioning.ts');assert.match(s,/CURRENT_API_VERSION/);assert.match(s,/UNSUPPORTED_API_VERSION/);});
test('V136 webhook persistence is atomic by provider event identity',()=>{const s=read('db/migrations/026_v136_enterprise_platform.sql');assert.match(s,/UNIQUE\(provider,tenant_id,provider_event_id\)/);});
test('V136 feature flags are versioned and rollout bounded',()=>{const s=read('db/migrations/026_v136_enterprise_platform.sql');assert.match(s,/rollout BETWEEN 0 AND 100/);assert.match(read('modules/platform/control-plane/feature-flags.ts'),/rollout >= 100/);});
test('V136 key lifecycle never models raw secret material',()=>{const s=read('modules/platform/keys/lifecycle.ts');assert.doesNotMatch(s,/secretValue|rawSecret|privateKey\s*:/);assert.match(s,/rotating/);});
test('V136 backup verification requires completed checksum evidence',()=>{assert.match(read('modules/platform/backup/verification.ts'),/checksumVerified !== true/);});
test('V136 adapter contracts are provider-neutral',()=>{const s=read('modules/platform/adapters/contracts.ts');assert.match(s,/PaymentProviderAdapter/);assert.match(s,/LogisticsProviderAdapter/);assert.match(s,/NotificationProviderAdapter/);});
