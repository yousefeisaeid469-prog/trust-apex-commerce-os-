import test from 'node:test';
import assert from 'node:assert/strict';
import {sequence} from '../modules/platform/verification/prng.ts';
import {assertInvariants,stableDigest} from '../modules/platform/verification/invariants.ts';
import {fuzzStateMachine} from '../modules/platform/verification/state-machine-fuzz.ts';
import {processWebhookStorm} from '../modules/platform/verification/webhook-storm.ts';
import {simulateLeaseLoss} from '../modules/platform/verification/lease-failure.ts';
import {verifyRecovery} from '../modules/platform/verification/recovery.ts';

test('deterministic PRNG is replayable and bounded',()=>{assert.deepEqual(sequence(42,8),sequence(42,8));assert.throws(()=>sequence(1,100001),/VERIFICATION_ITERATION_LIMIT/)});
test('invariants fail closed',()=>{assert.doesNotThrow(()=>assertInvariants({ok:true},[{name:'ok',check:x=>x.ok}]));assert.throws(()=>assertInvariants({ok:false},[{name:'ok',check:x=>x.ok}]),/INVARIANT_VIOLATION:ok/);assert.equal(stableDigest(['b','a']),stableDigest(['a','b']))});
test('state-machine fuzzing is deterministic',()=>{const m={state:'OPEN',terminal:['DONE','FAILED'],transitions:{OPEN:['PROCESS'],PROCESS:['DONE','FAILED']}};const a=fuzzStateMachine(m,7,20),b=fuzzStateMachine(m,7,20);assert.deepEqual(a,b);assert.equal(a.illegal,0)});
test('webhook replay storm deduplicates and detects sequence gaps',()=>{const r=processWebhookStorm([{provider:'p',eventId:'1',sequence:1,tenantId:'a'},{provider:'p',eventId:'1',sequence:1,tenantId:'a'},{provider:'p',eventId:'2',sequence:3,tenantId:'a'}]);assert.equal(r.accepted.length,2);assert.equal(r.duplicates.length,1);assert.equal(r.gaps,1)});
test('lease failure rejects stale fenced writes',()=>{const r=simulateLeaseLoss(9,[{worker:'new',token:9,action:'write'},{worker:'old',token:8,action:'write'}]);assert.equal(r[0].accepted,true);assert.equal(r[1].accepted,false);assert.equal(r[1].reason,'STALE_FENCE')});
test('recovery verification is fail-closed',()=>{assert.deepEqual(verifyRecovery([{name:'snapshot',ok:true},{name:'restore',ok:true}],['snapshot','restore']),{verified:true,steps:2});assert.throws(()=>verifyRecovery([{name:'snapshot',ok:true}],['snapshot','restore']),/RECOVERY_NOT_VERIFIED/)})
