import test from 'node:test';
import assert from 'node:assert/strict';
import {generateCase,executeCase,replay} from '../modules/platform/reliability-lab/engine.ts';
import {evaluateReleaseGate} from '../modules/platform/reliability-control-plane/gate.ts';
import {DEFAULT_RELIABILITY_POLICY} from '../modules/platform/reliability-control-plane/policy.ts';
import {failureHash,classifyFailure,isKnownFailure} from '../modules/platform/reliability-control-plane/corpus.ts';
import {runContinuousReliability} from '../modules/platform/reliability-control-plane/continuous.ts';

test('release gate passes healthy evidence',()=>{const r=executeCase(1,[{id:'1',kind:'OPEN'}],[]);const v=evaluateReleaseGate(DEFAULT_RELIABILITY_POLICY,{result:r,replayStatus:'PASS',knownFailure:false});assert.equal(v.status,'PASS')});
test('release gate blocks new failures',()=>{const r=executeCase(2,[{id:'1',kind:'OPEN'}],[{at:0,kind:'THROW',operationId:'1'}]);const v=evaluateReleaseGate(DEFAULT_RELIABILITY_POLICY,{result:r,replayStatus:'PASS',knownFailure:false});assert.equal(v.status,'BLOCK');assert.ok(v.reasons.includes('NEW_FAILURE'))});
test('release gate blocks replay mismatch',()=>{const r=executeCase(3,[{id:'1',kind:'OPEN'}],[]);const v=evaluateReleaseGate(DEFAULT_RELIABILITY_POLICY,{result:r,replayStatus:'FAIL',knownFailure:false});assert.equal(v.status,'BLOCK');assert.ok(v.reasons.includes('REPLAY_MISMATCH'))});
test('known failures can be replayed without NEW_FAILURE blocker',()=>{const r=executeCase(4,[{id:'1',kind:'OPEN'}],[{at:0,kind:'THROW',operationId:'1'}]);const h=failureHash(r);const v=evaluateReleaseGate(DEFAULT_RELIABILITY_POLICY,{result:r,replayStatus:'PASS',knownFailure:isKnownFailure(h,new Set([h]))});assert.equal(v.status,'BLOCK');assert.ok(!v.reasons.includes('NEW_FAILURE'))});
test('failure corpus classification is fingerprint stable',()=>{const ops=generateCase(7,4);const r=executeCase(7,ops,[{at:0,kind:'THROW',operationId:ops[0].id}]);const rr=replay(r);const a=classifyFailure(r,rr.fingerprint);const b=classifyFailure(r,rr.fingerprint);assert.equal(a.failureHash,b.failureHash);assert.equal(a.replayMatches,true)});
test('continuous control plane returns deterministic structural verdict',()=>{const a=runContinuousReliability('c1',143143);const b=runContinuousReliability('c1',143143);assert.equal(a.seed,b.seed);assert.equal(a.verdict.status,b.verdict.status);assert.equal(a.failureHash,b.failureHash);assert.equal(a.replayMatches,true)});
