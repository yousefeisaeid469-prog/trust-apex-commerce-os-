# TRUST V160 — Global Commerce Foundation

## What changed
- Global language registry with RTL/LTR direction handling and browser-safe fallback.
- Global currency discovery through `Intl.supportedValuesOf('currency')` where available.
- Currency formatting uses the requested ISO code instead of a five-currency hard limit.
- Unknown FX rates never become fake conversions: the storefront keeps EGP settlement and labels missing FX quotes.
- Language and display-currency preferences persist locally and update the document locale/direction.
- `/api/i18n` exposes the supported language/currency catalog for future server-rendered selectors and mobile clients.

## Honest production boundary
A storefront can display every currency code supported by the runtime, but **real settlement in every country/currency requires licensed payment providers, merchant acquiring, tax rules, sanctions screening, KYC/KYB, and payout rails for each market**. This release does not fake those integrations. Checkout remains EGP/COD in the existing Egypt flow.

## Next production integrations
1. FX provider with signed/server-side quotes and timestamp/TTL.
2. PSP adapters per market and currency.
3. Tax/VAT/GST engine by jurisdiction.
4. Shipping carriers and customs/duties engine.
5. Translation memory + human-reviewed locale catalogs.
6. Search/recommendation ranking with regional policy controls.
