export type CommerceEvent = { id: string; type: 'order.created' | 'order.status_changed' | 'payment.succeeded' | 'payment.failed'; aggregateId: string; at: string; payload: Record<string, unknown> };
const events: CommerceEvent[] = [];
export function emitCommerceEvent(type: CommerceEvent['type'], aggregateId: string, payload: Record<string, unknown>) {
  const event: CommerceEvent = { id: `evt_${crypto.randomUUID()}`, type, aggregateId, at: new Date().toISOString(), payload }; events.push(event); return event;
}
export function listCommerceEvents(aggregateId?: string) { return [...events].reverse().filter(e => !aggregateId || e.aggregateId === aggregateId); }
