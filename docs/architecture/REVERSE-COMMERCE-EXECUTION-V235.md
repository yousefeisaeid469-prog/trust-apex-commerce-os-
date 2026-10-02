# TRUST V235 — Reverse Commerce Execution

## Purpose

V235 turns the post-delivery side of commerce into a durable execution layer. A return is no longer the end of the workflow: recovered inventory, replacements, store credit and financial evidence are first-class aggregates.

## Execution graph

`Return -> Inspection -> Recovery / Replacement / Credit -> Ledger -> Outbox -> Reconciliation`

The implementation deliberately separates concerns:

- `inventory-recovery.ts` owns item-level warehouse recovery and stock deltas.
- `replacement.ts` owns replacement order lifecycle and stock reservation.
- `store-credit.ts` owns customer credit balances and transaction history.
- `ledger.ts` owns financial evidence and reversals.
- `worker.ts` owns bounded asynchronous reconciliation jobs.
- `reporting.ts` owns operational metrics.

## Inventory recovery

Only a `RESTOCK` disposition changes sellable product stock. Quarantine, disposal, vendor return and replacement are recorded without pretending those units are immediately sellable. Every stock change is paired with an inventory ledger row. Reversal uses a row lock and checks for underflow before applying the compensating delta.

## Replacement orders

Replacement orders have a constrained state machine. Stock is checked and locked before moving to `RESERVED`; reservation writes an inventory ledger event. Cancellation from reserving/fulfilling states releases the reserved quantity. Duplicate active replacements for the same return are rejected.

## Store credit

Credits are customer-scoped, generated with cryptographic randomness, and backed by a transaction history. Redemption locks the credit row, validates expiry and available balance, updates the balance atomically and posts a financial ledger entry. Reversal restores the balance exactly once.

## Financial ledger

Ledger entries have a unique reference key. Posting the same reference is idempotent. Reversal marks the original entry `REVERSED` and posts a compensating entry with the opposite direction. This is evidence, not a claim that an external bank/payment provider has settled money.

## Worker model

Reverse-commerce jobs use `FOR UPDATE SKIP LOCKED`, leases and bounded exponential retry. Expired leases are recoverable. Jobs that exhaust five attempts become `DEAD` and remain queryable for operations.

## API security

All new endpoints resolve the current authenticated user. Customer reads are scoped to the authenticated customer. Operational mutation and worker execution require privileged roles. Mutations require an idempotency key. Responses are `no-store` and expose explicit `surfaceStatus` values.

## Provider boundary

V235 does not fabricate carrier, payment or external credit-provider success. Provider-dependent work remains upstream/downstream of this kernel and must be confirmed by a real provider integration before a workflow is considered externally settled.

## Resolution planning

The resolution planner reads the durable return, inspection, settlement, recovery, replacement and credit records and returns a machine-readable plan. It is intentionally advisory: a `READY` step is not permission to bypass authorization or state transitions.

## Reconciliation invariants

The reconciliation service checks for recovery overage, multiple active settlements, conflicting value outcomes, negative return-ledger exposure and credit balance overflow. Findings are classified as `INFO`, `WARNING` or `CRITICAL`. The service never silently repairs a contradiction; it exposes the evidence so an authorized operator can choose the compensating action.

## Operational principle

The V235 reverse-commerce layer treats money and stock as separate ledgers. Inventory quantity changes are represented in `trust_inventory_ledger`; financial value changes are represented in `trust_financial_ledger_entries`; customer store-credit balances are represented in `trust_store_credits` plus `trust_store_credit_transactions`. This prevents a warehouse unit count from being mistaken for a currency amount.
