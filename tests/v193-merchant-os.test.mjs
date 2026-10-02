import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('V193 adds deterministic Merchant OS health, priorities, and brief',()=>{const core=fs.readFileSync('modules/merchant-os/experience-2.ts','utf8');assert.match(core,/buildMerchantHealth/);assert.match(core,/buildMerchantPriorities/);assert.match(core,/buildMerchantBrief/);assert.match(core,/availability/);assert.match(core,/outOfStock/);});
test('V193 upgrades the merchant surface around existing authenticated APIs',()=>{const page=fs.readFileSync('app/merchant-os/page.tsx','utf8');for(const x of ['/api/merchant/overview','/api/merchant/products','/api/merchant/orders','/api/merchant/analytics','/api/merchant/inventory/bulk'])assert.match(page,new RegExp(x.replaceAll('/','\\/')));assert.match(page,/MERCHANT OS 2\.0/);assert.match(page,/COMMAND BRIEF/);assert.doesNotMatch(page,/\+12\.8%|\+8\.4%/);});
test('V193 keeps runtime metadata aligned',()=>{assert.match(fs.readFileSync('lib/runtime/version.ts','utf8'),/V\d+\.0\.0/);assert.equal(JSON.parse(fs.readFileSync('package.json')).version.match(/^\d+\.0\.0$/)?.[0],JSON.parse(fs.readFileSync('package.json')).version);});
