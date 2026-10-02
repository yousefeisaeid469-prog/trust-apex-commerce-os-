'use client';
import { Shell, ErrorState, LoadingState, Metric, useSurface } from './surface-primitives';
import type { SurfaceStatus } from '../../modules/platform/surface-status';

export default function OrdersSurface() {
  const s = useSurface('/api/orders');
  const status: SurfaceStatus = s.error ? 'ERROR' : s.data?.surfaceStatus ?? 'DEGRADED';
  const items = Array.isArray(s.data?.items) ? s.data.items : [];
  const byStatus = items.reduce((a: Record<string, number>, o: any) => { a[o.status] = (a[o.status] ?? 0) + 1; return a; }, {});
  return <Shell title="Orders" eyebrow="TRUST · ORDERS" endpoint="/api/orders" status={status} refresh={s.refresh}>
    {s.loading ? <LoadingState /> : s.error ? <ErrorState message={s.error} /> : <>
      <div className="grid gap-3 md:grid-cols-3"><Metric label="Orders returned" value={items.length} /><Metric label="Total" value={s.data?.total ?? items.length} /><Metric label="Status buckets" value={Object.keys(byStatus).length} /></div>
      <div className="mt-6 overflow-x-auto rounded-2xl border border-white/10"><table className="w-full text-sm"><thead><tr className="border-b border-white/10 text-right text-zinc-500"><th className="p-4">Order</th><th className="p-4">Status</th><th className="p-4">Total</th><th className="p-4">Currency</th></tr></thead><tbody>{items.map((o:any)=><tr key={o.id} className="border-b border-white/5"><td className="p-4 font-mono">{o.id}</td><td className="p-4">{o.status}</td><td className="p-4">{o.total}</td><td className="p-4">{o.currency}</td></tr>)}</tbody></table></div>
    </>}
  </Shell>;
}
