import crypto from 'node:crypto';
import type { SqlExecutor } from '../../platform/persistence/postgres-boundary';
import { ensureIdempotency, requestHash, saveIdempotency } from '../../platform/persistence/transaction-store';
import { postLedgerEntry } from './ledger';
import { normalizedCode, normalizedCurrency, positiveMoney, requiredId, type CreditIssueInput, type CreditRedeemInput } from './contracts';

function makeCode(): string { return `TRUST-${crypto.randomBytes(8).toString('hex').toUpperCase()}`; }
function mapCredit(row: any) { return { id: row.id, customerId: row.customer_id, returnId: row.return_id, code: row.code, currency: row.currency, originalAmount: Number(row.original_amount), remainingAmount: Number(row.remaining_amount), status: row.status, expiresAt: row.expires_at, createdAt: row.created_at, updatedAt: row.updated_at }; }

export async function issueStoreCredit(db: SqlExecutor, input: CreditIssueInput) {
  const customerId = requiredId(input.customerId, 'customer_id');
  const returnId = input.returnId ? requiredId(input.returnId, 'return_id') : undefined;
  const actorId = requiredId(input.actorId, 'actor_id');
  const key = requiredId(input.idempotencyKey, 'idempotency_key');
  const amount = positiveMoney(input.amount);
  if (amount === undefined) throw new Error('INVALID_CREDIT_AMOUNT');
  const currency = normalizedCurrency(input.currency);
  return db.transaction(async tx => {
    const hash = requestHash('store-credit.issue', { customerId, returnId, amount, currency, expiresAt: input.expiresAt || null });
    const cached = await ensureIdempotency(tx, key, 'store-credit.issue', hash);
    if (cached) return { ...(cached as object), replay: true };
    if (returnId) {
      const ret = await tx.query<any>('select customer_id,status from trust_returns where id=$1 for update', [returnId]);
      if (!ret.rows[0]) throw new Error('RETURN_NOT_FOUND');
      if (ret.rows[0].customer_id !== customerId) throw new Error('RETURN_ACCESS_DENIED');
      if (!['APPROVED_REFUND','REFUND_PENDING','REFUNDED'].includes(ret.rows[0].status)) throw new Error('RETURN_NOT_CREDIT_ELIGIBLE');
    }
    const code = makeCode();
    const inserted = await tx.query<any>(`insert into trust_store_credits(customer_id,return_id,code,currency,original_amount,remaining_amount,expires_at) values($1,$2,$3,$4,$5,$5,$6) returning *`, [customerId, returnId || null, code, currency, amount, input.expiresAt || null]);
    const credit = inserted.rows[0];
    await tx.query(`insert into trust_store_credit_transactions(credit_id,customer_id,kind,amount,balance_after,reference_type,reference_id,idempotency_key,metadata_json) values($1,$2,'ISSUE',$3,$3,'return',$4,$5,$6::jsonb)`, [credit.id, customerId, amount, returnId || null, key, JSON.stringify({ actorId })]);
    await postLedgerEntry(tx, { customerId, returnId, storeCreditId: credit.id, entryType: 'STORE_CREDIT_ISSUE', direction: 'CREDIT', amount, currency, referenceKey: `store-credit-issue:${credit.id}`, metadata: { actorId, code } });
    await tx.query(`insert into trust_outbox_events(event_type,aggregate_id,payload_json) values('store_credit.issued',$1,$2::jsonb)`, [credit.id, JSON.stringify({ creditId: credit.id, customerId, returnId: returnId || null, amount, currency, code })]);
    const result = mapCredit(credit);
    await saveIdempotency(tx, key, 'store-credit.issue', result, 86400, hash);
    return { ...result, replay: false };
  });
}

export async function redeemStoreCredit(db: SqlExecutor, input: CreditRedeemInput) {
  const customerId = requiredId(input.customerId, 'customer_id');
  const code = normalizedCode(input.code);
  const key = requiredId(input.idempotencyKey, 'idempotency_key');
  const amount = positiveMoney(input.amount);
  if (amount === undefined) throw new Error('INVALID_REDEMPTION_AMOUNT');
  return db.transaction(async tx => {
    const hash = requestHash('store-credit.redeem', { customerId, code, amount, referenceType: input.referenceType || null, referenceId: input.referenceId || null });
    const cached = await ensureIdempotency(tx, key, 'store-credit.redeem', hash);
    if (cached) return { ...(cached as object), replay: true };
    const result = await tx.query<any>(`select * from trust_store_credits where code=$1 and customer_id=$2 for update`, [code, customerId]);
    const credit = result.rows[0];
    if (!credit) throw new Error('STORE_CREDIT_NOT_FOUND');
    if (credit.status !== 'ACTIVE') throw new Error('STORE_CREDIT_NOT_ACTIVE');
    if (credit.expires_at && new Date(credit.expires_at).getTime() <= Date.now()) {
      await tx.query(`update trust_store_credits set status='EXPIRED',updated_at=now() where id=$1`, [credit.id]);
      throw new Error('STORE_CREDIT_EXPIRED');
    }
    if (Number(credit.remaining_amount) < amount) throw new Error('STORE_CREDIT_INSUFFICIENT');
    const balance = Math.round((Number(credit.remaining_amount) - amount) * 100) / 100;
    const status = balance === 0 ? 'EXHAUSTED' : 'ACTIVE';
    await tx.query(`update trust_store_credits set remaining_amount=$2,status=$3,updated_at=now() where id=$1`, [credit.id, balance, status]);
    await tx.query(`insert into trust_store_credit_transactions(credit_id,customer_id,kind,amount,balance_after,reference_type,reference_id,idempotency_key) values($1,$2,'REDEEM',$3,$4,$5,$6,$7)`, [credit.id, customerId, amount, balance, input.referenceType || null, input.referenceId || null, key]);
    await postLedgerEntry(tx, { customerId, storeCreditId: credit.id, entryType: 'STORE_CREDIT_REDEEM', direction: 'DEBIT', amount, currency: credit.currency, referenceKey: `store-credit-redeem:${key}`, metadata: { code, referenceType: input.referenceType || null, referenceId: input.referenceId || null } });
    await tx.query(`insert into trust_outbox_events(event_type,aggregate_id,payload_json) values('store_credit.redeemed',$1,$2::jsonb)`, [credit.id, JSON.stringify({ creditId: credit.id, customerId, amount, balance, code })]);
    const response = { creditId: credit.id, code, redeemed: amount, remainingAmount: balance, status };
    await saveIdempotency(tx, key, 'store-credit.redeem', response, 86400, hash);
    return { ...response, replay: false };
  });
}

export async function reverseStoreCreditRedemption(db: SqlExecutor, input: { creditId: string; transactionId: string; customerId: string; idempotencyKey: string }) {
  const creditId = requiredId(input.creditId, 'credit_id');
  const transactionId = requiredId(input.transactionId, 'transaction_id');
  const customerId = requiredId(input.customerId, 'customer_id');
  const key = requiredId(input.idempotencyKey, 'idempotency_key');
  return db.transaction(async tx => {
    const hash = requestHash('store-credit.reverse', { creditId, transactionId, customerId });
    const cached = await ensureIdempotency(tx, key, 'store-credit.reverse', hash);
    if (cached) return { ...(cached as object), replay: true };
    const trx = await tx.query<any>(`select * from trust_store_credit_transactions where id=$1 and credit_id=$2 and customer_id=$3 and kind='REDEEM' for update`, [transactionId, creditId, customerId]);
    if (!trx.rows[0]) throw new Error('CREDIT_REDEMPTION_NOT_FOUND');
    const duplicate = await tx.query<any>(`select id from trust_store_credit_transactions where reference_id=$1 and kind='REVERSE'`, [transactionId]);
    if (duplicate.rows[0]) return { transactionId, reversed: true, replay: false };
    const credit = await tx.query<any>('select * from trust_store_credits where id=$1 and customer_id=$2 for update', [creditId, customerId]);
    if (!credit.rows[0]) throw new Error('STORE_CREDIT_NOT_FOUND');
    const amount = Number(trx.rows[0].amount);
    const balance = Math.round((Number(credit.rows[0].remaining_amount) + amount) * 100) / 100;
    await tx.query(`update trust_store_credits set remaining_amount=$2,status='ACTIVE',updated_at=now() where id=$1`, [creditId, balance]);
    await tx.query(`insert into trust_store_credit_transactions(credit_id,customer_id,kind,amount,balance_after,reference_type,reference_id,idempotency_key) values($1,$2,'REVERSE',$3,$4,'credit_transaction',$5,$6)`, [creditId, customerId, amount, balance, transactionId, key]);
    await postLedgerEntry(tx, { customerId, storeCreditId: creditId, entryType: 'STORE_CREDIT_REVERSE', direction: 'CREDIT', amount, currency: credit.rows[0].currency, referenceKey: `store-credit-reverse:${transactionId}`, metadata: { transactionId } });
    const response = { creditId, transactionId, reversedAmount: amount, remainingAmount: balance };
    await saveIdempotency(tx, key, 'store-credit.reverse', response, 86400, hash);
    return { ...response, replay: false };
  });
}

export async function getCustomerCredits(db: SqlExecutor, customerId: string) {
  const id = requiredId(customerId, 'customer_id');
  const result = await db.query<any>('select * from trust_store_credits where customer_id=$1 order by created_at desc', [id]);
  return result.rows.map(mapCredit);
}

export async function getCreditTransactions(db: SqlExecutor, input: { creditId: string; customerId: string }) {
  const creditId = requiredId(input.creditId, 'credit_id');
  const customerId = requiredId(input.customerId, 'customer_id');
  const result = await db.query<any>(`select t.* from trust_store_credit_transactions t join trust_store_credits c on c.id=t.credit_id where t.credit_id=$1 and c.customer_id=$2 order by t.created_at asc`, [creditId, customerId]);
  return result.rows;
}

export async function expireCredits(db: SqlExecutor, limit = 100) {
  const n = Math.min(Math.max(Number(limit) || 100, 1), 500);
  return db.transaction(async tx => {
    const result = await tx.query<any>(`select * from trust_store_credits where status='ACTIVE' and expires_at is not null and expires_at <= now() order by expires_at asc limit $1 for update skip locked`, [n]);
    const expired = [];
    for (const credit of result.rows) {
      await tx.query(`update trust_store_credits set status='EXPIRED',updated_at=now() where id=$1`, [credit.id]);
      if (Number(credit.remaining_amount) > 0) await tx.query(`insert into trust_store_credit_transactions(credit_id,customer_id,kind,amount,balance_after,reference_type,reference_id,idempotency_key) values($1,$2,'EXPIRE',$3,0,'store_credit',$1,$4)`, [credit.id, credit.customer_id, Number(credit.remaining_amount), `expire:${credit.id}`]);
      expired.push(credit.id);
    }
    return { expiredCount: expired.length, creditIds: expired };
  });
}
