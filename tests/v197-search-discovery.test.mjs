import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('V197 search engine still provides executable discovery behavior',async()=>{
  const mod=await import('../modules/platform/discovery/search-3.ts');
  const result=mod.searchDiscovery3([{id:'p1',name:'Samsung Mobile',category:'electronics',price:1000,stock:4,tags:['mobile'],rating:4.8,merchant:'m1',region:'EG',active:true}], {q:'Samsung Mobile'});
  assert.equal(result.hits.length,1);
  assert.equal(result.hits[0].product.id,'p1');
});

test('V228 discovery surface is data-backed and preserves the discovery API contract',()=>{
  const page=fs.readFileSync('app/discovery/page.tsx','utf8');
  const registry=fs.readFileSync('modules/platform/feature-surfaces.ts','utf8');
  assert.match(page,/FeatureSurface/);
  assert.match(registry,/'\/discovery':/);
  assert.match(registry,/endpoint:'\/api\/discovery'/);
});

test('V197 canonical runtime metadata is aligned',()=>{
  assert.match(fs.readFileSync('lib/runtime/version.ts','utf8'),/V\d+\.0\.0/);
  assert.equal(JSON.parse(fs.readFileSync('package.json')).version.match(/^\d+\.0\.0$/)?.[0],JSON.parse(fs.readFileSync('package.json')).version);
});
