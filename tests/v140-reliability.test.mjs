import test from 'node:test';
import assert from 'node:assert/strict';
import { runConcurrencyLab, assertSerializable } from '../modules/platform/reliability/concurrency/lab.ts';
import { assertDeterministic, checkInvariants } from '../modules/platform/reliability/property/invariants.ts';
import { validateIncident, replayIncident } from '../modules/platform/reliability/incidents/replay.ts';
import { fuzzTenantIsolation } from '../modules/platform/reliability/tenant-fuzz/isolation.ts';
import { runCampaign } from '../modules/platform/reliability/campaign.ts';

test('concurrency lab rejects stale writers deterministically',()=>{const r=runConcurrencyLab(7,[{id:'a',key:'o',tenantId:'t1',action:'write',expectedVersion:7,delta:1},{id:'b',key:'o',tenantId:'t1',action:'write',expectedVersion:7,delta:1}]);assert.equal(r[0].accepted,true);assert.equal(r[1].reason,'VERSION_CONFLICT');assert.doesNotThrow(()=>assertSerializable(r));});
test('property harness detects invariant violations and stays deterministic',()=>{const good={value:4};assert.deepEqual(checkInvariants(good,[{name:'positive',check:x=>x.value>0}]),[]);assertDeterministic(seed=>({seed,n:seed%7}),42);});
test('incident replay is gap-safe and repeatable',()=>{const i={id:'inc-1',startedAt:100,events:[{sequence:1,type:'OPENED',at:100,payload:{}},{sequence:2,type:'RESOLVED',at:130,payload:{}}]};assert.deepEqual(replayIncident(i),{incidentId:'inc-1',status:'RESOLVED',events:2});assert.throws(()=>validateIncident({...i,events:[{...i.events[1]}]}),/INCIDENT_SEQUENCE_GAP/);});
test('tenant isolation fuzzing has zero cross-tenant allows',()=>{const r=fuzzTenantIsolation([{actorTenant:'a',resourceTenant:'a',role:'admin',resourceId:'1'},{actorTenant:'a',resourceTenant:'b',role:'admin',resourceId:'2'},{actorTenant:'b',resourceTenant:'a',role:'viewer',resourceId:'3'}]);assert.equal(r.checked,3);assert.equal(r.violations,0);});
test('fault campaign is bounded and replayable',()=>{const a=runCampaign({id:'c1',seed:123,iterations:100,faults:['timeout','duplicate','reorder']});const b=runCampaign({id:'c1',seed:123,iterations:100,faults:['reorder','timeout','duplicate']});assert.deepEqual(a,b);assert.throws(()=>runCampaign({id:'x',seed:1,iterations:100001,faults:['timeout']}),/CAMPAIGN_ITERATION_LIMIT/);});
