import type { SqlExecutor } from '../../platform/persistence/postgres-boundary';
import { normalizedCode, normalizedCurrency, positiveInt, positiveMoney, requiredId } from './contracts';

export type ValidationIssue = { field: string; code: string; message: string };
export type ValidationResult = { valid: boolean; issues: ValidationIssue[] };

function issue(field: string, code: string, message: string): ValidationIssue { return { field, code, message }; }

export function validateRecoveryCommand(input: Record<string, unknown>): ValidationResult {
  const issues: ValidationIssue[] = [];
  try { requiredId(input.returnId, 'return_id'); } catch { issues.push(issue('returnId','REQUIRED','A return is required.')); }
  try { requiredId(input.productId, 'product_id'); } catch { issues.push(issue('productId','REQUIRED','A product is required.')); }
  try { requiredId(input.actorId, 'actor_id'); } catch { issues.push(issue('actorId','REQUIRED','An actor is required.')); }
  try { requiredId(input.idempotencyKey, 'idempotency_key'); } catch { issues.push(issue('idempotencyKey','REQUIRED','An idempotency key is required.')); }
  if (!positiveInt(input.quantity)) issues.push(issue('quantity','POSITIVE','Quantity must be a positive integer.'));
  if (!['RESTOCK','QUARANTINE','DISPOSE','RETURN_TO_VENDOR','REPLACE'].includes(String(input.disposition))) issues.push(issue('disposition','ENUM','Disposition is not supported.'));
  if (typeof input.reason !== 'string' || !input.reason.trim()) issues.push(issue('reason','REQUIRED','A recovery reason is required.'));
  return { valid: issues.length === 0, issues };
}

export function validateReplacementCommand(input: Record<string, unknown>): ValidationResult {
  const issues: ValidationIssue[] = [];
  try { requiredId(input.returnId, 'return_id'); } catch { issues.push(issue('returnId','REQUIRED','A return is required.')); }
  try { requiredId(input.customerId, 'customer_id'); } catch { issues.push(issue('customerId','REQUIRED','A customer is required.')); }
  try { requiredId(input.idempotencyKey, 'idempotency_key'); } catch { issues.push(issue('idempotencyKey','REQUIRED','An idempotency key is required.')); }
  if (!Array.isArray(input.items) || input.items.length === 0) issues.push(issue('items','REQUIRED','At least one replacement item is required.'));
  if (Array.isArray(input.items)) input.items.forEach((item, index) => {
    if (!item || typeof item !== 'object') return issues.push(issue(`items.${index}`,'OBJECT','Each item must be an object.'));
    const row = item as Record<string, unknown>;
    try { requiredId(row.productId, 'product_id'); } catch { issues.push(issue(`items.${index}.productId`,'REQUIRED','A replacement product is required.')); }
    if (!positiveInt(row.quantity)) issues.push(issue(`items.${index}.quantity`,'POSITIVE','Replacement quantity must be positive.'));
  });
  if (input.shippingAmount !== undefined && positiveMoney(input.shippingAmount) === undefined && Number(input.shippingAmount) !== 0) issues.push(issue('shippingAmount','MONEY','Shipping must be zero or a positive amount.'));
  return { valid: issues.length === 0, issues };
}

export function validateCreditIssueCommand(input: Record<string, unknown>): ValidationResult {
  const issues: ValidationIssue[] = [];
  try { requiredId(input.customerId, 'customer_id'); } catch { issues.push(issue('customerId','REQUIRED','A customer is required.')); }
  try { requiredId(input.actorId, 'actor_id'); } catch { issues.push(issue('actorId','REQUIRED','An actor is required.')); }
  try { requiredId(input.idempotencyKey, 'idempotency_key'); } catch { issues.push(issue('idempotencyKey','REQUIRED','An idempotency key is required.')); }
  if (positiveMoney(input.amount) === undefined) issues.push(issue('amount','POSITIVE','Credit amount must be positive.'));
  try { normalizedCurrency(input.currency); } catch { issues.push(issue('currency','CURRENCY','Currency must be a three-letter code.')); }
  if (input.expiresAt !== undefined && input.expiresAt !== null && Number.isNaN(new Date(String(input.expiresAt)).getTime())) issues.push(issue('expiresAt','DATE','Expiry must be a valid date.'));
  return { valid: issues.length === 0, issues };
}

export function validateCreditRedemptionCommand(input: Record<string, unknown>): ValidationResult {
  const issues: ValidationIssue[] = [];
  try { requiredId(input.customerId, 'customer_id'); } catch { issues.push(issue('customerId','REQUIRED','A customer is required.')); }
  try { normalizedCode(input.code); } catch { issues.push(issue('code','REQUIRED','A credit code is required.')); }
  try { requiredId(input.idempotencyKey, 'idempotency_key'); } catch { issues.push(issue('idempotencyKey','REQUIRED','An idempotency key is required.')); }
  if (positiveMoney(input.amount) === undefined) issues.push(issue('amount','POSITIVE','Redemption amount must be positive.'));
  return { valid: issues.length === 0, issues };
}

export async function validateReturnFinancialIntegrity(db: SqlExecutor, returnId: string) {
  const id = requiredId(returnId, 'return_id');
  const [refund, credit, ledger] = await Promise.all([
    db.query<any>(`select coalesce(sum(net_amount),0)::numeric amount from trust_refund_settlements where return_id=$1 and status in ('REQUESTED','SETTLED')`, [id]),
    db.query<any>(`select coalesce(sum(original_amount),0)::numeric issued from trust_store_credits where return_id=$1 and status in ('ACTIVE','EXHAUSTED')`, [id]),
    db.query<any>(`select coalesce(sum(case when direction='CREDIT' and status='POSTED' then amount else 0 end),0)::numeric credits,coalesce(sum(case when direction='DEBIT' and status='POSTED' then amount else 0 end),0)::numeric debits from trust_financial_ledger_entries where return_id=$1`, [id]),
  ]);
  const refundAmount = Number(refund.rows[0]?.amount || 0);
  const creditAmount = Number(credit.rows[0]?.issued || 0);
  const credits = Number(ledger.rows[0]?.credits || 0);
  const debits = Number(ledger.rows[0]?.debits || 0);
  return { returnId:id, refundAmount, creditAmount, ledgerCredits:credits, ledgerDebits:debits, ledgerNet:Math.round((credits-debits)*100)/100, exposure:Math.round((refundAmount+creditAmount)*100)/100, coherent:credits >= debits };
}
