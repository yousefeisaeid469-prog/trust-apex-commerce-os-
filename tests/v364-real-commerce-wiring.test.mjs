import test from 'node:test';
import assert from 'node:assert/strict';
import { consumerFor, listConsumerDefinitions } from '../modules/platform/commerce-events/contracts.ts';
import { buildGrowthNetwork } from '../modules/platform/growth-network/core.ts';
import { buildGlobalCommerceGraph } from '../modules/platform/global-commerce-graph/core.ts';
import { buildRevenueAutopilotPlan } from '../modules/platform/revenue-autopilot/index.ts';
import { deriveCommerceBrain } from '../modules/platform/commerce-brain/core.ts';

test('V364 registers intelligence as a real commerce consumer',()=>{
  const d=consumerFor('commerce-intelligence');
  assert.equal(d.module,'modules/commerce/consumers/intelligence.ts');
  assert.ok(listConsumerDefinitions().some(x=>x.id==='autonomous-commerce-orchestrator'));
});

test('V364 restored modules consume real commerce-shaped data',()=>{
  const orders=[{id:'o1',customerId:'c1',status:'delivered',total:100,items:[{productId:'p1',qty:1},{productId:'p2',qty:1}]},{id:'o2',customerId:'c1',status:'delivered',total:200,items:[{productId:'p1',qty:1}]}];
  const products=[{id:'p1',name:'A',price:100,stock:3},{id:'p2',name:'B',price:50,stock:2}];
  assert.equal(buildGrowthNetwork({products,orders}).repeatCustomers,1);
  assert.ok(buildGlobalCommerceGraph({products,orders}).edges.some(x=>x.type==='CO_PURCHASED'));
  assert.ok(buildRevenueAutopilotPlan({}).length>=5);
  assert.equal(deriveCommerceBrain([{eventId:'e1',type:'STOCK_CHANGED',occurredAt:new Date().toISOString(),idempotencyKey:'k',payload:{stock:1}}],new Date().toISOString()).signals.length,1);
});
