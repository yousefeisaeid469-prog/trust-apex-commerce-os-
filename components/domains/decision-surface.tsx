'use client';
import { Shell, ErrorState, LoadingState, Metric, useSurface } from './surface-primitives';
import type { SurfaceStatus } from '../../modules/platform/surface-status';

export default function DecisionSurface() {
  const s = useSurface('/api/decision-fabric');
  const status: SurfaceStatus = s.error ? 'ERROR' : s.data?.surfaceStatus ?? 'DEGRADED';
  const snapshot = s.data?.snapshot ?? {};
  return <Shell title="Decision Center" eyebrow="TRUST · DECISIONS" endpoint="/api/decision-fabric" status={status} refresh={s.refresh}>
    {s.loading ? <LoadingState /> : s.error ? <ErrorState message={s.error} /> : <>
      <div className="grid gap-3 md:grid-cols-3"><Metric label="Decisions" value={snapshot.decisions ?? snapshot.totalDecisions ?? '—'} /><Metric label="Policy" value={snapshot.policy ?? snapshot.policyStatus ?? '—'} /><Metric label="Evidence" value={snapshot.evidence ?? snapshot.evidenceStatus ?? '—'} /></div>
      <pre className="mt-6 overflow-auto rounded-2xl border border-white/10 bg-black/30 p-4 text-xs text-zinc-300">{JSON.stringify(snapshot, null, 2)}</pre>
    </>}
  </Shell>;
}
