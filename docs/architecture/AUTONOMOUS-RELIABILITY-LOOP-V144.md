# TRUST V144 — Autonomous Reliability Loop

V144 closes the architectural gap between reliability evidence and runtime control. The loop is modeled as:

**Detect → Decide → Act → Verify → Learn**

## Runtime control lifecycle

1. A reliability signal identifies an SLO/replay/new-failure breach.
2. The control plane opens an incident and computes an explicit blast radius.
3. Rollouts are frozen; affected services and tenants can be isolated.
4. A mitigation is executed through a runtime-enforcer contract.
5. Recovery evidence is evaluated against the same reliability policy.
6. Recovery permits rollout resume; failed recovery triggers rollback and escalation.
7. Every enforcement step produces an evidence receipt and the run receives a deterministic evidence hash.
8. The learn phase records a policy-learning hash so recurring failures can feed future policy/corpus decisions.

## Safety boundary

V144 does not pretend that an in-process adapter is live production infrastructure. `InMemoryRuntimeEnforcer` is executable integration evidence. A production deployment supplies an implementation of `RuntimeEnforcer` connected to its orchestrator, rollout controller, service mesh, tenant isolation plane, incident system, and telemetry backend. `FailClosedRuntimeEnforcer` rejects actions when no live adapter exists.

## Control semantics

Agent-level `KILLED` is reported as `AGENT_KILL`. The global kill switch is a separate aggregate condition. Additional runtime scopes are explicit: service freeze, tenant isolation, and rollout freeze.
