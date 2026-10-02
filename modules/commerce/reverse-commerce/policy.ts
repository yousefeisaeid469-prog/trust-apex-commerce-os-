import type { ReturnReasonCode, ReturnItemCondition } from '../returns/contracts';
import type { RecoveryDisposition } from './contracts';

export type RecoveryPolicyInput = {
  reason: ReturnReasonCode;
  condition: ReturnItemCondition;
  recoverable: boolean;
  restockable: boolean;
  quantity: number;
};

export type RecoveryPolicyDecision = {
  disposition: RecoveryDisposition;
  allowed: boolean;
  requiresReview: boolean;
  inventoryDelta: number;
  rationale: string;
};

export function decideRecovery(input: RecoveryPolicyInput): RecoveryPolicyDecision {
  if (input.quantity <= 0) return { disposition: 'QUARANTINE', allowed: false, requiresReview: true, inventoryDelta: 0, rationale: 'quantity must be positive' };
  if (!input.recoverable) {
    const disposition: RecoveryDisposition = input.condition === 'DEFECTIVE' ? 'RETURN_TO_VENDOR' : 'DISPOSE';
    return { disposition, allowed: true, requiresReview: true, inventoryDelta: 0, rationale: 'item is not recoverable' };
  }
  if (input.restockable && (input.condition === 'SEALED' || input.condition === 'OPENED')) {
    return { disposition: 'RESTOCK', allowed: true, requiresReview: false, inventoryDelta: input.quantity, rationale: 'recoverable and restockable condition' };
  }
  if (input.condition === 'DEFECTIVE') {
    return { disposition: 'RETURN_TO_VENDOR', allowed: true, requiresReview: true, inventoryDelta: 0, rationale: 'defective item requires vendor disposition' };
  }
  if (input.reason === 'WRONG_ITEM') {
    return { disposition: 'REPLACE', allowed: true, requiresReview: false, inventoryDelta: 0, rationale: 'wrong item can be routed to replacement workflow' };
  }
  return { disposition: 'QUARANTINE', allowed: true, requiresReview: false, inventoryDelta: 0, rationale: 'recoverable item needs warehouse quarantine' };
}

export function calculateReplacementCharge(unitPrice: number, quantity: number, shipping: number): number {
  const merchandise = Math.max(0, Math.round(unitPrice * quantity * 100) / 100);
  return Math.max(0, Math.round((merchandise + Math.max(0, shipping)) * 100) / 100);
}

export function calculateStoreCreditAmount(grossRefund: number, fees: number, shippingAdjustment: number): number {
  const value = grossRefund - Math.max(0, fees) + shippingAdjustment;
  return Math.max(0, Math.round(value * 100) / 100);
}

export function canIssueCredit(amount: number, currency: string): boolean {
  return Number.isFinite(amount) && amount > 0 && /^[A-Z]{3}$/.test(currency);
}
