# TRUST V149 — Production Infrastructure

V149 crosses the production-adapter boundary without pretending that infrastructure is available when it is not. It defines executable contracts for deployment, traffic control, idempotency, locking and post-deploy verification.

## Real integration surface
- Kubernetes REST adapter uses the Kubernetes Apps API through `fetch`.
- Traffic control is a provider-neutral HTTP adapter so a real service mesh, CDN, load balancer or internal routing API can be connected without changing orchestration logic.
- Deployment orchestration is fail-closed: preflight, deploy, traffic shift, promotion and verification are mandatory.
- Any failed post-deploy phase attempts rollback and independently verifies recovery.
- Idempotency and locks prevent duplicate or concurrent ownership in the reference runtime; production persistence should use the V149 SQL table or an equivalent transactional store.

## Production truth
A live deployment still requires real cluster/API endpoints, credentials, RBAC, network reachability, a traffic provider and durable persistence. V149 contains the integration code and executable contracts; it does not fabricate those external resources.
