import { query, withPgTransaction } from './db/postgres';

export type JournalLine = { accountCode: string; accountName: string; accountType: 'ASSET'|'LIABILITY'|'EQUITY'|'REVENUE'|'EXPENSE'; ownerType?: 'PLATFORM'|'MERCHANT'|'CUSTOMER'; ownerId?: string; direction: 'DEBIT'|'CREDIT'; amount: number; currency: string };

function money(v: number) { if (!Number.isFinite(v) || v <= 0) throw new Error('INVALID_ACCOUNTING_AMOUNT'); return Math.round(v * 100) / 100; }

export async function postDoubleEntryJournal(input: { journalKey: string; referenceType: string; referenceId: string; description?: string; currency: string; lines: JournalLine[] }) {
  const currency = String(input.currency).toUpperCase();
  if (!/^[A-Z]{3}$/.test(currency)) throw new Error('INVALID_CURRENCY');
  if (input.lines.length < 2) throw new Error('JOURNAL_REQUIRES_TWO_LINES');
  const lines = input.lines.map(x => ({ ...x, amount: money(x.amount), currency: String(x.currency).toUpperCase() }));
  if (lines.some(x => x.currency !== currency)) throw new Error('JOURNAL_CURRENCY_MISMATCH');
  const debit = lines.filter(x => x.direction === 'DEBIT').reduce((s, x) => s + x.amount, 0);
  const credit = lines.filter(x => x.direction === 'CREDIT').reduce((s, x) => s + x.amount, 0);
  if (Math.abs(debit - credit) > 0.005) throw new Error('UNBALANCED_JOURNAL');
  return withPgTransaction(async client => {
    const existing = (await client.query(`select id from trust_accounting_journals where journal_key=$1 for update`, [input.journalKey])).rows[0];
    if (existing) return { journalId: String(existing.id), replay: true, debit, credit };
    const journal = (await client.query(`insert into trust_accounting_journals(journal_key,reference_type,reference_id,currency,description) values($1,$2,$3,$4,$5) returning id`, [input.journalKey, input.referenceType, input.referenceId, currency, input.description ?? ''])).rows[0];
    for (let i = 0; i < lines.length; i++) {
      const l = lines[i];
      const account = (await client.query(`insert into trust_accounting_accounts(code,name,account_type,currency,owner_type,owner_id) values($1,$2,$3,$4,$5,$6)
        on conflict(code) do update set name=excluded.name returning id`, [l.accountCode,l.accountName,l.accountType,l.currency,l.ownerType ?? 'PLATFORM',l.ownerId ?? null])).rows[0];
      await client.query(`insert into trust_accounting_entries(journal_id,account_id,direction,amount,currency,sequence) values($1,$2,$3,$4,$5,$6)`, [journal.id,account.id,l.direction,l.amount,l.currency,i+1]);
    }
    return { journalId: String(journal.id), replay: false, debit, credit };
  });
}

export async function accountingReconciliation() {
  const result = await query(`select j.currency, coalesce(sum(e.amount) filter(where e.direction='DEBIT'),0) debit, coalesce(sum(e.amount) filter(where e.direction='CREDIT'),0) credit from trust_accounting_journals j join trust_accounting_entries e on e.journal_id=j.id group by j.currency order by j.currency`);
  return result.rows.map(r => ({ currency: String(r.currency), debit: Number(r.debit), credit: Number(r.credit), balanced: Math.abs(Number(r.debit)-Number(r.credit)) <= 0.005 }));
}
