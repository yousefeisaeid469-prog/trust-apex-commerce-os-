import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read=p=>fs.readFileSync(p,'utf8');

test('V195 ships shared design-system primitives for loading, empty and error states',()=>{
  const c=read('components/trust-design-system.tsx');
  for(const x of ['TrustSection','TrustSkeleton','TrustEmpty','TrustError']) assert.match(c,new RegExp(x));
});

test('V195 adds explicit performance budgets without inventing runtime metrics',()=>{
  const c=read('lib/performance/experience.ts');
  assert.match(c,/firstContentfulPaintMs/); assert.match(c,/largestContentfulPaintMs/); assert.match(c,/withinPerformanceBudget/);
  assert.doesNotMatch(c,/LIVE|percent|\+\d/);
});

test('V195 global CSS adds resilient surface primitives and content-visibility',()=>{
  const c=read('app/globals.css');
  for(const x of ['.trust-section','.trust-skeleton','.trust-empty','.trust-error','content-visibility:auto']) assert.match(c,new RegExp(x.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')));
});

test('V195 improves image loading semantics on customer OS',()=>{
  const p=read('app/customer-os/page.tsx');
  assert.match(p,/loading="lazy"/); assert.match(p,/decoding="async"/);
});

test('V195 global layout advertises current version and rendering priorities',()=>{
  const l=read('app/layout.tsx');
  assert.match(l,/V196/); assert.match(l,/preconnect/);
});

test('V195 runtime metadata is aligned',()=>{
  assert.match(read('lib/runtime/version.ts'),/V\d+\.0\.0/);
  assert.equal(JSON.parse(read('package.json')).version.match(/^\d+\.0\.0$/)?.[0],JSON.parse(read('package.json')).version);
});

test('V195 experience shell keeps accessibility and reduced-motion behavior',()=>{
  const c=read('components/trust-experience-upgrade.tsx');
  assert.match(c,/skip-link/); assert.match(read('app/globals.css'),/prefers-reduced-motion/);
});
