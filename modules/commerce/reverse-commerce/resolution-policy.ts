import type { ReturnReasonCode, ReturnItemCondition } from '../returns/contracts';
import type { RecoveryDisposition } from './contracts';
import { calculateReplacementCharge, calculateStoreCreditAmount } from './policy';

export type ResolutionOption = 'REFUND' | 'REPLACEMENT' | 'STORE_CREDIT' | 'REJECTED' | 'NO_ACTION';
export type ResolutionContext = {
  reason: ReturnReasonCode;
  condition: ReturnItemCondition;
  recoverable: boolean;
  restockable: boolean;
  requestedAmount: number;
  shippingAmount: number;
  replacementUnitPrice?: number;
  replacementQuantity?: number;
  restockingFee?: number;
  shippingAdjustment?: number;
  customerPreference?: ResolutionOption;
};
export type ResolutionDecision = {
  recommended: ResolutionOption;
  allowed: ResolutionOption[];
  blocked: Array<{ option: ResolutionOption; reason: string }>;
  recoveryDisposition: RecoveryDisposition;
  refundAmount: number;
  creditAmount: number;
  replacementCharge: number;
  explanation: string[];
};

const reasonsThatFavorReplacement: readonly ReturnReasonCode[] = ['WRONG_ITEM','DAMAGED','DEFECTIVE','NOT_AS_DESCRIBED'];
const reasonsThatMayUseCredit: readonly ReturnReasonCode[] = ['CHANGED_MIND','SIZE_OR_FIT','LATE_DELIVERY','OTHER'];

export function recoveryDispositionForResolution(reason: ReturnReasonCode, condition: ReturnItemCondition, recoverable: boolean, restockable: boolean): RecoveryDisposition {
  if (!recoverable) return condition === 'DEFECTIVE' ? 'RETURN_TO_VENDOR' : 'DISPOSE';
  if (restockable && (condition === 'SEALED' || condition === 'OPENED')) return 'RESTOCK';
  if (condition === 'DEFECTIVE') return 'RETURN_TO_VENDOR';
  if (reason === 'WRONG_ITEM') return 'REPLACE';
  return 'QUARANTINE';
}

function boundedMoney(value: number): number { return Math.max(0, Math.round(value * 100) / 100); }

export function refundAmountForContext(context: ResolutionContext): number {
  return boundedMoney(Math.max(0, context.requestedAmount) - Math.max(0, context.restockingFee || 0) + (context.shippingAdjustment || 0));
}

export function creditAmountForContext(context: ResolutionContext): number {
  return calculateStoreCreditAmount(Math.max(0, context.requestedAmount), Math.max(0, context.restockingFee || 0), context.shippingAdjustment || 0);
}

export function replacementChargeForContext(context: ResolutionContext): number {
  if (!context.replacementUnitPrice || !context.replacementQuantity) return 0;
  return calculateReplacementCharge(context.replacementUnitPrice, context.replacementQuantity, context.shippingAmount || 0);
}

export function explainResolution(context: ResolutionContext): string[] {
  const explanation: string[] = [];
  explanation.push(`reason=${context.reason}`);
  explanation.push(`condition=${context.condition}`);
  explanation.push(context.recoverable ? 'item is recoverable' : 'item is not recoverable');
  explanation.push(context.restockable ? 'item is marked restockable' : 'item is not marked restockable');
  if (context.customerPreference) explanation.push(`customer preference=${context.customerPreference}`);
  if (context.reason === 'WRONG_ITEM') explanation.push('wrong-item returns favor replacement when stock is available');
  if (context.reason === 'DEFECTIVE') explanation.push('defective returns require inspection evidence before final financial resolution');
  if (context.reason === 'DAMAGED') explanation.push('damaged returns can use refund, replacement or credit after inspection');
  if (context.reason === 'LATE_DELIVERY') explanation.push('late delivery may qualify for a bounded compensation or value resolution');
  if (context.reason === 'CHANGED_MIND') explanation.push('changed-mind returns are policy-sensitive and may include a restocking fee');
  if (context.reason === 'SIZE_OR_FIT') explanation.push('size or fit returns can prefer replacement when an alternative product is available');
  if (context.reason === 'NOT_AS_DESCRIBED') explanation.push('not-as-described returns favor a value restoration path after evidence review');
  if (context.reason === 'OTHER') explanation.push('other reasons require explicit operator review');
  return explanation;
}

export function decideResolution(context: ResolutionContext): ResolutionDecision {
  const recoveryDisposition = recoveryDispositionForResolution(context.reason, context.condition, context.recoverable, context.restockable);
  const refundAmount = refundAmountForContext(context);
  const creditAmount = creditAmountForContext(context);
  const replacementCharge = replacementChargeForContext(context);
  const allowed: ResolutionOption[] = [];
  const blocked: Array<{ option: ResolutionOption; reason: string }> = [];

  const inspectionReady = context.condition !== 'UNKNOWN';
  if (inspectionReady && refundAmount > 0) allowed.push('REFUND');
  else blocked.push({ option:'REFUND', reason: inspectionReady ? 'refund amount is zero' : 'inspection condition is unknown' });

  if (reasonsThatFavorReplacement.includes(context.reason) && context.recoverable) allowed.push('REPLACEMENT');
  else if (!context.recoverable) blocked.push({ option:'REPLACEMENT', reason:'item is not recoverable' });
  else blocked.push({ option:'REPLACEMENT', reason:'reason does not default to replacement' });

  if (reasonsThatMayUseCredit.includes(context.reason) && creditAmount > 0) allowed.push('STORE_CREDIT');
  else if (creditAmount <= 0) blocked.push({ option:'STORE_CREDIT', reason:'credit amount is zero' });
  else blocked.push({ option:'STORE_CREDIT', reason:'reason requires a different value resolution' });

  allowed.push('NO_ACTION');
  if (context.reason === 'OTHER' && !context.customerPreference) blocked.push({ option:'REJECTED', reason:'other reason needs explicit operator evidence' });
  else allowed.push('REJECTED');

  let recommended: ResolutionOption = context.customerPreference && allowed.includes(context.customerPreference) ? context.customerPreference : 'REFUND';
  if (context.reason === 'WRONG_ITEM' && allowed.includes('REPLACEMENT')) recommended = 'REPLACEMENT';
  if (context.reason === 'CHANGED_MIND' && allowed.includes('STORE_CREDIT')) recommended = 'STORE_CREDIT';
  if (!allowed.includes(recommended)) recommended = allowed[0] || 'NO_ACTION';

  return { recommended, allowed, blocked, recoveryDisposition, refundAmount, creditAmount, replacementCharge, explanation: explainResolution(context) };
}

export function canResolveWithoutOperator(context: ResolutionContext, decision: ResolutionDecision): boolean {
  if (context.reason === 'OTHER') return false;
  if (context.condition === 'UNKNOWN') return false;
  if (decision.blocked.some(x => x.option === decision.recommended)) return false;
  if (decision.recommended === 'REPLACEMENT' && !context.recoverable) return false;
  return true;
}

export function outcomeNeedsFinancialEvidence(outcome: ResolutionOption): boolean {
  return outcome === 'REFUND' || outcome === 'STORE_CREDIT' || outcome === 'REPLACEMENT';
}

export function outcomeNeedsWarehouseEvidence(outcome: ResolutionOption): boolean {
  return outcome === 'REPLACEMENT' || outcome === 'REFUND' || outcome === 'STORE_CREDIT';
}

export function policyVersion(): string { return 'V235-RESOLUTION-1'; }
