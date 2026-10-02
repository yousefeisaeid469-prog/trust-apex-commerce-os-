import { randomUUID } from 'node:crypto';
import { consumerFor } from '../modules/platform/commerce-events/contracts.ts';
import { getSubscription } from '../modules/platform/commerce-events/registry.ts';
import { claimDelivery, completeDelivery, retryDelivery } from '../modules/platform/durable-events/store.ts';
import { finishConsumerRun, heartbeatConsumerRun, renewConsumerDeliveryLease, startConsumerRun } from '../modules/platform/durable-events/consumer-runtime.ts';

const consumerId = process.env.TRUST_COMMERCE_CONSUMER_ID;
const once = process.argv.includes('--once');
const definition = consumerFor(consumerId);
const loaded = await import(new URL(`../${definition.module}`, import.meta.url));
const handler = loaded.handle;
if (typeof handler !== 'function') { console.error(`CONSUMER_HANDLER_INVALID:${consumerId}`); process.exit(2); }

const trigger = process.env.TRUST_COMMERCE_CONSUMER_TRIGGER ?? 'standalone';
const idleMs = Number(process.env.TRUST_COMMERCE_CONSUMER_IDLE_MS ?? 500);
const leaseRefreshMs = Math.max(5000, Number(process.env.TRUST_COMMERCE_CONSUMER_LEASE_REFRESH_MS ?? 30000));
const maxBatch = Math.max(1, Math.min(100, Number(process.env.TRUST_COMMERCE_CONSUMER_BATCH_SIZE ?? 25)));

async function processOne(workerId, counters) {
  const claim = await claimDelivery(definition.id, workerId);
  if (!claim) return false;
  counters.claimed++;
  let timer;
  try {
    const subscription = await getSubscription(definition.id, claim.eventType);
    if (!subscription?.enabled) {
      await retryDelivery(claim, `UNSUBSCRIBED_EVENT:${claim.eventType}`, subscription?.maxAttempts ?? definition.maxAttempts);
      counters.retried++;
      return true;
    }
    if (Number(claim.schemaVersion ?? 1) !== Number(subscription.contractVersion)) {
      await retryDelivery(claim, `CONTRACT_VERSION_MISMATCH:event=v${claim.schemaVersion ?? 1}:consumer=v${subscription.contractVersion}`, subscription.maxAttempts);
      counters.retried++;
      return true;
    }
    timer = setInterval(() => renewConsumerDeliveryLease(claim.tenantId,claim.eventId,claim.consumerId,workerId).catch(()=>{}), leaseRefreshMs);
    const result = await handler(claim);
    if (result?.status === 'PROCESSED') {
      await completeDelivery(claim, result.effectKey);
      counters.processed++;
    } else {
      await retryDelivery(claim, result?.reason ?? 'HANDLER_RETRY', subscription.maxAttempts);
      if (claim.attempts >= subscription.maxAttempts) counters.deadLettered++; else counters.retried++;
    }
  } catch (error) {
    const reason = error instanceof Error ? error.message : 'HANDLER_ERROR';
    await retryDelivery(claim, reason, definition.maxAttempts);
    if (claim.attempts >= definition.maxAttempts) counters.deadLettered++; else counters.failed++;
  } finally { if (timer) clearInterval(timer); }
  return true;
}

const run = await startConsumerRun(definition.id, trigger, `commerce-consumer-${definition.id}-${randomUUID()}`);
const counters = {claimed:0,processed:0,retried:0,deadLettered:0,failed:0};
let lastError = null;
try {
  do {
    let worked = false;
    for (let i=0;i<maxBatch;i++) {
      const one = await processOne(run.workerId,counters);
      if (!one) break;
      worked = true;
      if (once) break;
    }
    await heartbeatConsumerRun(definition.id,run.runId,counters,lastError);
    if (!once && !worked) await new Promise(r=>setTimeout(r,idleMs));
    if (once) break;
  } while (true);
  const status = counters.failed || counters.deadLettered ? 'DEGRADED' : 'SUCCEEDED';
  await finishConsumerRun(definition.id,run.runId,counters,status,lastError);
  process.exit(0);
} catch (error) {
  lastError = error instanceof Error ? error.message : String(error);
  await finishConsumerRun(definition.id,run.runId,counters,'FAILED',lastError).catch(()=>{});
  console.error(`CONSUMER_WORKER_FAILED:${definition.id}:${lastError}`);
  process.exit(1);
}
