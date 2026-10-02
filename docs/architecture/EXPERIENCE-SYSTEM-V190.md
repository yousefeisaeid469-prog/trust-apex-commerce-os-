# TRUST Experience System — V190

V190 upgrades the shared application chrome without changing commerce, payment, provider, or database semantics.

## Changes
- Route-aware context chip identifies the current TRUST surface.
- Recent route memory is local-only and limited to five paths.
- A global scroll-progress indicator improves orientation on long operational pages.
- The existing command palette, accessibility layer, mobile navigation, and offline indicator remain intact.
- Admin-login and customer-login surfaces are excluded from the route-context chip to avoid distracting from authentication.

## Privacy
Recent routes are stored only in browser local storage. No identity, analytics profile, or server-side tracking is introduced by V190.
