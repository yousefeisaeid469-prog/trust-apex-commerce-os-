# V348 — Payout Protection & Seller Balance Engine

- Added durable payout eligibility snapshots with released-order backing and balance caps.
- Added payout eligibility holds tied to payout lifecycle.
- Added seller-order/reason allocations for every payout, including non-order available funds.
- Payout requests now fail closed when funds are not released/eligible.
- Eligibility exposes pending seller orders, dispute holds, return exposure, refund-provider exposure and existing payout holds without double-counting those holds against available balance.
- Added merchant payout eligibility API and finance response surface.
- Added source regression coverage.

Runtime: V348.0.0
Migration: 180_v348_payout_protection.sql
