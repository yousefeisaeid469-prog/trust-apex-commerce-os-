'use client';
import { Shell, ErrorState, LoadingState, Metric, useSurface } from './surface-primitives';
import type { SurfaceStatus } from '../../modules/platform/surface-status';

export default function FinanceSurface() {
  const s = useSurface('/api/revenue-intelligence');
  const status: SurfaceStatus = s.error ? 'ERROR' : s.data?.surfaceStatus ?? 'DEGRADED';
  const plan = s.data?.plan ?? {};
  const programs = Array.isArray(plan.programs) ? plan.programs : Array.isArray(plan.recommendations) ? plan.recommendations : [];
  return <Shell title="Revenue Intelligence" eyebrow="TRUST · REVENUE" endpoint="/api/revenue-intelligence" status={status} refresh={s.refresh}>
    {s.loading ? <LoadingState /> : s.error ? <ErrorState message={s.error} /> : <>
      <div className="grid gap-3 md:grid-cols-3"><Metric label="Programs" value={programs.length} /><Metric label="Mode" value={status} /><Metric label="Decision gate" value="Evidence required" /></div>
      <div className="mt-6 grid gap-3 md:grid-cols-2">{programs.slice(0,8).map((p:any,i:number)=><article key={p.programId ?? i} className="rounded-2xl border border-white/10 p-4"><div className="font-semibold">{p.programId ?? p.name ?? `Program ${i+1}`}</div><div className="mt-2 text-sm text-zinc-400">{p.score != null ? `Score ${p.score}` : p.expectedValue != null ? `Expected value ${p.expectedValue}` : 'Recommendation available'}</div></article>)}</div>
    </>}
  </Shell>;
}
