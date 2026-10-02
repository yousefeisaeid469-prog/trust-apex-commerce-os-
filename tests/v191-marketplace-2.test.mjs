import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('V191 introduces deterministic marketplace ranking with transparent reasons',()=>{
  const core=fs.readFileSync('modules/marketplace/experience-2.ts','utf8');
  assert.match(core,/rankMarketplaceProducts/);
  assert.match(core,/match/);
  assert.match(core,/reasons/);
  assert.match(core,/query/);
  assert.match(core,/maxPrice/);
});

test('V191 wires marketplace ranking into the main shopping shell',()=>{
  const shell=fs.readFileSync('components/trust-os-shell.tsx','utf8');
  assert.match(shell,/rankMarketplaceProducts/);
  assert.match(shell,/TRUST Match/);
});

test('V191 keeps canonical runtime metadata aligned',()=>{
  assert.equal(fs.readFileSync('lib/runtime/version.ts','utf8').match(/V\d+\.0\.0/)!==null,true);
  assert.equal(JSON.parse(fs.readFileSync('package.json')).version.match(/^\d+\.0\.0$/)?.[0],JSON.parse(fs.readFileSync('package.json')).version);
});
