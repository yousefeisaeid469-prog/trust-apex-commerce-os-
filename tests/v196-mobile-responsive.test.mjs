import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read=p=>fs.readFileSync(p,'utf8');

test('V196 defines a deterministic mobile experience policy',()=>{
  const c=read('modules/experience/mobile/contracts.ts');
  for(const x of ['minTouchTargetPx','mobileBottomNavHeightPx','safeAreaAware','reducedMotionAware','classifyViewport','clampTouchTarget']) assert.match(c,new RegExp(x));
  assert.match(c,/44/);
});

test('V196 hardens global CSS for safe areas and dynamic mobile viewport',()=>{
  const c=read('app/globals.css');
  for(const x of ['env\(safe-area-inset-bottom','100dvh','touch-action:manipulation','overflow-wrap:anywhere','min-height:44px']) assert.match(c,new RegExp(x.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')));
  assert.match(c,/max-width:767px/);
});

test('V196 exposes a mobile viewport contract at the root',()=>{
  const c=read('app/layout.tsx');
  assert.match(c,/viewport/);
  assert.match(c,/device-width/);
});

test('V196 keeps shared mobile navigation safe-area aware',()=>{
  const c=read('app/globals.css');
  assert.match(c,/mobile-quick-nav/);
  assert.match(c,/padding-bottom:calc\(/);
});

test('V196 documentation states honest production boundaries',()=>{
  const c=read('docs/architecture/MOBILE-RESPONSIVE-V196.md');
  assert.match(c,/does not invent backend capabilities/);
  assert.match(c,/does not claim measured field performance/);
});
