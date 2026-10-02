'use client';

import { useEffect, useMemo, useState } from 'react';
import type { SurfaceStatus } from '../modules/platform/surface-status';

type FeatureSurfaceProps = {
  title: string;
  eyebrow: string;
  description: string;
  endpoint: string;
  accent?: string;
};

type State = { loading: boolean; error?: string; data?: unknown };

const STATUS_LABELS: Record<SurfaceStatus, string> = {
  LIVE: 'LIVE',
  FOUNDATION: 'FOUNDATION',
  SIMULATION: 'SIMULATION',
  PROVIDER_REQUIRED: 'PROVIDER REQUIRED',
  DEGRADED: 'DEGRADED',
  ERROR: 'ERROR',
};

function prettyKey(key: string) {
  return key.replaceAll('_', ' ').replaceAll('-', ' ').replace(/\b\w/g, c => c.toUpperCase());
}

function summarize(value: unknown): string {
  if (value === null || value === undefined) return '—';
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (Array.isArray(value)) return `${value.length} item${value.length === 1 ? '' : 's'}`;
  return `${Object.keys(value as Record<string, unknown>).length} fields`;
}

function DataBlock({ value, depth = 0 }: { value: unknown; depth?: number }) {
  if (depth > 2) return <pre className="overflow-auto text-xs text-zinc-400">{JSON.stringify(value, null, 2)}</pre>;
  if (value === null || value === undefined || typeof value !== 'object') return <span>{summarize(value)}</span>;
  if (Array.isArray(value)) {
    return <div className="grid gap-2">{value.slice(0, 8).map((item, i) => <div key={i} className="rounded-xl border border-white/10 bg-white/[.025] p-3"><DataBlock value={item} depth={depth + 1} /></div>)}{value.length > 8 && <span className="text-xs text-zinc-500">Showing 8 of {value.length}</span>}</div>;
  }
  return <div className="grid gap-2 md:grid-cols-2">{Object.entries(value as Record<string, unknown>).filter(([key]) => key !== 'surfaceStatus').map(([key, item]) => <div key={key} className="rounded-xl border border-white/10 bg-white/[.025] p-3"><div className="text-[11px] uppercase tracking-wider text-zinc-500">{prettyKey(key)}</div><div className="mt-1 break-words text-sm text-zinc-200"><DataBlock value={item} depth={depth + 1} /></div></div>)}</div>;
}

function resolveStatus(data: unknown): SurfaceStatus {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return 'DEGRADED';
  const raw = (data as Record<string, unknown>).surfaceStatus;
  if (raw === 'LIVE' || raw === 'FOUNDATION' || raw === 'SIMULATION' || raw === 'PROVIDER_REQUIRED' || raw === 'DEGRADED' || raw === 'ERROR') return raw;
  const mode = (data as Record<string, unknown>).mode;
  if (mode === 'simulation' || mode === 'simulated') return 'SIMULATION';
  return 'DEGRADED';
}

function StatusBadge({ status }: { status: SurfaceStatus }) {
  return <div className="rounded-full border border-white/10 px-3 py-1 text-xs font-semibold tracking-wide">{STATUS_LABELS[status]}</div>;
}

export default function FeatureSurface({ title, eyebrow, description, endpoint, accent = '#D4AF37' }: FeatureSurfaceProps) {
  const [state, setState] = useState<State>({ loading: true });
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    let alive = true;
    setState({ loading: true });
    fetch(endpoint, { cache: 'no-store', headers: { Accept: 'application/json' } })
      .then(async response => {
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(String(data?.error ?? `HTTP_${response.status}`));
        return data;
      })
      .then(data => { if (alive) setState({ loading: false, data }); })
      .catch(error => { if (alive) setState({ loading: false, error: error instanceof Error ? error.message : 'REQUEST_FAILED' }); });
    return () => { alive = false; };
  }, [endpoint, refresh]);

  const topKeys = useMemo(() => state.data && typeof state.data === 'object' && !Array.isArray(state.data) ? Object.keys(state.data as Record<string, unknown>).filter(key => key !== 'surfaceStatus').slice(0, 6) : [], [state.data]);
  const status = state.error ? 'ERROR' : state.loading ? undefined : resolveStatus(state.data);

  return <main className="min-h-screen bg-[#050505] px-4 py-8 text-white md:px-8 md:py-12">
    <div className="mx-auto max-w-7xl">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="text-xs font-semibold uppercase tracking-[.32em]" style={{ color: accent }}>{eyebrow}</div>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight md:text-5xl">{title}</h1>
          <p className="mt-3 max-w-3xl text-zinc-400">{description}</p>
        </div>
        <button onClick={() => setRefresh(x => x + 1)} className="rounded-xl border border-white/15 bg-white/[.05] px-4 py-2 text-sm hover:bg-white/10">Refresh</button>
      </div>

      <section className="mt-8 rounded-3xl border border-white/10 bg-white/[.025] p-5 md:p-7">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div><div className="text-xs uppercase tracking-wider text-zinc-500">Authoritative endpoint</div><div className="mt-1 font-mono text-sm text-zinc-300">{endpoint}</div></div>
          {status ? <StatusBadge status={status} /> : <div className="rounded-full border border-white/10 px-3 py-1 text-xs text-zinc-400">LOADING</div>}
        </div>
        {state.loading && <div className="mt-6 grid gap-3 md:grid-cols-3">{[1,2,3].map(i => <div key={i} className="h-24 animate-pulse rounded-2xl bg-white/[.04]" />)}</div>}
        {!state.loading && state.error && <div className="mt-6 rounded-2xl border border-red-500/20 bg-red-500/5 p-5"><div className="font-semibold">The feature did not return usable data.</div><div className="mt-2 text-sm text-red-200/70">{state.error}</div><div className="mt-3 text-xs text-zinc-500">No demo data was substituted.</div></div>}
        {!state.loading && !state.error && state.data !== undefined && <>
          {topKeys.length > 0 && <div className="mt-5 grid gap-3 md:grid-cols-3">{topKeys.map(key => <div key={key} className="rounded-2xl border border-white/10 p-4"><div className="text-xs text-zinc-500">{prettyKey(key)}</div><div className="mt-2 text-xl font-semibold"><DataBlock value={(state.data as Record<string, unknown>)[key]} depth={0} /></div></div>)}</div>}
          <div className="mt-5"><DataBlock value={state.data} /></div>
        </>}
      </section>
    </div>
  </main>;
}
