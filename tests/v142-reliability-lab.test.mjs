import test from 'node:test';
import assert from 'node:assert/strict';
import {generateCase,generateFaults,executeCase,shrinkFailure,replay} from '../modules/platform/reliability-lab/engine.ts';

test('generated cases are deterministic',()=>assert.deepEqual(generateCase(42,12),generateCase(42,12)));
test('fault injection produces executable failures',()=>{const ops=[{id:'1',kind:'OPEN'},{id:'2',kind:'PROCESS'},{id:'3',kind:'CLOSE'}];const r=executeCase(1,ops,[{at:1,kind:'THROW',operationId:'2'}]);assert.equal(r.status,'FAIL');assert.equal(r.failure,'INJECTED_THROW')});
test('shrinker finds a smaller reproducer',()=>{const ops=generateCase(7,30);const faults=[{at:0,kind:'THROW',operationId:ops[0].id}];const original=executeCase(7,ops,faults);const small=shrinkFailure(7,ops,faults);assert.equal(original.status,'FAIL');assert.equal(small.status,'FAIL');assert.ok(small.operations.length<=ops.length)});
test('replay reproduces fingerprint-equivalent failure state',()=>{const ops=[{id:'1',kind:'OPEN'},{id:'2',kind:'PROCESS'},{id:'3',kind:'CLOSE'}];const r=executeCase(99,ops,[{at:1,kind:'THROW',operationId:'2'}]);const replayed=replay(r);assert.equal(replayed.status,r.status);assert.equal(replayed.failure,r.failure)});
test('SLO impact is measurable',()=>{const r=executeCase(5,[{id:'1',kind:'OPEN'},{id:'2',kind:'PROCESS'}],[{at:1,kind:'DROP',operationId:'2'}]);assert.equal(r.status,'FAIL');assert.ok(r.slo.errorRate>0);assert.ok(r.slo.budgetConsumedPct>0)});

test('generated faults stay bound to known operations',()=>{const ops=generateCase(8,50);for(const f of generateFaults(8,ops,.5))assert.ok(ops.some(o=>o.id===f.operationId))});
