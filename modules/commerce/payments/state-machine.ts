export type PaymentStatus = 'pending'|'requires_action'|'authorized'|'captured'|'failed'|'cancelled'|'refunded'|'partially_refunded';
export type OrderPaymentStatus = 'pending'|'confirmed'|'cancelled'|'refunded';
const transitions: Record<PaymentStatus, readonly PaymentStatus[]> = {
  pending: ['requires_action','authorized','captured','failed','cancelled'],
  requires_action: ['authorized','captured','failed','cancelled'],
  authorized: ['captured','cancelled','failed'],
  captured: ['partially_refunded','refunded'],
  failed: [], cancelled: [],
  partially_refunded: ['refunded'], refunded: [],
};
export function canTransition(from: PaymentStatus, to: PaymentStatus) { return from === to || transitions[from].includes(to); }
export function assertTransition(from: PaymentStatus, to: PaymentStatus) { if (!canTransition(from, to)) throw new Error(`INVALID_PAYMENT_TRANSITION:${from}->${to}`); }
export function orderStatusForPayment(status: PaymentStatus): OrderPaymentStatus | null {
  // `trust_orders.status` has a deliberately small order lifecycle. Payment
  // capture confirms the order; it does not introduce a second `paid` state.
  if (status === 'captured') return 'confirmed';
  if (status === 'failed' || status === 'cancelled') return 'cancelled';
  if (status === 'refunded') return 'refunded';
  return null;
}
