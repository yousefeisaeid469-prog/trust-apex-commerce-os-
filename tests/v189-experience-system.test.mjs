import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('V189 upgrades global experience chrome',()=>{
  const component=fs.readFileSync('components/trust-experience-upgrade.tsx','utf8');
  const css=fs.readFileSync('app/globals.css','utf8');
  assert.match(component,/TRUST COMMAND/);
  assert.match(component,/ArrowDown/);
  assert.match(component,/ArrowUp/);
  assert.match(component,/Purchase Guardian/);
  assert.match(css,/prefers-reduced-motion/);
  assert.match(css,/mobile-quick-nav/);
  assert.match(css,/focus-visible/);
});

test('V189 runtime version is canonical',()=>{
  assert.equal(fs.readFileSync('lib/runtime/version.ts','utf8').match(/V\d+\.0\.0/)!==null,true);
  const pkg=JSON.parse(fs.readFileSync('package.json','utf8'));
  assert.match(pkg.version,/^\d+\.0\.0$/);
});
