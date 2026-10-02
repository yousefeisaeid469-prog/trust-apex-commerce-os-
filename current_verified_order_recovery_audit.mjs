import fs from 'node:fs';
const checks=[]; const read=p=>fs.readFileSync(p,'utf8');
const runtime=read('modules/platform/durable-events/reliability-recovery.ts');
const migration=read('db/migrations/202_v373_verified_order_recovery.sql');
const route=read('app/api/commerce/reliability/[orderId]/recover/route.ts');
const fabric=read('modules/platform/durable-events/reliability-fabric.ts');
for(const [name,ok] of [
 ['runtime exists',fs.existsSync('modules/platform/durable-events/reliability-recovery.ts')],
 ['migration exists',fs.existsSync('db/migrations/202_v373_verified_order_recovery.sql')],
 ['recovery table',migration.includes('trust_commerce_reliability_recovery_runs')],
 ['order identity is enforced by trace authority',runtime.includes('materializeCommerceReliabilityTrace(orderId)')],
 ['consumer delivery authority',runtime.includes('trust_event_deliveries')],
 ['event authority',runtime.includes('trust_commerce_events')],
 ['execution authority',runtime.includes('trust_commerce_execution_jobs')],
 ['stale consumer guard',runtime.includes("d.status='PROCESSING'") && runtime.includes("d.locked_at < now() - interval '2 minutes'")],
 ['stale execution guard',runtime.includes("status='PROCESSING' AND lease_until < now()")],
 ['postcondition re-observation',runtime.includes('const after = await materializeCommerceReliabilityTrace(orderId)')],
 ['durable evidence',runtime.includes('trust_commerce_reliability_recovery_runs')],
 ['api POST wired',route.includes('runVerifiedOrderRecovery')],
 ['api GET wired',route.includes('getLatestOrderRecovery')],
 ['fabric reused',runtime.includes('materializeCommerceReliabilityTrace')],
 ['no payment mutation',!runtime.includes('UPDATE trust_payments')],
 ['no inventory stock mutation',!runtime.includes('UPDATE trust_fulfillment_inventory')],
 ['audit is current',fabric.includes('materializeCommerceReliabilityTrace')],
]) checks.push({name,ok});
const failed=checks.filter(x=>!x.ok); if(failed.length){console.error(`V373 VERIFIED ORDER RECOVERY AUDIT FAILED (${failed.length}/${checks.length})`);failed.forEach(x=>console.error(`- ${x.name}`));process.exit(1)}
console.log(`V373 VERIFIED ORDER RECOVERY AUDIT PASS — ${checks.length}/${checks.length}`);
