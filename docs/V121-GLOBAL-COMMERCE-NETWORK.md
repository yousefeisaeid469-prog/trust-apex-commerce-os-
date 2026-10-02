# TRUST V121 — Global Commerce Network

## Objective
Turn TRUST from a single marketplace surface into a network layer where verified merchants can expose inventory while customers retain one trust, cart, and post-purchase experience.

## Core primitives
1. Seller identity and status graph.
2. Network inventory offers.
3. Universal cart with explicit split-order semantics.
4. Cross-border quote composition for shipping/duties.
5. Seller reputation graph.

## Production boundaries
Live KYC, carrier rates, FX, duties/tax, customs, payment settlement, and international returns require real providers. V121 deliberately returns `liveProvidersConnected: false` until those integrations are configured and tested.

## Invariants
- Suspended sellers cannot rank as purchasable network sellers.
- Unverified offers cannot be quoted as purchasable.
- Mixed currencies require an explicit FX boundary.
- Cart split count reflects distinct sellers.
- Reputation dimensions retain sample size to prevent score-only interpretation.
