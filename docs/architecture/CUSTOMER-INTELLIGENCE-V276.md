# Customer Intelligence V276

TRUST uses a bounded first-party preference profile for marketplace discovery. A browser receives a random marketplace session identifier; only its SHA-256 digest is stored. Product-view events update category counts and aggregate price observations. Search computes a small organic boost for category affinity and price proximity. Cold-start traffic receives no personalization boost. Sponsored placement is a separate concern and is never folded into the organic score.
