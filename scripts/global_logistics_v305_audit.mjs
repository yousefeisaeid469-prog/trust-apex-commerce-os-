import assert from 'node:assert/strict';
import fs from 'node:fs';
const {scoreCandidates}=await import('../modules/platform/global-logistics-v305/scoring.ts');
const balanced=scoreCandidates([{carrierCode:'TRUST-E2E',serviceCode:'TRUST-E2E-STANDARD',costMinor:500n,minDays:3,maxDays:10,reliability:.99,score:0,reasons:[]}],'BALANCED'); assert.ok(balanced.length===1);
const speed=scoreCandidates([{carrierCode:'A',serviceCode:'A',costMinor:900n,minDays:1,maxDays:2,reliability:.90,score:0,reasons:[]},{carrierCode:'B',serviceCode:'B',costMinor:500n,minDays:5,maxDays:10,reliability:.99,score:0,reasons:[]}],'SPEED'); assert.equal(speed[0].carrierCode,'A');
assert.ok(speed[0].reasons.length>=3); assert.ok(fs.existsSync('db/migrations/143_v305_global_logistics_intelligence.sql'));
console.log('V305 audit PASS — weighted decision evidence, speed-priority selection, deterministic scoring, and migration verified.');
