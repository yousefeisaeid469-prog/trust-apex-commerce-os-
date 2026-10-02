import type { SqlExecutor } from '../../platform/persistence/postgres-boundary';
import { requiredId, normalizedCurrency, positiveMoney, type LedgerDirection, type LedgerType } from './contracts';

export type LedgerEntry = {
  id: string;
  customerId: string | null;
  returnId: string | null;
  replacementOrderId: string | null;
  storeCreditId: string | null;
  entryType: LedgerType;
  direction: LedgerDirection;
  amount: number;
  currency: string;
  status: 'PENDING' | 'POSTED' | 'REVERSED';
  referenceKey: string;
  metadata: Record<string, unknown>;
  createdAt: string;
};

function mapLedger(row: any): LedgerEntry {
  return {
    id: row.id,
    customerId: row.customer_id,
    returnId: row.return_id,
    replacementOrderId: row.replacement_order_id,
    storeCreditId: row.store_credit_id,
    entryType: row.entry_type,
    direction: row.direction,
    amount: Number(row.amount),
    currency: row.currency,
    status: row.status,
    referenceKey: row.reference_key,
    metadata: row.metadata_json || {},
    createdAt: row.created_at,
  };
}

export async function postLedgerEntry(db: SqlExecutor, input: {
  customerId?: string;
  returnId?: string;
  replacementOrderId?: string;
  storeCreditId?: string;
  entryType: LedgerType;
  direction: LedgerDirection;
  amount: number;
  currency?: string;
  referenceKey: string;
  metadata?: Record<string, unknown>;
}): Promise<LedgerEntry> {
  const amount = positiveMoney(input.amount);
  if (amount === undefined) throw new Error('INVALID_LEDGER_AMOUNT');
  const referenceKey = requiredId(input.referenceKey, 'reference_key');
  const currency = normalizedCurrency(input.currency);
  const result = await db.query<any>(`insert into trust_financial_ledger_entries
    (customer_id,return_id,replacement_order_id,store_credit_id,entry_type,direction,amount,currency,reference_key,metadata_json)
    values($1,$2,$3,$4,$5,$6,$7,$8,$9,$10::jsonb)
    on conflict(reference_key) do update set reference_key=excluded.reference_key
    returning *`, [input.customerId || null, input.returnId || null, input.replacementOrderId || null, input.storeCreditId || null, input.entryType, input.direction, amount, currency, referenceKey, JSON.stringify(input.metadata || {})]);
  return mapLedger(result.rows[0]);
}

export async function getLedgerForCustomer(db: SqlExecutor, customerId: string, limit = 100): Promise<LedgerEntry[]> {
  const id = requiredId(customerId, 'customer_id');
  const n = Math.min(Math.max(Number(limit) || 100, 1), 250);
  const result = await db.query<any>(`select * from trust_financial_ledger_entries where customer_id=$1 order by created_at desc limit $2`, [id, n]);
  return result.rows.map(mapLedger);
}

export async function getLedgerForReturn(db: SqlExecutor, returnId: string): Promise<LedgerEntry[]> {
  const id = requiredId(returnId, 'return_id');
  const result = await db.query<any>(`select * from trust_financial_ledger_entries where return_id=$1 order by created_at asc`, [id]);
  return result.rows.map(mapLedger);
}

export async function getLedgerBalance(db: SqlExecutor, customerId: string, currency = 'EGP') {
  const id = requiredId(customerId, 'customer_id');
  const normalized = normalizedCurrency(currency);
  const result = await db.query<{ credits: string; debits: string }>(`select
    coalesce(sum(case when direction='CREDIT' and status='POSTED' then amount else 0 end),0)::numeric credits,
    coalesce(sum(case when direction='DEBIT' and status='POSTED' then amount else 0 end),0)::numeric debits
    from trust_financial_ledger_entries where customer_id=$1 and currency=$2`, [id, normalized]);
  const credits = Number(result.rows[0]?.credits || 0);
  const debits = Number(result.rows[0]?.debits || 0);
  return { customerId: id, currency: normalized, credits, debits, net: Math.round((credits - debits) * 100) / 100 };
}

export async function reverseLedgerEntry(db: SqlExecutor, referenceKey: string, reverseReferenceKey: string, actorId?: string) {
  const ref = requiredId(referenceKey, 'reference_key');
  const reverseRef = requiredId(reverseReferenceKey, 'reverse_reference_key');
  return db.transaction(async tx => {
    const found = await tx.query<any>('select * from trust_financial_ledger_entries where reference_key=$1 for update', [ref]);
    const row = found.rows[0];
    if (!row) throw new Error('LEDGER_ENTRY_NOT_FOUND');
    if (row.status === 'REVERSED') return mapLedger(row);
    await tx.query(`update trust_financial_ledger_entries set status='REVERSED' where id=$1`, [row.id]);
    return postLedgerEntry(tx, {
      customerId: row.customer_id || undefined,
      returnId: row.return_id || undefined,
      replacementOrderId: row.replacement_order_id || undefined,
      storeCreditId: row.store_credit_id || undefined,
      entryType: row.entry_type,
      direction: row.direction === 'CREDIT' ? 'DEBIT' : 'CREDIT',
      amount: Number(row.amount),
      currency: row.currency,
      referenceKey: reverseRef,
      metadata: { reversedReferenceKey: ref, actorId: actorId || null },
    });
  });
}

export async function reconcileReturnLedger(db: SqlExecutor, returnId: string) {
  const id = requiredId(returnId, 'return_id');
  const result = await db.query<any>(`select
    count(*)::int entry_count,
    coalesce(sum(case when direction='CREDIT' and status='POSTED' then amount else 0 end),0)::numeric credits,
    coalesce(sum(case when direction='DEBIT' and status='POSTED' then amount else 0 end),0)::numeric debits
    from trust_financial_ledger_entries where return_id=$1`, [id]);
  const row = result.rows[0] || { entry_count: 0, credits: 0, debits: 0 };
  return { returnId: id, entryCount: Number(row.entry_count), credits: Number(row.credits), debits: Number(row.debits), balanced: Number(row.credits) >= Number(row.debits) };
}
