import test from 'node:test';
import assert from 'node:assert/strict';
import {calibrate,evaluateLearning,recommendAutonomy,compareLearning} from '../modules/platform/learning-loop/core.ts';
const predictions=[
 {predictionId:'p1',tenantId:'t1',decisionId:'d1',metric:'sales',predicted:100,confidenceBps:9000,createdAt:1},
 {predictionId:'p2',tenantId:'t1',decisionId:'d2',metric:'sales',predicted:200,confidenceBps:8000,createdAt:2},
 {predictionId:'x',tenantId:'t2',decisionId:'d3',metric:'sales',predicted:999,confidenceBps:9000,createdAt:3}
];
const outcomes=[{predictionId:'p1',tenantId:'t1',observed:110,observedAt:4,status:'OBSERVED'},{predictionId:'p2',tenantId:'t1',observed:190,observedAt:5,status:'OBSERVED'},{predictionId:'x',tenantId:'t2',observed:1,observedAt:6,status:'OBSERVED'}];
test('calibrates predictions with tenant isolation',()=>{const c=calibrate(predictions,outcomes,'t1');assert.equal(c.length,2);assert.equal(c[0].absoluteError,10);});
test('missing outcomes remain explicit',()=>{const c=calibrate(predictions,[],'t1');assert.equal(c[0].status,'MISSING');});
test('learning report is deterministic in metrics',()=>{const r=evaluateLearning(predictions,outcomes,'t1',10);assert.equal(r.valid,2);assert.equal(r.meanAbsoluteError,10);assert.equal(r.meanSignedError,0);assert.equal(r.recommendation,'HOLD');});
test('autonomy lowers on drift or error',()=>{const r=evaluateLearning(predictions,outcomes,'t1',5);const next=recommendAutonomy(r,{currentLevel:'AUTO_EXECUTE',minConfidenceBps:7000,maxMeanAbsoluteError:20,maxDriftBps:1000});assert.equal(next,'APPROVAL_REQUIRED');});
test('autonomy raises only with sufficient clean evidence',()=>{const p=[...predictions,{predictionId:'p3',tenantId:'t1',decisionId:'d3',metric:'sales',predicted:300,confidenceBps:9500,createdAt:4}];const o=[...outcomes,{predictionId:'p3',tenantId:'t1',observed:300,observedAt:7,status:'OBSERVED'}];const r=evaluateLearning(p,o,'t1',20);const next=recommendAutonomy(r,{currentLevel:'APPROVAL_REQUIRED',minConfidenceBps:7000,maxMeanAbsoluteError:20,maxDriftBps:1000});assert.equal(next,'SUGGEST');});
test('comparison rejects cross-tenant reports',()=>{const a=evaluateLearning(predictions,outcomes,'t1',10);const b=evaluateLearning(predictions,outcomes,'t1',10);assert.equal(compareLearning(a,b).improved,false);assert.throws(()=>compareLearning(a,{...b,tenantId:'t2'}));});
