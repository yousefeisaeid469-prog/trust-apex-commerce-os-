'use client';
import { Shell, ErrorState, LoadingState, Metric, useSurface } from './surface-primitives';
import type { SurfaceStatus } from '../../modules/platform/surface-status';

export default function AgentsSurface() {
  const s = useSurface('/api/agents');
  const status: SurfaceStatus = s.error ? 'ERROR' : s.data?.surfaceStatus ?? 'DEGRADED';
  const agents = Array.isArray(s.data?.agents) ? s.data.agents : [];
  const decisions = Array.isArray(s.data?.decisions) ? s.data.decisions : [];
  return <Shell title="Agents" eyebrow="TRUST · AGENTS" endpoint="/api/agents" status={status} refresh={s.refresh}>
    {s.loading ? <LoadingState /> : s.error ? <ErrorState message={s.error} /> : <>
      <div className="grid gap-3 md:grid-cols-3"><Metric label="Registered agents" value={agents.length} /><Metric label="Decisions" value={decisions.length} /><Metric label="Policy" value={s.data?.executionPolicy ?? '—'} /></div>
      <div className="mt-6 grid gap-3 md:grid-cols-2">{agents.map((a:any,i:number)=><article key={a.id ?? a.name ?? i} className="rounded-2xl border border-white/10 p-4"><div className="font-semibold">{a.name ?? a.id ?? `Agent ${i+1}`}</div><div className="mt-2 text-sm text-zinc-400">{a.description ?? a.role ?? 'Registered agent'}</div></article>)}</div>
    </>}
  </Shell>;
}
