import { randomUUID } from 'node:crypto';
import { claimDelivery, completeDelivery, retryDelivery } from '../modules/platform/durable-events/store.ts';

const consumerId = process.env.TRUST_EVENT_CONSUMER_ID;
const once = process.argv.includes('--once');
const maxAttempts = Number(process.env.TRUST_EVENT_MAX_ATTEMPTS ?? 8);
if (!consumerId) { console.error('TRUST_EVENT_CONSUMER_ID is required'); process.exit(2); }

const handlers = new Map();
const handlerModule = process.env.TRUST_EVENT_HANDLER_MODULE;
if (handlerModule) {
  const loaded = await import(handlerModule);
  for (const [name, handler] of Object.entries(loaded.handlers ?? {})) handlers.set(name, handler);
}

async function tick() {
  const claim = await claimDelivery(consumerId, `worker-${randomUUID()}`);
  if (!claim) return false;
  const handler = handlers.get(claim.eventType) ?? handlers.get('*');
  if (!handler) { await retryDelivery(claim, `NO_HANDLER:${claim.eventType}`, maxAttempts); return true; }
  try {
    const result = await handler(claim);
    if (result?.status === 'PROCESSED') await completeDelivery(claim, result.effectKey);
    else await retryDelivery(claim, result?.reason ?? 'HANDLER_RETRY', maxAttempts);
  } catch (error) {
    await retryDelivery(claim, error instanceof Error ? error.message : 'HANDLER_ERROR', maxAttempts);
  }
  return true;
}

if (once) { await tick(); process.exit(0); }
while (true) {
  const worked = await tick();
  if (!worked) await new Promise(resolve => setTimeout(resolve, Number(process.env.TRUST_EVENT_IDLE_MS ?? 500)));
}
