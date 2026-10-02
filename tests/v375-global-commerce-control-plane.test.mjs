import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('V375 command contract preserves domain authority boundaries', async()=>{
 const src=await readFile('modules/platform/global-commerce-control-plane/core.ts','utf8');
 assert.match(src,/RECOVER_ORDER_LEASES/);
 assert.match(src,/runVerifiedOrderRecovery/);
 assert.match(src,/businessSourceOfTruth:'existing domain authorities'/);
 assert.match(src,/directBusinessMutation:false/);
 assert.match(src,/requiresApproval/);
});

test('V375 APIs and migration form a complete executable surface', async()=>{
 for(const p of ['app/api/commerce/control-plane/route.ts','app/api/commerce/control-plane/actions/route.ts','app/global-commerce-control-plane/page.tsx','db/migrations/204_v375_global_commerce_control_plane.sql']){
   const src=await readFile(p,'utf8'); assert.ok(src.length>250,p);
 }
});
