import { randomUUID } from 'node:crypto';
import { runCommerceEventPublisher } from '../modules/platform/commerce-events/publisher.ts';

const once = process.argv.includes('--once');
const workerId = `commerce-publisher-${randomUUID()}`;
const idleMs = Number(process.env.TRUST_COMMERCE_EVENT_PUBLISHER_IDLE_MS ?? 500);
const trigger = process.env.TRUST_COMMERCE_EVENT_PUBLISHER_TRIGGER ?? 'standalone';

if (once) {
  await runCommerceEventPublisher({ trigger, workerId });
  process.exit(0);
}
while (true) {
  const result = await runCommerceEventPublisher({ trigger, workerId });
  if (result.claimed === 0) await new Promise(resolve => setTimeout(resolve, idleMs));
}
