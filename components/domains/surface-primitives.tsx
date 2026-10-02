'use client';

import { useEffect, useState } from 'react';
import type { SurfaceStatus } from '../../modules/platform/surface-status';

export const statusLabels: Record<SurfaceStatus, string> = {
  LIVE: 'LIVE',
  FOUNDATION: 'FOUNDATION',
  SIMULATION: 'SIMULATION',
  PROVIDER_REQUIRED: 'PROVIDER REQUIRED',
  DEGRADED: 'DEGRADED',
  ERROR: 'ERROR',
};

export function Status({ status }: { status: SurfaceStatus }) {
  return <span className="rounded-full border border-white/15 px-3 py-1 text-xs font-semibold tracking-wide">{statusLabels[status]}</span>;
}

export function useSurface(endpoint: string) {
  const [state, setState] = useState<{ loading: boolean; error?: string; data?: any }>({ loading: true });
  const [refresh, setRefresh] = useState(0);
  useEffect(() => {
    let alive = true;
    setState({ loading: true });
    fetch(endpoint, { cache: 'no-store', headers: { Accept: 'application/json' } })
      .then(async r => {
        const data = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(String(data?.error ?? `HTTP_${r.status}`));
        return data;
      })
      .then(data => alive && setState({ loading: false, data }))
      .catch(e => alive && setState({ loading: false, error: e instanceof Error ? e.message : 'REQUEST_FAILED' }));
    return () => { alive = false; };
  }, [endpoint, refresh]);
  return { ...state, refresh: () => setRefresh(x => x + 1) };
}

export function Shell({ title, eyebrow, endpoint, status, refresh, children }: {
  title: string; eyebrow: string; endpoint: string; status?: SurfaceStatus; refresh: () => void; children?: React.ReactNode;
}) {
  return <main className="min-h-screen bg-[#050505] px-4 py-8 text-white md:px-8 md:py-12">
    <div className="mx-auto max-w-7xl">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div><div className="text-xs font-semibold uppercase tracking-[.32em] text-[#D4AF37]">{eyebrow}</div><h1 className="mt-3 text-4xl font-semibold tracking-tight md:text-5xl">{title}</h1></div>
        <div className="flex items-center gap-2"><button onClick={refresh} className="rounded-xl border border-white/15 bg-white/[.05] px-4 py-2 text-sm hover:bg-white/10">Refresh</button>{status && <Status status={status} />}</div>
      </header>
      <div className="mt-8 rounded-3xl border border-white/10 bg-white/[.025] p-5 md:p-7">
        <div className="font-mono text-xs text-zinc-500">{endpoint}</div>
        <div className="mt-6">{children}</div>
      </div>
    </div>
  </main>;
}

export function ErrorState({ message }: { message: string }) {
  return <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-5"><div className="font-semibold">Data unavailable</div><div className="mt-2 text-sm text-red-200/70">{message}</div><div className="mt-3 text-xs text-zinc-500">The UI does not substitute demo data.</div></div>;
}

export function LoadingState() {
  return <div className="grid gap-3 md:grid-cols-3">{[1,2,3].map(i => <div key={i} className="h-28 animate-pulse rounded-2xl bg-white/[.04]" />)}</div>;
}

export function Metric({ label, value }: { label: string; value: React.ReactNode }) {
  return <div className="rounded-2xl border border-white/10 bg-white/[.02] p-4"><div className="text-xs uppercase tracking-wider text-zinc-500">{label}</div><div className="mt-2 text-2xl font-semibold">{value}</div></div>;
}
