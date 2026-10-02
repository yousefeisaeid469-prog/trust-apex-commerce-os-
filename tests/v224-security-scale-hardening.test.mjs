import test from 'node:test'; import assert from 'node:assert/strict';
import {buildSecurityHardeningReport,optimizeOrderCancelQueryPlan} from '../modules/platform/production-security-hardening/core.ts';

test('V224 blocks failed production controls and preserves warning visibility',()=>{
 const r=buildSecurityHardeningReport({now:'2026-09-07T00:00:00Z',controls:[{id:'auth',domain:'AUTH',status:'PASS',title:'Auth',detail:'ok'},{id:'rate',domain:'RATE_LIMIT',status:'FAIL',title:'Rate limit',detail:'missing shared store'},{id:'csp',domain:'CSP',status:'WARN',title:'CSP',detail:'nonce migration pending'}]});
 assert.equal(r.version,'V224.0.0'); assert.equal(r.ready,false); assert.equal(r.blockers.length,1); assert.equal(r.warnings.length,1); assert.equal(r.score,53);
});

test('V224 exposes targeted order-cancellation query plan',()=>{
 const p=optimizeOrderCancelQueryPlan(); assert.equal(p.indexes.length,2); assert.match(p.strategy,/set-based update/); assert.match(p.indexes[0],/order_id,status/);
});

test('V224 shared rate-limit contract fails closed when production requires shared backend',async()=>{
 const mod=await import('../modules/platform/security/rate-limit/distributed.ts'); const oldNode=process.env.NODE_ENV,oldBackend=process.env.TRUST_RATE_LIMIT_BACKEND;
 Object.assign(process.env,{NODE_ENV:'production',TRUST_RATE_LIMIT_BACKEND:'shared'});
 assert.rejects(()=>mod.rateLimitDistributed('v224-test',1,1000),/SHARED_RATE_LIMIT_STORE_NOT_CONFIGURED/);
 if(oldNode===undefined) delete process.env.NODE_ENV; else process.env.NODE_ENV=oldNode;
 if(oldBackend===undefined) delete process.env.TRUST_RATE_LIMIT_BACKEND; else process.env.TRUST_RATE_LIMIT_BACKEND=oldBackend;
});
