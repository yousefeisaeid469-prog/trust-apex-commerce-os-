# TRUST APEX OS — V325

## Release
`325.0.0`

## Purpose
Financial integrity closure for the real commerce settlement path.

## Concrete changes
- Added `merchandise_gross` to marketplace payment settlements.
- Backfilled existing settlements from seller net + fee components.
- Corrected financial-close gross-split validation to compare merchandise gross against seller net + platform/payment/fulfillment/return fees.
- Corrected proportional refund reversal to use merchandise gross.
- Aligned settlement status constraint with runtime `REVERSED` behavior.
- Preserved all existing V319–V324 APIs and capabilities.

## Verification
- V325 source test is included.
- This archive still does not contain production database credentials or external provider credentials; live PostgreSQL/provider E2E remains an environment-level verification step, not a source-level PASS claim.
