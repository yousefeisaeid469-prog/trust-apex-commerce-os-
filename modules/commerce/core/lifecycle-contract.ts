export const COMMERCE_LIFECYCLE_VERSION = 'V391.0.0';

export type CommerceLifecycleStatus =
  | 'CAPTURED' | 'FULFILLMENT_PLANNED' | 'IN_FULFILLMENT'
  | 'DELIVERED' | 'SETTLEMENT_RELEASED' | 'COMPLETED'
  | 'BLOCKED' | 'REFUNDED';

const TRANSITIONS: Record<CommerceLifecycleStatus, readonly CommerceLifecycleStatus[]> = {
  CAPTURED: ['FULFILLMENT_PLANNED', 'BLOCKED', 'REFUNDED'],
  FULFILLMENT_PLANNED: ['IN_FULFILLMENT', 'DELIVERED', 'BLOCKED', 'REFUNDED'],
  IN_FULFILLMENT: ['DELIVERED', 'BLOCKED', 'REFUNDED'],
  DELIVERED: ['SETTLEMENT_RELEASED', 'COMPLETED', 'REFUNDED'],
  SETTLEMENT_RELEASED: ['COMPLETED', 'REFUNDED'],
  COMPLETED: ['REFUNDED'],
  BLOCKED: ['FULFILLMENT_PLANNED', 'IN_FULFILLMENT', 'REFUNDED'],
  REFUNDED: [],
};

export function canCommerceLifecycleMove(from: CommerceLifecycleStatus, to: CommerceLifecycleStatus): boolean {
  return from === to || TRANSITIONS[from].includes(to);
}

export function assertCommerceLifecycleMove(from: CommerceLifecycleStatus, to: CommerceLifecycleStatus): void {
  if (!canCommerceLifecycleMove(from, to)) {
    throw new Error(`INVALID_COMMERCE_LIFECYCLE_TRANSITION:${from}->${to}`);
  }
}

export function commerceLifecycleTransitions(from: CommerceLifecycleStatus): readonly CommerceLifecycleStatus[] {
  return TRANSITIONS[from];
}
