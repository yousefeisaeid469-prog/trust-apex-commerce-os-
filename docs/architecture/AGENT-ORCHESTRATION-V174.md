# TRUST V174 — Agent Orchestration

V174 adds a tenant-scoped multi-agent coordination layer for commerce decisions. Specialized agents can be registered with bounded capabilities, tasks are routed by capability and policy, proposals are ranked and conflict-checked, and execution is idempotent and approval-aware.

The orchestrator is deliberately deterministic and policy-bounded: it does not invent permissions, bypass tenant isolation, or mutate external systems by itself.
