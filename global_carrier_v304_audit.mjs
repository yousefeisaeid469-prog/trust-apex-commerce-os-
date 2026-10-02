import assert from 'node:assert/strict';
import fs from 'node:fs';
const {listCarriers}=await import('../modules/platform/global-carrier-v304/registry.ts');
const {rankCarrierRoutes}=await import('../modules/platform/global-carrier-v304/routing.ts');
const carriers=listCarriers(); assert.ok(carriers.length>=4); assert.ok(carriers.some(c=>c.carrierCode==='TRUST-E2E'));
const eg=rankCarrierRoutes({country:'EG',currency:'EGP',mode:'STANDARD'}); assert.ok(eg.length>=1);
const no=rankCarrierRoutes({country:'EG',currency:'JPY',mode:'STANDARD'}); assert.equal(no.length,0);
console.log(`V304 audit PASS — ${carriers.length} carrier descriptors; country/currency routing and unavailable-currency rejection verified.`);
