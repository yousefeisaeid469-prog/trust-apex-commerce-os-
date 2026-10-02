export type ConsumerDefinition = {
  id: string;
  module: string;
  maxAttempts: number;
};

const definitions: ConsumerDefinition[] = [
  { id: 'order', module: 'modules/commerce/consumers/order.ts', maxAttempts: 8 },
  { id: 'payment', module: 'modules/commerce/consumers/payment.ts', maxAttempts: 8 },
  { id: 'inventory', module: 'modules/commerce/consumers/inventory.ts', maxAttempts: 10 },
  { id: 'fulfillment', module: 'modules/commerce/consumers/fulfillment.ts', maxAttempts: 10 },
  { id: 'notification', module: 'modules/commerce/consumers/notification.ts', maxAttempts: 12 },
  { id: 'customer', module: 'modules/commerce/consumers/customer.ts', maxAttempts: 8 },
  { id: 'returns', module: 'modules/commerce/consumers/returns.ts', maxAttempts: 8 },
  { id: 'autonomous-commerce-orchestrator', module: 'modules/platform/autonomous-commerce-orchestrator/consumer.ts', maxAttempts: 8 },
  { id: 'commerce-intelligence', module: 'modules/commerce/consumers/intelligence.ts', maxAttempts: 8 },
];

export function consumerFor(id: string | undefined): ConsumerDefinition {
  if (!id) throw new Error('TRUST_COMMERCE_CONSUMER_ID_REQUIRED');
  const found = definitions.find(x => x.id === id);
  if (!found) throw new Error(`UNKNOWN_COMMERCE_CONSUMER:${id}`);
  return found;
}

export function listConsumerDefinitions() { return [...definitions]; }
