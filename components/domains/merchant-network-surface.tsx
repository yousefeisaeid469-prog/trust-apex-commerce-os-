'use client';
import { Shell, ErrorState, LoadingState, Metric, useSurface } from './surface-primitives';
import type { SurfaceStatus } from '../../modules/platform/surface-status';

export default function MerchantNetworkSurface() {
  const s = useSurface('/api/merchant-supergraph');
  const status: SurfaceStatus = s.error ? 'ERROR' : s.data?.surfaceStatus ?? 'DEGRADED';
  const graph = s.data?.graph ?? {};
  const routes = Array.isArray(s.data?.routes) ? s.data.routes : [];
  return <Shell title="Merchant Supergraph" eyebrow="TRUST · SELLER GRAPH" endpoint="/api/merchant-supergraph" status={status} refresh={s.refresh}>
    {s.loading ? <LoadingState /> : s.error ? <ErrorState message={s.error} /> : <>
      <div className="grid gap-3 md:grid-cols-3"><Metric label="Merchants" value={graph.merchants ?? '—'} /><Metric label="Offers" value={graph.offers ?? '—'} /><Metric label="Product edges" value={graph.productEdges ?? '—'} /></div>
      <div className="mt-6"><h2 className="font-semibold">Offer routes</h2><div className="mt-3 grid gap-3 md:grid-cols-2">{routes.map((r:any,i:number)=><article key={r.offerId ?? r.sellerId ?? i} className="rounded-2xl border border-white/10 p-4"><div className="font-semibold">{r.displayName ?? r.sellerId ?? 'Route'}</div><div className="mt-2 text-sm text-zinc-400">{r.currency ?? ''} {r.priceMinor ?? r.price ?? '—'} · ETA {r.etaDays ?? '—'} days</div></article>)}</div></div>
      <p className="mt-6 text-xs text-zinc-500">Algorithm output is shown separately from provider/data-source state. Demo merchants are not labeled as live network members.</p>
    </>}
  </Shell>;
}
