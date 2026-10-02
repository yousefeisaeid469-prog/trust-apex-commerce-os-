import assert from 'node:assert/strict';
import {assessDeliveryPromise} from '../modules/platform/global-logistics-v310/contracts.ts';
const base={shipmentStatus:'IN_TRANSIT',promisedAt:'2026-09-10T04:00:00.000Z',now:'2026-09-10T01:00:00.000Z'};
const on=assessDeliveryPromise({...base,etaAt:'2026-09-10T03:00:00.000Z'});assert.equal(on.promiseRisk,'ON_TRACK');assert.equal(on.slackMinutes,60);
const risk=assessDeliveryPromise({...base,etaAt:'2026-09-10T05:00:00.000Z'});assert.equal(risk.promiseRisk,'BREACH');assert.equal(risk.recommendedAction,'ESCALATE_PROMISE_BREACH');assert.ok(risk.reasons.includes('ETA_AFTER_PROMISE'));
const near=assessDeliveryPromise({...base,etaAt:'2026-09-10T03:30:00.000Z',now:'2026-09-10T02:00:00.000Z'});assert.equal(near.promiseRisk,'AT_RISK');assert.equal(near.recommendedAction,'REPLAN_CARRIER');
const exception=assessDeliveryPromise({...base,etaAt:'2026-09-10T03:00:00.000Z',criticalExceptions:1});assert.ok(exception.riskScore>=20);assert.ok(exception.reasons.includes('CRITICAL_EXCEPTION_OPEN'));
const delivered=assessDeliveryPromise({...base,shipmentStatus:'DELIVERED',etaAt:'2026-09-10T10:00:00.000Z'});assert.deepEqual(delivered,{promiseRisk:'ON_TRACK',minutesToPromise:180,minutesToEta:540,slackMinutes:-360,riskScore:0,reasons:[],recommendedAction:'NO_ACTION'});
console.log('V310 promise tests PASS — on-track, breach prediction, near-promise replan, exception weighting and terminal shipment behavior verified.');
