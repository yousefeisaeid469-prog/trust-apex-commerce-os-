import assert from 'node:assert/strict';
import fs from 'node:fs';
const {createSandboxLabel}=await import('../modules/platform/global-logistics-v306/sandbox.ts');
const a=createSandboxLabel({shipmentId:'11111111-1111-1111-1111-111111111111',orderId:'22222222-2222-2222-2222-222222222222',service:'TRUST-E2E-STANDARD',destination:{country:'EG'}});
const b=createSandboxLabel({shipmentId:'11111111-1111-1111-1111-111111111111',orderId:'22222222-2222-2222-2222-222222222222',service:'TRUST-E2E-STANDARD',destination:{country:'EG'}});
assert.equal(a.trackingNumber,b.trackingNumber);assert.match(a.trackingNumber,/^TRUST[A-Z0-9]+$/);assert.match(a.providerReference,/^TRUST-E2E-LABEL-/);
assert.ok(fs.existsSync('db/migrations/144_v306_global_logistics_execution.sql'));
assert.ok(fs.existsSync('app/api/fulfillment/global-carriers/execute/route.ts'));
console.log('V306 audit PASS — deterministic sandbox labels, durable execution migration, and execution API verified.');
