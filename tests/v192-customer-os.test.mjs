import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('V192 adds a deterministic Customer OS overview and unified timeline',()=>{
 const core=fs.readFileSync('modules/customer-os/experience-2.ts','utf8');
 assert.match(core,/buildCustomerOverview/); assert.match(core,/buildCustomerTimeline/); assert.match(core,/buildCustomerPriorities/); assert.match(core,/totalSpent/); assert.match(core,/activeReturns/);
});

test('V192 upgrades the Customer OS surface instead of creating fake backend state',()=>{
 const page=fs.readFileSync('app/customer-os/page.tsx','utf8');
 assert.match(page,/\/api\/customer\/profile/); assert.match(page,/\/api\/customer\/orders/); assert.match(page,/\/api\/returns/); assert.match(page,/\/api\/cart/); assert.match(page,/CUSTOMER OS 2\.0/); assert.match(page,/آخر النشاط/);
});

test('V192 keeps canonical runtime metadata aligned',()=>{
 assert.match(fs.readFileSync('lib/runtime/version.ts','utf8'),/V\d+\.0\.0/);
 assert.equal(JSON.parse(fs.readFileSync('package.json')).version.match(/^\d+\.0\.0$/)?.[0],JSON.parse(fs.readFileSync('package.json')).version);
});
