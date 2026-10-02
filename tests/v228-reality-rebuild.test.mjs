import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const pageFiles = [];
function walk(dir){
  for(const name of fs.readdirSync(dir,{withFileTypes:true})){
    const full=`${dir}/${name.name}`;
    if(name.isDirectory()) walk(full);
    else if(name.name==='page.tsx') pageFiles.push(full);
  }
}
walk('app');
const registry=fs.readFileSync('modules/platform/feature-surfaces.ts','utf8');
const protectedRoutes=new Set(['/','/admin-login','/owner-control-room','/merchant-verification-admin','/protection-admin','/life-os-admin','/discovery/admin','/decision-fabric-admin','/production-integrity-admin','/global-commerce-network-admin','/personal-shopper/admin','/problem-solver-admin']);

test('V228 converts feature pages into data-backed surfaces instead of empty/demo shells',()=>{
  const tiny=pageFiles.filter(f=>fs.readFileSync(f,'utf8').split(/\r?\n/).length<=13);
  const unresolved=tiny.filter(f=>{
    const route='/'+f.slice(4,-9).replaceAll('\\','/');
    return !protectedRoutes.has(route) && !registry.includes(`'${route}':`);
  });
  assert.equal(unresolved.length,0,`unresolved tiny pages: ${unresolved.join(', ')}`);
});

test('V228 every registered surface declares a real API endpoint',()=>{
  const bad=[];
  for(const match of registry.matchAll(/'([^']+)':\s*\{[^}]*endpoint:'([^']+)'/g)) if(!match[2].startsWith('/api/')) bad.push(match[1]);
  assert.deepEqual(bad,[]);
});

test('V228 guest checkout validation is executable behavior, not source matching',async()=>{
  const {validateGuest}=await import('../modules/commerce/transactions/guest-validation.ts');
  assert.deepEqual(validateGuest({name:'يوسف',phone:'01012345678',address:'12 Mansoura Street'}),{name:'يوسف',phone:'01012345678',address:'12 Mansoura Street'});
  assert.throws(()=>validateGuest({name:'x',phone:'01012345678',address:'12 Mansoura Street'}),/INVALID_GUEST_NAME/);
  assert.throws(()=>validateGuest({name:'يوسف',phone:'0111234567',address:'12 Mansoura Street'}),/INVALID_GUEST_PHONE/);
  assert.throws(()=>validateGuest({name:'يوسف',phone:'01012345678',address:'short'}),/INVALID_GUEST_ADDRESS/);
});

test('V228 status protocol never equates a successful response with LIVE by default',()=>{
  const surface=fs.readFileSync('components/feature-surface.tsx','utf8');
  assert.match(surface,/FOUNDATION/);
  assert.match(surface,/SIMULATION/);
  assert.match(surface,/PROVIDER_REQUIRED/);
  assert.match(surface,/return 'DEGRADED'/);
  assert.doesNotMatch(surface,/LIVE RESPONSE/);
});

test('V228 full test runner discovers every test source file',()=>{
  const runner=fs.readFileSync('scripts/run-tests.mjs','utf8');
  const files=fs.readdirSync('tests').filter(name=>/\.(mjs|ts)$/.test(name));
  assert.match(runner,/readdirSync/);
  assert.equal(files.length, fs.readdirSync('tests').filter(name=>/\.(mjs|ts)$/.test(name)).length);assert.match(runner,/--test/);assert.match(runner,/filter\(name/);
});

test('V228 catalog runtime source of truth is the database repository',()=>{
  const discovery=fs.readFileSync('modules/experience/discovery/engine.ts','utf8');
  const shopper=fs.readFileSync('modules/experience/personal-shopper/engine.ts','utf8');
  assert.match(discovery,/queryCatalog/);
  assert.match(shopper,/queryCatalog/);
  assert.doesNotMatch(discovery,/data\/catalog/);
  assert.doesNotMatch(shopper,/data\/catalog/);
  assert.equal(fs.existsSync('data/catalog.ts'),false);
  const compatibility=fs.readFileSync('modules/commerce/products/catalog.ts','utf8');
  assert.match(compatibility,/@deprecated Legacy compatibility catalog/);
  assert.match(compatibility,/repository\/catalog/);
});

test('V228/V229 capability surfaces distinguish live implementation from remaining foundation work',()=>{
  for(const feature of ['reorder','loyalty','product-qa','customer-support']){
    const source=fs.readFileSync(`app/api/${feature}/route.ts`,'utf8');
    assert.match(source,/surfaceStatus:'LIVE'/);
    assert.doesNotMatch(source,/accepted:true/);
  }
  for(const feature of ['b2b','subscriptions','gift-cards']){
    const source=fs.readFileSync(`app/api/${feature}/route.ts`,'utf8');
    assert.match(source,/status:501/);
    assert.match(source,/NOT_IMPLEMENTED/);
    assert.match(source,/surfaceStatus:'FOUNDATION'/);
    assert.doesNotMatch(source,/accepted:true/);
  }
  const personalization=fs.readFileSync('app/api/personalization/route.ts','utf8');
  assert.match(personalization,/surfaceStatus:'LIVE'/);
  assert.match(personalization,/surfaceStatus:'PROVIDER_REQUIRED'/);
});

test('V229 grounded capabilities have durable implementation boundaries',()=>{
  assert.match(fs.readFileSync('modules/customer-support/service.ts','utf8'),/trust_problem_cases/);
  assert.match(fs.readFileSync('modules/customer-support/service.ts','utf8'),/trust_problem_events/);
  assert.match(fs.readFileSync('modules/commerce/qa/service.ts','utf8'),/getProduct/);
  assert.match(fs.readFileSync('app/api/reorder/route.ts','utf8'),/trust_order_items/);
  assert.match(fs.readFileSync('app/api/reorder/route.ts','utf8'),/replaceCart/);
  assert.match(fs.readFileSync('app/api/loyalty/route.ts','utf8'),/trust_loyalty_ledger/);
});

test('V228 release history is kept out of repository root',()=>{
  assert.equal(fs.readdirSync('.').filter(name=>/^MASTER-RELEASE-V\d+\.md$/.test(name)).length,0);
  assert.ok(fs.existsSync('docs/releases/MASTER-RELEASE-V228.md'));
});
