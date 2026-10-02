import test from 'node:test';
import assert from 'node:assert/strict';
import {runAutonomousCommerceRuntime} from '../modules/platform/autonomous-commerce-runtime/index.ts';

test('V213 never dispatches an approval-required intent',async()=>{
 const now='2026-09-06T12:00:00.000Z';
 const events=[{eventId:'e1',type:'STOCK_CHANGED',occurredAt:now,tenantId:'t',aggregateId:'p1',version:1,payload:{stock:1,threshold:5},idempotencyKey:'k1'}];
 const s=await runAutonomousCommerceRuntime(events,now,{tenantId:'t',enabled:true,maxRisk:60,minConfidence:80,autoActions:[]});
 assert.equal(s.version,'V213'); assert.equal(s.dispatches[0].status,'APPROVAL_REQUIRED');
});

test('V213 executes only through an explicitly injected adapter',async()=>{
 const now='2026-09-06T12:00:00.000Z';
 const adapter={name:'price-review',actions:['PRICE'],execute:async()=>({status:'SUCCESS',providerReference:'prov-1'})};
 const events=[{eventId:'e1',type:'PRICE_CHANGED',occurredAt:now,tenantId:'t',aggregateId:'p1',version:1,payload:{price:100},idempotencyKey:'k1'}];
 const s=await runAutonomousCommerceRuntime(events,now,{tenantId:'t',enabled:true,maxRisk:60,minConfidence:80,autoActions:['MARKET_REVIEW']},{adapter});
 assert.equal(s.dispatches[0].status,'EXECUTED'); assert.equal(s.dispatches[0].providerReference,'prov-1');
});

test('V213 reports missing adapters instead of fabricating provider success',async()=>{
 const now='2026-09-06T12:00:00.000Z';
 const events=[{eventId:'e1',type:'PRICE_CHANGED',occurredAt:now,tenantId:'t',aggregateId:'p1',version:1,payload:{price:100},idempotencyKey:'k1'}];
 const s=await runAutonomousCommerceRuntime(events,now,{tenantId:'t',enabled:true,maxRisk:60,minConfidence:80,autoActions:['MARKET_REVIEW']});
 assert.equal(s.dispatches[0].status,'NOT_DISPATCHED'); assert.match(s.dispatches[0].reason,/ADAPTER_NOT_FOUND_FOR_ACTION/);
});

test('V213 preserves idempotent runtime command identity',async()=>{
 const now='2026-09-06T12:00:00.000Z';
 const events=[{eventId:'e1',type:'PRICE_CHANGED',occurredAt:now,tenantId:'t',aggregateId:'p1',version:1,payload:{price:100},idempotencyKey:'k1'}];
 const policy={tenantId:'t',enabled:true,maxRisk:60,minConfidence:80,autoActions:['MARKET_REVIEW']};
 const a=await runAutonomousCommerceRuntime(events,now,policy); const b=await runAutonomousCommerceRuntime(events,now,policy);
 assert.equal(a.commands[0].commandId,b.commands[0].commandId); assert.equal(a.commands[0].idempotencyKey,b.commands[0].idempotencyKey);
});
