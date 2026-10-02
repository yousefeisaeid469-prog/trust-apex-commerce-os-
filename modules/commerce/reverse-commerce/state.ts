import type { RecoveryDisposition, RecoveryStatus, ReplacementStatus } from './contracts';

const recoveryTransitions: Record<RecoveryStatus, readonly RecoveryStatus[]> = {
  PENDING: ['APPLIED','FAILED'],
  APPLIED: ['REVERSED'],
  REVERSED: [],
  FAILED: ['PENDING'],
};

const replacementTransitions: Record<ReplacementStatus, readonly ReplacementStatus[]> = {
  REQUESTED: ['APPROVED','CANCELLED','FAILED'],
  APPROVED: ['RESERVED','CANCELLED','FAILED'],
  RESERVED: ['CONFIRMED','CANCELLED','FAILED'],
  CONFIRMED: ['FULFILLING','CANCELLED','FAILED'],
  FULFILLING: ['SHIPPED','CANCELLED','FAILED'],
  SHIPPED: ['DELIVERED','FAILED'],
  DELIVERED: [],
  CANCELLED: [],
  FAILED: ['REQUESTED'],
};

export function canRecoveryTransition(from: RecoveryStatus, to: RecoveryStatus): boolean {
  return from === to || recoveryTransitions[from].includes(to);
}

export function assertRecoveryTransition(from: RecoveryStatus, to: RecoveryStatus): void {
  if (!canRecoveryTransition(from, to)) throw new Error(`INVALID_RECOVERY_TRANSITION:${from}->${to}`);
}

export function canReplacementTransition(from: ReplacementStatus, to: ReplacementStatus): boolean {
  return from === to || replacementTransitions[from].includes(to);
}

export function assertReplacementTransition(from: ReplacementStatus, to: ReplacementStatus): void {
  if (!canReplacementTransition(from, to)) throw new Error(`INVALID_REPLACEMENT_TRANSITION:${from}->${to}`);
}

export function dispositionDelta(disposition: RecoveryDisposition, quantity: number): number {
  if (disposition === 'RESTOCK') return quantity;
  return 0;
}

export function dispositionRequiresInventory(disposition: RecoveryDisposition): boolean {
  return disposition === 'RESTOCK';
}

export function dispositionRequiresReview(disposition: RecoveryDisposition): boolean {
  return disposition === 'DISPOSE' || disposition === 'RETURN_TO_VENDOR';
}

export function replacementIsTerminal(status: ReplacementStatus): boolean {
  return status === 'DELIVERED' || status === 'CANCELLED';
}
