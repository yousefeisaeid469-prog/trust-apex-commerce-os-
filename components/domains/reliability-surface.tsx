'use client';
import { Shell, ErrorState, LoadingState, Metric, useSurface } from './surface-primitives';
import type { SurfaceStatus } from '../../modules/platform/surface-status';

export default function ReliabilitySurface() {
  const s = useSurface('/api/global-reliability');
  const status: SurfaceStatus = s.error ? 'ERROR' : s.data?.surfaceStatus ?? 'DEGRADED';
  const r = s.data?.report ?? {};
  const regions = Array.isArray(r.regions) ? r.regions : [];
  const objectives = Array.isArray(r.objectives) ? r.objectives : [];
  return <Shell title="Global Reliability" eyebrow="TRUST · RELIABILITY" endpoint="/api/global-reliability" status={status} refresh={s.refresh}>
    {s.loading ? <LoadingState /> : s.error ? <ErrorState message={s.error} /> : <>
      <div className="grid gap-3 md:grid-cols-3"><Metric label="Regions" value={regions.length} /><Metric label="Recovery objectives" value={objectives.length} /><Metric label="Evidence" value={objectives[0]?.evidenceStatus ?? '—'} /></div>
      <div className="mt-6 grid gap-3 md:grid-cols-2">{objectives.map((o:any,i:number)=><article key={o.service ?? i} className="rounded-2xl border border-white/10 p-4"><div className="font-semibold">{o.service ?? 'Service'}</div><div className="mt-2 text-sm text-zinc-400">RTO {o.rtoMinutes ?? '—'} min · RPO {o.rpoMinutes ?? '—'} min</div><div className="mt-2 text-xs text-zinc-500">Evidence: {o.evidenceStatus ?? 'UNKNOWN'}</div></article>)}</div>
    </>}
  </Shell>;
}
