import test from 'node:test';
import assert from 'node:assert/strict';
import {runControlPlaneCycle} from '../modules/platform/autonomous-commerce-control-plane/core.ts';

test('V212 turns brain signals into policy-aware decisions without side effects',()=>{
 const now='2026-09-06T12:00:00.000Z';
 const events=[{eventId:'e1',type:'STOCK_CHANGED',occurredAt:now,tenantId:'t',aggregateId:'p1',version:1,payload:{stock:1,threshold:5},idempotencyKey:'k1'}];
 const s=runControlPlaneCycle(events,now,{tenantId:'t',enabled:true,maxRisk:60,minConfidence:80,autoActions:[]});
 assert.equal(s.version,'V212'); assert.equal(s.decisions[0].status,'APPROVAL_REQUIRED'); assert.equal(s.executionIntents[0].status,'PENDING_APPROVAL'); assert.equal(s.reconciliation[0].expected,'NO_EXTERNAL_SIDE_EFFECT');
});

test('V212 authorizes only explicitly allowlisted autonomous actions',()=>{
 const now='2026-09-06T12:00:00.000Z';
 const e={eventId:'e1',type:'PRICE_CHANGED',occurredAt:now,tenantId:'t',aggregateId:'p1',version:1,payload:{price:100},idempotencyKey:'k1'};
 const s=runControlPlaneCycle([e],now,{tenantId:'t',enabled:true,maxRisk:60,minConfidence:80,autoActions:['MARKET_REVIEW']});
 assert.equal(s.decisions[0].status,'AUTHORIZED'); assert.equal(s.executionIntents[0].status,'READY'); assert.equal(s.reconciliation[0].status,'AWAITING_PROVIDER');
});

test('V212 blocks decisions above risk or below confidence policy',()=>{
 const now='2026-09-06T12:00:00.000Z';
 const e={eventId:'e1',type:'PROBLEM_CREATED',occurredAt:now,tenantId:'t',aggregateId:'pr1',version:1,payload:{type:'DELIVERY'},idempotencyKey:'k1'};
 const s=runControlPlaneCycle([e],now,{tenantId:'t',enabled:true,maxRisk:20,minConfidence:99,autoActions:[]});
 assert.equal(s.decisions[0].status,'BLOCKED'); assert.equal(s.executionIntents[0].status,'BLOCKED'); assert.equal(s.reconciliation[0].expected,'NO_EXTERNAL_SIDE_EFFECT');
});

test('V212 does not learn from stale UNKNOWN signals',()=>{
 const old='2026-09-06T11:00:00.000Z'; const now='2026-09-06T12:00:00.000Z';
 const e={eventId:'e1',type:'PROBLEM_CREATED',occurredAt:old,tenantId:'t',aggregateId:'pr1',version:1,payload:{type:'DELIVERY'},idempotencyKey:'k1'};
 const s=runControlPlaneCycle([e],now); assert.ok(s.learning.some(x=>x.outcome==='RECALIBRATE')); assert.equal(s.decisions.length,0);
});
