# Marketplace 2.0 — V191

V191 adds an explainable ranking layer to the main Marketplace. Featured results are ranked from the current catalog using query overlap, preferred tags, rating, availability, advertised discount, and budget fit. The output includes a bounded match score and up to three reasons so the UI does not present an unexplained “AI” score.

The module is deterministic and provider-free. It does not claim machine-learning inference, external recommendation APIs, or production personalization beyond the local inputs supplied by the page.
