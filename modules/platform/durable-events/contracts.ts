export interface DurableEvent<T = Record<string, unknown>> {
  eventId: string;
  tenantId: string;
  eventType: string;
  aggregateId: string;
  sequenceNo: number;
  occurredAt: string;
  payload: T;
  correlationId?: string;
  causationId?: string;
  idempotencyKey: string;
  schemaVersion?: number;
}

export type DeliveryStatus = 'PENDING' | 'PROCESSING' | 'PROCESSED' | 'RETRYING' | 'DEAD_LETTERED';

export interface EventDeliveryClaim extends DurableEvent {
  consumerId: string;
  attempts: number;
  status: DeliveryStatus;
}

export interface DeliveryResult {
  status: 'PROCESSED' | 'RETRY' | 'DEAD_LETTERED';
  reason?: string;
}

export type DurableEventHandler = (event: EventDeliveryClaim) => Promise<DeliveryResult>;
