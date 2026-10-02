# TRUST V151 — Production Bootstrap Architecture

V151 supplies the operational activation layer around the V150 control plane: immutable container build, PostgreSQL-backed runtime dependency, OTLP collector, Kubernetes deployment manifests, Helm packaging, readiness probes, network-policy baseline, and a bootstrap validator.

## Real integration path

`TRUST -> PostgreSQL -> Kubernetes API -> traffic provider -> telemetry -> control-plane evidence`

The bootstrap validator fails closed if a required dependency is unavailable. It validates configuration for PostgreSQL and performs HTTP reachability probes for Kubernetes, traffic control, and telemetry health endpoints.

## Operator-owned production inputs

- container registry and signed image
- Kubernetes credentials/RBAC
- PostgreSQL credentials, backups and HA policy
- traffic/service-mesh endpoint
- TLS certificates and termination
- OTLP collector/backend
- network egress/ingress rules
- secret manager integration

The repository deliberately contains no real credentials.
