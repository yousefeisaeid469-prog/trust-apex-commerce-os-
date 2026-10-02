# Financial Architecture Correctness — V287

## Disputes

A dispute is opened against a captured payment. TRUST derives the seller set from durable `SELLER_CREDIT` ledger entries, then writes an immutable allocation per seller. A multi-seller order therefore never relies on a single `merchant_id` to determine who bears a lost dispute.

## Payout reconciliation

Provider settlement first produces MATCHED or MISMATCH detection. A mismatch then follows a durable workflow: OPEN → INVESTIGATING → EVIDENCE_REVIEW → ADJUSTMENT_PENDING → RESOLVED. Resolution can accept a signed/operator-approved variance adjustment or require provider retry.

## Provider-event idempotency

`provider + provider_event_id` is an independent replay identity from the caller idempotency key. Repeated identical events return the original reconciliation; conflicting payloads fail closed.

## Currency

The current seller balance model is single-currency per merchant. V287 therefore rejects payout requests in a different currency and rejects settlement into an existing seller balance bucket whose currency differs. This is a deliberate safety boundary until a future multi-currency balance model is introduced.

## Ledger ownership

`PLATFORM_FEE` belongs to the platform account and has no merchant owner. `SELLER_CREDIT`, seller fees, refunds, chargebacks, payouts, holds, releases and payout adjustments require a merchant owner. Seller statements aggregate only seller-owned ledger rows, so platform revenue cannot inflate a seller statement.
