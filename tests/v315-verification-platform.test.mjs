import assert from 'node:assert/strict';
import {FailureInjector,injectFailure} from '../modules/platform/v315/verification/failure-injection.ts';
import {replay} from '../modules/platform/v315/verification/replay.ts';
import {loadSummary} from '../modules/platform/v315/verification/load.ts';
import {aggregateEvidence} from '../modules/platform/v315/verification/evidence.ts';
import {sandboxPayment,sandboxCarrier} from '../modules/platform/v315/integrations/provider-sandbox.ts';
import {captureLedger,balanced} from '../modules/platform/v314/payments/core.ts';

const once=new FailureInjector().set({point:'PAYMENT_PROVIDER',mode:'ONCE'});
assert.throws(()=>injectFailure(once,'PAYMENT_PROVIDER',1,()=>true),/INJECTED_FAILURE/);
assert.equal(injectFailure(once,'PAYMENT_PROVIDER',2,()=>true),true);
const always=new FailureInjector().set({point:'CARRIER',mode:'ALWAYS'});assert.throws(()=>injectFailure(always,'CARRIER',1,()=>true),/INJECTED_FAILURE/);

const events=[{sequence:2,type:'CAPTURED',payload:{amount:100} ,at:'2026-09-10T00:00:02Z'},{sequence:1,type:'AUTHORIZED',payload:{amount:100},at:'2026-09-10T00:00:01Z'}];
const rr=replay(events,(state,event)=>({...state,last:event.type,amount:event.payload.amount}));assert.equal(rr.deterministic,true);assert.equal(rr.eventCount,2);assert.equal(rr.stateHash.length,64);

const load=loadSummary([{durationMs:40,ok:true},{durationMs:60,ok:true},{durationMs:100,ok:true},{durationMs:150,ok:false},{durationMs:80,ok:true}],{maxP95Ms:200,maxErrorRate:.25,minRequests:5});assert.equal(load.passed,true);assert.equal(load.requests,5);

const pay=sandboxPayment({id:'TRUST-E2E-PAY',currency:'USD',method:'card',available:true},{operation:'CAPTURE',idempotencyKey:'idem-1',amountMinor:1000n});assert.equal(pay.status,'SUCCEEDED');assert.equal(pay.providerReference.length,24);
const carrier=sandboxCarrier({carrierId:'TRUST-E2E',trackingSeed:'order-1|shipment-1'});assert.match(carrier.trackingNumber,/^TRK-[A-F0-9]{16}$/);
assert.throws(()=>sandboxCarrier({carrierId:'TRUST-E2E',trackingSeed:'x',fail:true}),/SANDBOX_CARRIER_FAILURE/);
const ledger=captureLedger({grossMinor:1000n,platformFeeMinor:100n,providerFeeMinor:50n,currency:'USD'});assert.equal(balanced(ledger),true);
assert.equal(balanced([{account:'cash',side:'DEBIT',amountMinor:100n,currency:'USD'}]),false);

const results=[{caseId:'payment-sandbox',status:'PASS',durationMs:1,checks:['provider'],evidence:['ref'],environment:'sandbox'},{caseId:'carrier-sandbox',status:'PASS',durationMs:1,checks:['tracking'],evidence:['tracking'],environment:'sandbox'}];
const evidence=aggregateEvidence(results);assert.equal(evidence.status,'PASS');assert.equal(evidence.passed,2);assert.equal(evidence.failed,0);
console.log('V315 verification platform tests PASS');
import {runCriticalCommerceScenario} from '../modules/platform/v315/integrations/critical-workflow.ts';
const scenario=await runCriticalCommerceScenario({tenantId:'t1',orderId:'o1',currency:'USD',method:'card',amountMinor:2500n,carrierId:'TRUST-E2E',providers:[{id:'p1',currencies:['USD'],methods:['card'],health:1,priority:1,enabled:true,capacityPct:100},{id:'p2',currencies:['USD'],methods:['card'],health:.9,priority:2,enabled:true,capacityPct:100}]});
assert.equal(scenario.payment.status,'SUCCEEDED');assert.match(scenario.shipment.trackingNumber,/^TRK-/);assert.equal(scenario.replayReceipt.deterministic,true);assert.equal(scenario.events.length,5);
console.log('V315 critical commerce scenario PASS');
