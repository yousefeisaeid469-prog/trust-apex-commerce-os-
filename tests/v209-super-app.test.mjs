import test from 'node:test';
import assert from 'node:assert/strict';
import {buildSuperAppPlan} from '../modules/platform/super-app-experience/core.ts';

test('V209 creates one navigable commerce surface',()=>{const p=buildSuperAppPlan({orders:4,repeatRate:42,problems:1,catalogSize:60,isSeller:true});assert.equal(p.version,'V209');assert.equal(p.surfaces.find(x=>x.id==='HOME').enabled,true);assert.ok(p.actions.some(x=>x.surface==='AI'));assert.ok(p.actions.some(x=>x.surface==='PROTECTION'));assert.ok(p.actions.some(x=>x.surface==='SELLER'));});
test('V209 never marks missing evidence as an executed financial action',()=>{const p=buildSuperAppPlan();assert.ok(p.actions.every(x=>x.requiresApproval===false));assert.ok(p.trustPrinciples.some(x=>x.includes('العمليات المالية')));assert.ok(p.unavailable.some(x=>x.includes('مزودي خدمات')));});
test('V209 disables context-dependent surfaces when evidence is absent',()=>{const p=buildSuperAppPlan({orders:0,repeatRate:0,problems:0,catalogSize:0});assert.equal(p.surfaces.find(x=>x.id==='SHOP').enabled,false);assert.equal(p.surfaces.find(x=>x.id==='ORDERS').enabled,false);assert.equal(p.surfaces.find(x=>x.id==='PROTECTION').enabled,false);});
