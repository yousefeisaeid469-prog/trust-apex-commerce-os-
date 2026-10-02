import test from 'node:test';
import assert from 'node:assert/strict';
import { acquireLease, assertFence } from '../modules/platform/distributed/fencing.ts';
import { appendEvent, verifyEventChain, replay } from '../modules/platform/distributed/event-log.ts';
import { runSaga } from '../modules/platform/distributed/saga.ts';
import { allowRequest, recordFailure, recordSuccess } from '../modules/platform/resilience/circuit-breaker.ts';
import { assertCommandIdentity } from '../modules/platform/distributed/command-dedupe.ts';

test('fencing tokens reject stale writers',()=>{
  const first=acquireLease(undefined,'inventory:sku-1','worker-a',1000,5000);
  const second=acquireLease({...first,expiresAt:900},'inventory:sku-1','worker-b',1000,5000);
  assert.equal(second.token,2);
  assert.throws(()=>assertFence(second,first.token,1000),/STALE_FENCE_TOKEN/);
});

test('event log forms tamper-evident hash chain and replays',()=>{
  let log=[];
  log.push(appendEvent(log,{eventId:'e1',aggregateId:'o1',tenantId:'t1',type:'created',version:1,occurredAt:'2026-01-01T00:00:00Z',correlationId:'c1',payload:{n:1}}));
  log.push(appendEvent(log,{eventId:'e2',aggregateId:'o1',tenantId:'t1',type:'incremented',version:1,occurredAt:'2026-01-01T00:00:01Z',correlationId:'c1',payload:{n:2}}));
  assert.deepEqual(verifyEventChain(log),{ok:true});
  assert.equal(replay(log,'o1',(state,event)=>state+event.payload.n,0),3);
  const tampered=log.map(x=>({...x})); tampered[1].payload={n:999};
  assert.equal(verifyEventChain(tampered).ok,false);
});

test('saga compensates completed steps in reverse order',async()=>{
  const calls=[];
  const result=await runSaga([{id:'reserve',execute:()=>calls.push('reserve'),compensate:()=>calls.push('release')},{id:'charge',execute:()=>calls.push('charge'),compensate:()=>calls.push('refund')},{id:'ship',execute:()=>{throw new Error('carrier-down')}}]);
  assert.equal(result.ok,false); assert.deepEqual(calls,['reserve','charge','refund','release']);
});

test('circuit breaker opens and probes after cooldown',()=>{
  const c={state:'CLOSED',failures:0}; for(let i=0;i<5;i++) recordFailure(c,5,1000); assert.equal(c.state,'OPEN'); assert.equal(allowRequest(c,2000,3000),false); assert.equal(allowRequest(c,5000,3000),true); recordSuccess(c); assert.equal(c.state,'CLOSED');
});

test('commands require distributed identity',()=>{ const fp=assertCommandIdentity({commandId:'cmd-1',tenantId:'t1',actorId:'a1',name:'order.capture',version:1,payload:{orderId:'o1'},correlationId:'c1'}); assert.match(fp,/^[a-f0-9]{64}$/); assert.throws(()=>assertCommandIdentity({commandId:'',tenantId:'t1',actorId:'a1',name:'x',version:1,payload:{},correlationId:'c'}),/COMMAND_IDENTITY_REQUIRED/); });
