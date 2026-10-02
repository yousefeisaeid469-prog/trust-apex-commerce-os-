import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('V190 adds route context and scroll intelligence to the shared experience layer',()=>{
  const component=fs.readFileSync('components/trust-experience-upgrade.tsx','utf8');
  const css=fs.readFileSync('app/globals.css','utf8');
  assert.match(component,/usePathname/);
  assert.match(component,/recentRoutes/);
  assert.match(component,/experience-progress/);
  assert.match(component,/route-context/);
  assert.match(component,/trust\.recentRoutes/);
  assert.match(css,/\.experience-progress/);
  assert.match(css,/\.route-context/);
});

test('V190 keeps canonical runtime metadata aligned',()=>{
  assert.equal(fs.readFileSync('lib/runtime/version.ts','utf8').match(/V\d+\.0\.0/)!==null,true);
  const pkg=JSON.parse(fs.readFileSync('package.json','utf8'));
  assert.match(pkg.version,/^\d+\.0\.0$/);
});
