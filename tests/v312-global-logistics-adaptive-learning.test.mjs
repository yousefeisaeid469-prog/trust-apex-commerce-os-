import assert from 'node:assert/strict';
import {learnCarrierProfiles} from '../modules/platform/global-logistics-v312/learning.ts';
import {optimizeAdaptiveNetwork} from '../modules/platform/global-logistics-v312/adaptive.ts';
import {listCarrierServices} from '../modules/platform/global-carrier-v304/registry.ts';
const now='2026-09-10T00:00:00.000Z';
const observations=[
 ...Array.from({length:8},(_,i)=>({shipmentId:`00000000-0000-0000-0000-${String(i+1).padStart(12,'0')}`,carrierCode:'TRUST-E2E',serviceCode:'TRUST-E2E-STANDARD',outcome:'DELIVERED',promiseHit:true,transitDays:3,plannedMaxDays:10,occurredAt:`2026-09-0${i+1}T00:00:00.000Z`})),
 ...Array.from({length:2},(_,i)=>({shipmentId:`10000000-0000-0000-0000-${String(i+1).padStart(12,'0')}`,carrierCode:'TRUST-E2E',serviceCode:'TRUST-E2E-EXPRESS',outcome:'EXCEPTION',promiseHit:false,transitDays:2,plannedMaxDays:4,occurredAt:`2026-08-2${i+1}T00:00:00.000Z`}))
];
const learned=learnCarrierProfiles(observations);
assert.equal(learned.status,'COMPLETED');
assert.equal(learned.profileCount,2);
assert.ok(listCarrierServices('US','STANDARD').some(s=>s.currency==='USD'));
assert.ok(listCarrierServices('AE','STANDARD').some(s=>s.currency==='AED'));
const standard=learned.profiles.find(p=>p.serviceCode==='TRUST-E2E-STANDARD');
const express=learned.profiles.find(p=>p.serviceCode==='TRUST-E2E-EXPRESS');
assert.ok(standard.adaptiveReliability>express.adaptiveReliability);
assert.ok(standard.confidence>0.6);
const plan=optimizeAdaptiveNetwork([{shipmentId:'20000000-0000-0000-0000-000000000001',country:'EG',currency:'EGP',mode:'STANDARD',priority:'RELIABILITY'}],[], 'RELIABILITY',now,'test-adaptive',[standard]);
assert.equal(plan.version,'V312.0.0');
assert.equal(plan.allocations.length,1);
assert.ok(plan.allocations[0].reasons.includes('ADAPTIVE_LEARNING_ENABLED'));
console.log('V312 adaptive learning tests passed');
