# TRUST V151 — Production Bootstrap

V151 turns the production-control-plane contracts into an executable deployment bootstrap surface. It adds a real container build, production Compose stack (PostgreSQL + OTLP collector + app), Kubernetes manifests, Helm packaging, component readiness probes, cryptographic bootstrap evidence, migration 041, and an executable integration harness.

## Boundary

The artifacts are real and runnable, but infrastructure access still requires the operator to supply a real registry image, Kubernetes cluster, secrets, database credentials, traffic endpoint, TLS termination, backups, and network policy appropriate to the target environment. No fake credentials or simulated production claims are embedded.
