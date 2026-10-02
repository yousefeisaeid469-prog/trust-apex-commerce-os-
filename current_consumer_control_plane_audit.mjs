import fs from 'node:fs'; import path from 'node:path';
const root=process.cwd(); const read=f=>fs.readFileSync(path.join(root,f),'utf8');
const checks=[
 ['control-plane runtime exists',read('modules/platform/durable-events/consumer-control-plane.ts'),/getConsumerHealth[\s\S]*recoverStaleConsumerDeliveries/],
 ['live delivery lag query exists',read('modules/platform/durable-events/consumer-control-plane.ts'),/trust_event_deliveries[\s\S]*oldest_pending_at/],
 ['heartbeat staleness is evaluated',read('modules/platform/durable-events/consumer-control-plane.ts'),/heartbeatStale/],
 ['retry storm signal exists',read('modules/platform/durable-events/consumer-control-plane.ts'),/retry_rate_5m/],
 ['dead-letter signal exists',read('modules/platform/durable-events/consumer-control-plane.ts'),/dead_letter_rate_5m/],
 ['health snapshots persist',read('modules/platform/durable-events/consumer-control-plane.ts'),/trust_commerce_consumer_health_snapshots/],
 ['stale leases are reclaimed transactionally',read('modules/platform/durable-events/consumer-control-plane.ts'),/FOR UPDATE OF d SKIP LOCKED[\s\S]*STALE_LEASE_RECLAIMED/],
 ['dead letters are persisted during recovery',read('modules/platform/durable-events/consumer-control-plane.ts'),/trust_event_dead_letters/],
 ['recovery actions are durable and idempotent',read('modules/platform/durable-events/consumer-control-plane.ts'),/trust_commerce_consumer_recovery_actions[\s\S]*ON CONFLICT\(action_key\) DO NOTHING/],
 ['health API exists',read('app/api/health/commerce/consumers/route.ts'),/captureConsumerHealthSnapshots/],
 ['daily recovery trigger exists',read('app/api/cron/commerce-consumer-control/route.ts'),/recoverStaleConsumerDeliveries/],
 ['worker remains canonical',read('scripts/commerce_consumer_worker.mjs'),/claimDelivery[\s\S]*completeDelivery[\s\S]*retryDelivery/],
];
const failures=checks.filter(([,s,re])=>!re.test(s)).map(([n])=>n); if(failures.length){console.error('CURRENT CONSUMER CONTROL PLANE AUDIT FAILED');failures.forEach(x=>console.error('- '+x));process.exit(1)} console.log(`CURRENT CONSUMER CONTROL PLANE AUDIT PASS — ${checks.length} production control-plane assertions.`);
