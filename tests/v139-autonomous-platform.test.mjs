import test from 'node:test';
import assert from 'node:assert/strict';
import { fingerprintIdentity, assertIdentityFresh } from '../modules/platform/zero-trust/service-identity.ts';
import { CommandBus } from '../modules/platform/cqrs/command-bus.ts';
import { replayAggregate } from '../modules/platform/cqrs/aggregate.ts';
import { validateScenario, inject } from '../modules/platform/chaos/scenarios.ts';
import { fingerprintPlan } from '../modules/platform/chaos/fault-plan.ts';
import { startSpan, finishSpan } from '../modules/platform/tracing/otel-model.ts';
import { backoff, shouldRetry } from '../modules/platform/control-plane-v139/lease-recovery.ts';

test('zero-trust service identity is deterministic and time bounded',()=>{ const i={serviceId:'payments',tenantId:'t1',keyId:'k1',issuedAt:1000,expiresAt:5000,nonce:'n1'}; assert.match(fingerprintIdentity(i),/^[a-f0-9]{64}$/); assert.doesNotThrow(()=>assertIdentityFresh(i,3000)); assert.throws(()=>assertIdentityFresh(i,9000,0),/SERVICE_IDENTITY_EXPIRED/); });
test('CQRS command bus enforces context and versioned handlers',async()=>{ const b=new CommandBus(); b.register('order.capture',2,c=>({ok:true,id:c.commandId})); assert.deepEqual(await b.dispatch({name:'order.capture',version:2,tenantId:'t1',actorId:'a1',commandId:'c1',correlationId:'x1',payload:{}}),{ok:true,id:'c1'}); await assert.rejects(()=>b.dispatch({name:'order.capture',version:1,tenantId:'t1',actorId:'a1',commandId:'c2',correlationId:'x1',payload:{}}),/COMMAND_HANDLER_NOT_FOUND/); });
test('aggregate replay rejects version gaps',()=>{ const reducer=(s,e)=>s+(e.payload.n); assert.equal(replayAggregate([{type:'a',version:1,payload:{n:2}},{type:'b',version:2,payload:{n:3}}],0,reducer),5); assert.throws(()=>replayAggregate([{type:'a',version:2,payload:{n:2}}],0,reducer),/AGGREGATE_VERSION_GAP/); });
test('chaos plans are bounded and deterministic',()=>{ const s=validateScenario({id:'timeout-1',target:'checkout',fault:'timeout',probability:1}); assert.throws(()=>inject(s,1,()=>0),/CHAOS_TIMEOUT/); const p={id:'checkout',version:1,scenarios:[s]}; assert.match(fingerprintPlan(p),/^[a-f0-9]{64}$/); });
test('trace spans preserve parent context and lifecycle',()=>{ const s=startSpan('t','s','checkout','root'); const f=finishSpan(s,'OK',s.startTime+20); assert.equal(f.parentSpanId,'root'); assert.equal(f.endTime,s.startTime+20); });
test('recovery backoff is capped and attempts are bounded',()=>{ const p={maxAttempts:4,baseDelayMs:100,maxDelayMs:500}; assert.equal(backoff(1,p),100); assert.equal(backoff(4,p),500); assert.equal(shouldRetry(3,p),true); assert.equal(shouldRetry(4,p),false); });
