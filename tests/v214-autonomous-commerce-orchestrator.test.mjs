import test from 'node:test';
import assert from 'node:assert/strict';
import {AutonomousCommerceOrchestrator} from '../modules/platform/autonomous-commerce-orchestrator/index.ts';

test('V214 routes a commerce event through Fabric → Brain → Control Plane → Runtime',async()=>{
 const o=new AutonomousCommerceOrchestrator(); const r=await o.ingest({eventId:'e1',tenantId:'t',type:'PRICE_CHANGED',aggregateId:'p1',sequence:1,occurredAt:Date.now(),payload:{price:100}},{tenantId:'t',enabled:true,maxRisk:60,minConfidence:80,autoActions:['MARKET_REVIEW']});
 assert.equal(r.runtime.version,'V213'); assert.equal(r.deliveries[0].status,'PROCESSED'); assert.equal(r.runtime.dispatches[0].status,'NOT_DISPATCHED');
});

test('V214 preserves event idempotency inside one orchestrator instance',async()=>{const o=new AutonomousCommerceOrchestrator();const e={eventId:'e1',tenantId:'t',type:'PRICE_CHANGED',aggregateId:'p1',sequence:1,occurredAt:Date.now(),payload:{price:100}};const a=await o.ingest(e);const b=await o.ingest(e);assert.equal(a.event.eventId,b.event.eventId);assert.equal(o.snapshot().accepted,1)});

test('V214 never dispatches approval-required work',async()=>{const o=new AutonomousCommerceOrchestrator();const r=await o.ingest({eventId:'e2',tenantId:'t',type:'PRICE_CHANGED',aggregateId:'p2',sequence:1,occurredAt:Date.now(),payload:{price:90}},{tenantId:'t',enabled:true,maxRisk:60,minConfidence:80,autoActions:[]});assert.equal(r.runtime.dispatches[0].status,'APPROVAL_REQUIRED')});

test('V214 can pass an explicit adapter through the runtime boundary',async()=>{const o=new AutonomousCommerceOrchestrator();const adapter={name:'price-provider',actions:['PRICE'],execute:async()=>({status:'SUCCESS',providerReference:'p-214'})};const r=await o.ingest({eventId:'e3',tenantId:'t',type:'PRICE_CHANGED',aggregateId:'p3',sequence:1,occurredAt:Date.now(),payload:{price:80}},{tenantId:'t',enabled:true,maxRisk:60,minConfidence:80,autoActions:['MARKET_REVIEW']},{runtime:{adapter}});assert.equal(r.runtime.dispatches[0].status,'EXECUTED');assert.equal(r.runtime.dispatches[0].providerReference,'p-214')});
