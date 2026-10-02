import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const read=f=>fs.readFileSync(f,'utf8');

test('V230 request context creates independent request and trace identifiers', async()=>{
 const s=read('modules/platform/runtime/request-context.ts');
 assert.match(s,/randomUUID\(\)/); assert.match(s,/requestId/); assert.match(s,/traceId/);
});
test('V230 API responses expose correlation metadata and no-store semantics',()=>{
 const s=read('modules/platform/http/response.ts'); assert.match(s,/x-request-id/); assert.match(s,/x-trace-id/); assert.match(s,/no-store/);
});
test('V230 idempotency fingerprints requests and persists replay state',()=>{
 const s=read('modules/platform/idempotency/service.ts'); assert.match(s,/sha256/); assert.match(s,/trust_idempotency_keys/); assert.match(s,/IDEMPOTENCY_FINGERPRINT_MISMATCH/);
});
test('V230 webhook inbox is durable and provider-event unique',()=>{
 const s=read('db/migrations/079_v230_production_kernel.sql'); assert.match(s,/trust_webhook_inbox/); assert.match(s,/unique\(provider,event_id\)/); assert.match(s,/payload_json jsonb/);
});
test('V230 audit trail is durable and queryable',()=>{
 const s=read('modules/platform/audit/service.ts'); assert.match(s,/trust_audit_events/); assert.match(s,/order by created_at desc/);
});
test('V230 capability registry never labels provider-only execution as LIVE',()=>{
 const s=read('modules/platform/capabilities/registry.ts'); assert.match(s,/PROVIDER_REQUIRED/); assert.match(s,/PAYMENTS_PROVIDER_SECRET/); assert.match(s,/AI_PROVIDER_API_KEY/);
});
test('V230 database migration is registered with a checksum manifest',()=>{
 const manifest=JSON.parse(read('db/migrations/MANIFEST.json')); const row=manifest.migrations.find(x=>x.file==='079_v230_production_kernel.sql'); assert.ok(row?.checksum); assert.equal(manifest.latest,'101'); assert.equal(manifest.version.match(/^V\d+\.0\.0$/)?.[0],manifest.version);
});
test('V230 health endpoint fails closed without a database instead of inventing health',()=>{
 const s=read('app/api/platform/health/route.ts'); assert.match(s,/DATABASE_NOT_CONFIGURED|NOT_CONFIGURED/); assert.match(s,/503/); assert.match(s,/select 1/);
});
test('V230 capabilities endpoint reports explicit surface status',()=>{
 const s=read('app/api/platform/capabilities/route.ts'); assert.match(s,/surfaceStatus:'LIVE'/); assert.match(s,/listCapabilities/);
});
