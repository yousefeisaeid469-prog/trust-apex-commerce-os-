# TRUST V173 — Closed-Loop Learning

V173 closes the loop between predicted outcomes and observed reality. Predictions are calibrated against tenant-scoped outcomes, error/drift is measured, and autonomy recommendations are bounded by explicit policy thresholds.

The learning loop is advisory: it cannot directly mutate production state. Increasing autonomy requires sufficient clean evidence and policy gates; degraded calibration recommends lowering autonomy.

Flow: Predict → Observe → Calibrate → Measure Error/Drift → Recommend → Policy Gate → Learn.
