# TRUST V144 — Autonomous Reliability Loop

V144 extends V143 from continuous reliability evaluation into an executable runtime control loop.

Core capabilities:
- Detect → Decide → Act → Verify → Learn control lifecycle
- incident creation and severity classification
- explicit blast-radius targeting
- rollout freeze
- service isolation
- tenant isolation
- mitigation execution contract
- rollback and escalation paths
- recovery verification before resume
- enforcement receipts and evidence hashing
- explicit AGENT_KILL vs GLOBAL_KILL_SWITCH semantics
- V144 version identity with no V129 drift

Production note: live infrastructure enforcement requires a deployment-specific `RuntimeEnforcer` implementation. The default test adapter is in-process and deterministic; it is not represented as a live production integration.
