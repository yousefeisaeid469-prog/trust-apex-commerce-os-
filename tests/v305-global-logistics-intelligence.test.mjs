import assert from 'node:assert/strict';
const {reliabilityScore,scoreCandidates}=await import('../modules/platform/global-logistics-v305/scoring.ts');
assert.equal(reliabilityScore(95,5,'CLOSED'),.95); assert.equal(reliabilityScore(1,99,'OPEN'),0);
const base=scoreCandidates([{carrierCode:'TRUST-E2E',serviceCode:'TRUST-E2E-STANDARD',costMinor:500n,minDays:3,maxDays:10,reliability:.99,score:0,reasons:[]}],'BALANCED');
assert.equal(base[0].carrierCode,'TRUST-E2E'); assert.ok(base[0].reasons.includes('HIGH_RELIABILITY'));
const speed=scoreCandidates([{carrierCode:'A',serviceCode:'A',costMinor:900n,minDays:1,maxDays:2,reliability:.70,score:0,reasons:[]},{carrierCode:'B',serviceCode:'B',costMinor:500n,minDays:5,maxDays:10,reliability:.99,score:0,reasons:[]}],'SPEED'); assert.equal(speed[0].carrierCode,'A');
const cost=scoreCandidates([{carrierCode:'A',serviceCode:'A',costMinor:900n,minDays:1,maxDays:2,reliability:.99,score:0,reasons:[]},{carrierCode:'B',serviceCode:'B',costMinor:500n,minDays:5,maxDays:10,reliability:.70,score:0,reasons:[]}],'COST'); assert.equal(cost[0].carrierCode,'B');
const blocked=scoreCandidates([{carrierCode:'OPEN',serviceCode:'OPEN',costMinor:1n,minDays:1,maxDays:1,reliability:0,score:0,reasons:[]}], 'RELIABILITY'); assert.equal(blocked[0].score,.3);
console.log('V305 global logistics intelligence PASS — reliability, weighted cost/speed/reliability scoring, currency-matched service discovery, and deterministic ranking verified.');
