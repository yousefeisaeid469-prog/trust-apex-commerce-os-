# TRUST V151 Kubernetes bootstrap

These manifests are intentionally explicit production starting points. Replace `YOUR_REGISTRY`, database secret material, TLS/Ingress configuration, and network egress rules for the target cluster. Apply with `kubectl apply -f deploy/kubernetes/` only after reviewing storage, secrets, ingress, RBAC, network policy, and backup requirements.
