'use client';
import { Shell, ErrorState, LoadingState, Metric, useSurface } from './surface-primitives';
import type { SurfaceStatus } from '../../modules/platform/surface-status';
export default function FulfillmentControlTowerSurface(){
 const s=useSurface('/api/fulfillment/control-tower'); const status:SurfaceStatus=s.error?'ERROR':s.data?.surfaceStatus??'DEGRADED'; const d=s.data??{}; const sum=d.summary??{};
 const statuses=Array.isArray(d.statuses)?d.statuses:[], providers=Array.isArray(d.providers)?d.providers:[], exceptions=Array.isArray(d.exceptions)?d.exceptions:[], reconciliation=Array.isArray(d.reconciliation)?d.reconciliation:[];
 return <Shell title="Fulfillment Control Tower" eyebrow="TRUST · V233" endpoint="/api/fulfillment/control-tower" status={status} refresh={s.refresh}>
  {s.loading?<LoadingState/>:s.error?<ErrorState message={s.error}/>:<>
   <div className="grid gap-3 md:grid-cols-4"><Metric label="Active shipments" value={sum.activeShipments??0}/><Metric label="Late" value={sum.lateShipments??0}/><Metric label="Exceptions" value={sum.exceptions??0}/><Metric label="Reconciliation backlog" value={sum.reconciliationBacklog??0}/></div>
   <div className="mt-6 grid gap-4 lg:grid-cols-2">
    <section className="rounded-2xl border border-white/10 p-4"><h2 className="font-semibold">Shipment pipeline</h2><div className="mt-3 space-y-2">{statuses.map((x:any)=><div key={x.status} className="flex justify-between rounded-xl bg-white/5 px-3 py-2 text-sm"><span>{x.status}</span><b>{x.count}</b></div>)}</div></section>
    <section className="rounded-2xl border border-white/10 p-4"><h2 className="font-semibold">Provider posture</h2><div className="mt-3 space-y-2">{providers.map((x:any)=><div key={x.carrier} className="rounded-xl bg-white/5 p-3"><div className="flex justify-between"><b>{x.carrier}</b><span>{x.shipments} shipments</span></div><div className="mt-1 text-xs text-zinc-400">Tracked {x.tracked} · Exceptions {x.exceptions}</div></div>)}</div></section>
    <section className="rounded-2xl border border-white/10 p-4"><h2 className="font-semibold">Exceptions</h2><div className="mt-3 space-y-2">{exceptions.length?exceptions.map((x:any)=><div key={x.exception_code} className="flex justify-between text-sm"><span>{x.exception_code??'UNKNOWN'}</span><b>{x.count}</b></div>):<div className="text-sm text-zinc-400">No recorded exceptions.</div>}</div></section>
    <section className="rounded-2xl border border-white/10 p-4"><h2 className="font-semibold">Reconciliation queue</h2><div className="mt-3 space-y-2">{reconciliation.map((x:any)=><div key={x.status} className="flex justify-between text-sm"><span>{x.status}</span><b>{x.count}</b></div>)}</div></section>
   </div>
  </>}
 </Shell>
}
