-- TRUST V169: financial commerce durable primitives.
create table if not exists trust_financial_journals (
  journal_id text primary key,
  currency text not null,
  reference text not null,
  created_at timestamptz not null default now()
);
create table if not exists trust_financial_ledger_entries (
  entry_id text primary key,
  journal_id text not null references trust_financial_journals(journal_id),
  account_id text not null,
  side text not null check (side in ('DEBIT','CREDIT')),
  amount_minor numeric(78,0) not null check (amount_minor >= 0),
  currency text not null,
  reference text not null,
  status text not null check (status in ('POSTED','VOID')),
  created_at timestamptz not null default now()
);
create index if not exists trust_financial_entries_journal_idx on trust_financial_ledger_entries(journal_id);
create table if not exists trust_seller_payouts (
  payout_id text primary key,
  seller_id text not null,
  currency text not null,
  gross_minor numeric(78,0) not null check (gross_minor >= 0),
  fees_minor numeric(78,0) not null check (fees_minor >= 0),
  refunds_minor numeric(78,0) not null check (refunds_minor >= 0),
  reserve_minor numeric(78,0) not null check (reserve_minor >= 0),
  net_minor numeric(78,0) not null check (net_minor >= 0),
  status text not null check (status in ('PENDING','READY','PAID','HELD')),
  created_at timestamptz not null default now()
);
