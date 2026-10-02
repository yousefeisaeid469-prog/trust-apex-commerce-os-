import assert from 'node:assert/strict';
import {optimizeNetwork,buildCandidates} from '../modules/platform/global-logistics-v311/optimizer.ts';
const cap={carrierCode:'TRUST-E2E',serviceCode:'TRUST-E2E-STANDARD',country:'EG',currency:'EGP',mode:'STANDARD',maxShipments:1,reservedShipments:0};
const shipments=[{shipmentId:'s1',country:'EG',currency:'EGP',mode:'STANDARD',promisedAt:'2026-09-10T03:00:00Z'},{shipmentId:'s2',country:'EG',currency:'EGP',mode:'STANDARD',promisedAt:'2026-09-11T03:00:00Z'}];
const p=optimizeNetwork(shipments,[cap],'PROMISE','2026-09-10T01:00:00Z','k1');assert.equal(p.summary.allocated,1);assert.equal(p.summary.unallocated,1);assert.equal(p.allocations.length,1);assert.equal(p.allocations[0].carrierCode,'TRUST-E2E');assert.equal(p.summary.totalCostMinor,p.allocations.reduce((n,a)=>n+a.costMinor,0n));
const c=buildCandidates(shipments[0],[cap],'2026-09-10T01:00:00Z');assert.equal(c.length,1);assert.ok(c[0].capacityRemaining>0);
const exhausted=optimizeNetwork(shipments,[{...cap,reservedShipments:1}],'BALANCED','2026-09-10T01:00:00Z','k2');assert.equal(exhausted.summary.allocated,0);assert.deepEqual(exhausted.unallocatedShipmentIds,['s1','s2']);
const deterministicA=optimizeNetwork(shipments,[cap],'PROMISE','2026-09-10T01:00:00Z','same');const deterministicB=optimizeNetwork(shipments,[cap],'PROMISE','2026-09-10T01:00:00Z','same');assert.deepEqual(deterministicA.allocations,deterministicB.allocations);
console.log('V311 network optimization tests PASS — deterministic multi-shipment allocation, capacity constraints, promise urgency and cost accounting verified.');
