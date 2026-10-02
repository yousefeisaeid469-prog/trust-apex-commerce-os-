'use client';
import { Shell, ErrorState, LoadingState, Metric, useSurface } from './surface-primitives';
import type { SurfaceStatus } from '../../modules/platform/surface-status';

export default function AIQualitySurface() {
  const s = useSurface('/api/ai-quality');
  const status: SurfaceStatus = s.error ? 'ERROR' : s.data?.surfaceStatus ?? 'DEGRADED';
  return <Shell title="AI Quality" eyebrow="TRUST · AI QUALITY" endpoint="/api/ai-quality" status={status} refresh={s.refresh}>
    {s.loading ? <LoadingState /> : s.error ? <ErrorState message={s.error} /> : <>
      <div className="grid gap-3 md:grid-cols-3"><Metric label="Evaluation" value={s.data?.status ?? '—'} /><Metric label="Drift check" value={s.data?.driftCheck ? 'ENABLED' : '—'} /><Metric label="Business impact" value={s.data?.businessImpactCheck ? 'ENABLED' : '—'} /></div>
      <p className="mt-6 rounded-2xl border border-white/10 p-4 text-sm text-zinc-400">Evaluation is exposed as a contract state until a durable evaluation provider is connected. No fabricated score is displayed.</p>
    </>}
  </Shell>;
}
