import test from 'node:test'; import assert from 'node:assert/strict';
const mod=await import('../modules/platform/trust-commerce-network/core.ts');
test('tier recommendation is deterministic',()=>{assert.equal(mod.recommendTier({orders:0,repeatRate:0,monthlySpend:0}),'FREE');assert.equal(mod.recommendTier({orders:4,repeatRate:42,monthlySpend:2200}),'PLUS');assert.equal(mod.recommendTier({orders:10,repeatRate:70,monthlySpend:7000}),'PRO')});
test('network plan has explainable opportunities',()=>{const p=mod.buildNetworkPlan({orders:4,repeatRate:42,monthlySpend:2200,problems:1,catalogSize:60});assert.equal(p.version,'V208');assert.ok(p.opportunities.length>=4);assert.ok(p.opportunities.every(x=>x.reason&&x.action));});
test('no fake monetary promises',()=>{const p=mod.buildNetworkPlan({orders:8,repeatRate:60,monthlySpend:5000});assert.ok(p.guardrails.some(x=>x.includes('اختراع توفير')));assert.ok(p.unavailable.some(x=>x.includes('cashback')));});
test('scores are bounded',()=>{const p=mod.buildNetworkPlan({orders:999,repeatRate:999,monthlySpend:999999,problems:99,catalogSize:99});assert.ok(p.opportunities.every(x=>x.score>=0&&x.score<=100));});
