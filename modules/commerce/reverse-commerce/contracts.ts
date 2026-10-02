export const RECOVERY_DISPOSITIONS = ['RESTOCK','QUARANTINE','DISPOSE','RETURN_TO_VENDOR','REPLACE'] as const;
export type RecoveryDisposition = typeof RECOVERY_DISPOSITIONS[number];
export const RECOVERY_STATUSES = ['PENDING','APPLIED','REVERSED','FAILED'] as const;
export type RecoveryStatus = typeof RECOVERY_STATUSES[number];
export const REPLACEMENT_STATUSES = ['REQUESTED','APPROVED','RESERVED','CONFIRMED','FULFILLING','SHIPPED','DELIVERED','CANCELLED','FAILED'] as const;
export type ReplacementStatus = typeof REPLACEMENT_STATUSES[number];
export const CREDIT_STATUSES = ['ACTIVE','EXHAUSTED','EXPIRED','CANCELLED'] as const;
export type CreditStatus = typeof CREDIT_STATUSES[number];
export const CREDIT_KINDS = ['ISSUE','REDEEM','REVERSE','EXPIRE','CANCEL'] as const;
export type CreditKind = typeof CREDIT_KINDS[number];
export const LEDGER_TYPES = ['REFUND','STORE_CREDIT_ISSUE','STORE_CREDIT_REDEEM','STORE_CREDIT_REVERSE','REPLACEMENT_CHARGE','REPLACEMENT_WAIVER','INVENTORY_RECOVERY'] as const;
export type LedgerType = typeof LEDGER_TYPES[number];
export const LEDGER_DIRECTIONS = ['DEBIT','CREDIT'] as const;
export type LedgerDirection = typeof LEDGER_DIRECTIONS[number];

export type RecoveryInput = {
  returnId: string;
  returnItemId?: string;
  productId: string;
  disposition: RecoveryDisposition;
  quantity: number;
  warehouseLocation?: string;
  reason: string;
  idempotencyKey: string;
  actorId: string;
};

export type ReplacementItemInput = {
  sourceReturnItemId?: string;
  productId: string;
  quantity: number;
};

export type CreateReplacementInput = {
  returnId: string;
  customerId: string;
  items: ReplacementItemInput[];
  shippingAmount?: number;
  idempotencyKey: string;
};

export type CreditIssueInput = {
  customerId: string;
  returnId?: string;
  amount: number;
  currency?: string;
  expiresAt?: string;
  idempotencyKey: string;
  actorId: string;
};

export type CreditRedeemInput = {
  customerId: string;
  code: string;
  amount: number;
  referenceType?: string;
  referenceId?: string;
  idempotencyKey: string;
};

export function isRecoveryDisposition(v: unknown): v is RecoveryDisposition { return typeof v === 'string' && (RECOVERY_DISPOSITIONS as readonly string[]).includes(v); }
export function isReplacementStatus(v: unknown): v is ReplacementStatus { return typeof v === 'string' && (REPLACEMENT_STATUSES as readonly string[]).includes(v); }
export function isCreditStatus(v: unknown): v is CreditStatus { return typeof v === 'string' && (CREDIT_STATUSES as readonly string[]).includes(v); }
export function isCreditKind(v: unknown): v is CreditKind { return typeof v === 'string' && (CREDIT_KINDS as readonly string[]).includes(v); }
export function isLedgerType(v: unknown): v is LedgerType { return typeof v === 'string' && (LEDGER_TYPES as readonly string[]).includes(v); }
export function isLedgerDirection(v: unknown): v is LedgerDirection { return typeof v === 'string' && (LEDGER_DIRECTIONS as readonly string[]).includes(v); }

export function positiveInt(value: unknown): number | undefined {
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isInteger(n) && n > 0 ? n : undefined;
}

export function positiveMoney(value: unknown): number | undefined {
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) && n > 0 ? Math.round(n * 100) / 100 : undefined;
}

export function nonNegativeMoney(value: unknown): number | undefined {
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) && n >= 0 ? Math.round(n * 100) / 100 : undefined;
}

export function requiredId(value: unknown, name: string): string {
  if (typeof value !== 'string' || !value.trim()) throw new Error(`INVALID_${name.toUpperCase()}`);
  return value.trim();
}

export function normalizedReason(value: unknown): string {
  if (typeof value !== 'string' || !value.trim()) throw new Error('RECOVERY_REASON_REQUIRED');
  return value.trim().slice(0, 500);
}

export function normalizedCode(value: unknown): string {
  if (typeof value !== 'string' || !value.trim()) throw new Error('CREDIT_CODE_REQUIRED');
  return value.trim().toUpperCase();
}

export function normalizedCurrency(value: unknown): string {
  const currency = String(value || 'EGP').trim().toUpperCase();
  if (!/^[A-Z]{3}$/.test(currency)) throw new Error('INVALID_CURRENCY');
  return currency;
}
