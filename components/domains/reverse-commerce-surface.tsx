'use client';
import { Shell, ErrorState, LoadingState, Metric, useSurface } from './surface-primitives';
import type { SurfaceStatus } from '../../modules/platform/surface-status';

type Dashboard = {
  exposure?: { returnCount:number; refundExposure:number; openReturns:number; agingOver72Hours:number };
  recovery?: { applied:number; reversed:number; failed:number; appliedDelta:number; reversedDelta:number };
  replacements?: { total:number; failed:number; delivered:number; active:number; averageDeliveryHours:number };
  credits?: { credits:number; issued:number; outstanding:number; redeemed:number };
};

function money(value: unknown) { return `${Number(value || 0).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})} EGP`; }
function Pill({value}:{value:string}) { return <span className="rounded-full border border-white/10 px-2 py-1 text-xs">{value}</span>; }

export default function ReverseCommerceSurface() {
  const s = useSurface('/api/returns/reverse-commerce');
  const status: SurfaceStatus = s.error ? 'ERROR' : s.data?.surfaceStatus ?? 'DEGRADED';
  const d: Dashboard = s.data || {};
  return <Shell title="Reverse Commerce Control Room" eyebrow="TRUST · V235" endpoint="/api/returns/reverse-commerce" status={status} refresh={s.refresh}>
    {s.loading ? <LoadingState /> : s.error ? <ErrorState message={s.error} /> : <>
      <div className="grid gap-3 md:grid-cols-4">
        <Metric label="Refund exposure" value={money(d.exposure?.refundExposure)} />
        <Metric label="Open returns" value={d.exposure?.openReturns ?? 0} />
        <Metric label="Recovery delta" value={d.recovery?.appliedDelta ?? 0} />
        <Metric label="Credit outstanding" value={money(d.credits?.outstanding)} />
      </div>
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <section className="rounded-2xl border border-white/10 p-5">
          <div className="flex items-center justify-between"><h2 className="font-semibold">Inventory recovery</h2><Pill value={`${d.recovery?.failed ?? 0} failed`} /></div>
          <div className="mt-4 grid grid-cols-3 gap-3 text-sm"><div><div className="text-zinc-500">Applied</div><strong>{d.recovery?.applied ?? 0}</strong></div><div><div className="text-zinc-500">Reversed</div><strong>{d.recovery?.reversed ?? 0}</strong></div><div><div className="text-zinc-500">Units restored</div><strong>{d.recovery?.appliedDelta ?? 0}</strong></div></div>
        </section>
        <section className="rounded-2xl border border-white/10 p-5">
          <div className="flex items-center justify-between"><h2 className="font-semibold">Replacement pipeline</h2><Pill value={`${d.replacements?.active ?? 0} active`} /></div>
          <div className="mt-4 grid grid-cols-3 gap-3 text-sm"><div><div className="text-zinc-500">Total</div><strong>{d.replacements?.total ?? 0}</strong></div><div><div className="text-zinc-500">Delivered</div><strong>{d.replacements?.delivered ?? 0}</strong></div><div><div className="text-zinc-500">Avg hours</div><strong>{Number(d.replacements?.averageDeliveryHours ?? 0).toFixed(1)}</strong></div></div>
        </section>
        <section className="rounded-2xl border border-white/10 p-5">
          <div className="flex items-center justify-between"><h2 className="font-semibold">Store credit</h2><Pill value={`${d.credits?.credits ?? 0} accounts`} /></div>
          <div className="mt-4 grid grid-cols-3 gap-3 text-sm"><div><div className="text-zinc-500">Issued</div><strong>{money(d.credits?.issued)}</strong></div><div><div className="text-zinc-500">Redeemed</div><strong>{money(d.credits?.redeemed)}</strong></div><div><div className="text-zinc-500">Outstanding</div><strong>{money(d.credits?.outstanding)}</strong></div></div>
        </section>
        <section className="rounded-2xl border border-white/10 p-5">
          <div className="flex items-center justify-between"><h2 className="font-semibold">Risk queue</h2><Pill value={`${d.exposure?.agingOver72Hours ?? 0} &gt;72h`} /></div>
          <p className="mt-4 text-sm text-zinc-400">Reverse-commerce actions remain durable, idempotent and auditable. Provider-dependent refunds and labels are not represented as successful until their provider boundaries confirm them.</p>
        </section>
      </div>
    </>}
  </Shell>;
}
