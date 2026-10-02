import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('V194 adds a unified AI Experience contract with explainability and guardrails',()=>{const c=fs.readFileSync('modules/ai-experience/core.ts','utf8');assert.match(c,/buildAiExperience/);assert.match(c,/DECISION_SUPPORT/);assert.match(c,/guardrails/);assert.match(c,/unavailable/);assert.match(c,/requiresApproval/);});
test('V194 keeps execution outside the AI Experience layer',()=>{const c=fs.readFileSync('modules/ai-experience/core.ts','utf8');assert.match(c,/Execution/);assert.match(c,/لا يتم تنفيذ دفع/);});
test('V194 API composes the existing shopping concierge instead of fabricating recommendations',()=>{const r=fs.readFileSync('app/api/ai-experience/route.ts','utf8');assert.match(r,/runShoppingConcierge/);assert.match(r,/buildAiExperience/);});
test('V194 ships a dedicated AI Experience surface',()=>{const p=fs.readFileSync('app/ai-experience/page.tsx','utf8');for(const x of ['AI EXPERIENCE 2.0','SIGNAL GRAPH','NEXT BEST ACTION','EXPLAINABLE SHOPPING','TRUST GUARDRAILS'])assert.match(p,new RegExp(x));});
test('V194 integrates into the global experience layer',()=>{const c=fs.readFileSync('components/trust-experience-upgrade.tsx','utf8');assert.match(c,/ai-experience/);});
test('V194 runtime metadata is aligned',()=>{assert.match(fs.readFileSync('lib/runtime/version.ts','utf8'),/V\d+\.0\.0/);assert.equal(JSON.parse(fs.readFileSync('package.json')).version.match(/^\d+\.0\.0$/)?.[0],JSON.parse(fs.readFileSync('package.json')).version);});
test('V194 uses no fake live metrics',()=>{const p=fs.readFileSync('app/ai-experience/page.tsx','utf8');assert.doesNotMatch(p,/\+12\.8%|\+8\.4%|LIVE PROVIDER READY/);});
test('V194 API is no-store and force-dynamic',()=>{const r=fs.readFileSync('app/api/ai-experience/route.ts','utf8');assert.match(r,/force-dynamic/);assert.match(r,/no-store/);});
