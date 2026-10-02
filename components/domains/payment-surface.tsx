'use client';
import { Shell, ErrorState, LoadingState, Metric, useSurface } from './surface-primitives';
import type { SurfaceStatus } from '../../modules/platform/surface-status';

export default function PaymentSurface() {
  const s = useSurface('/api/payments');
  const status: SurfaceStatus = s.error ? 'ERROR' : s.data?.surfaceStatus ?? 'DEGRADED';
  return <Shell title="Payments" eyebrow="TRUST · PAYMENTS" endpoint="/api/payments" status={status} refresh={s.refresh}>
    {s.loading ? <LoadingState /> : s.error ? <ErrorState message={s.error} /> : <>
      <div className="grid gap-3 md:grid-cols-3"><Metric label="Provider" value={s.data?.provider ?? 'Not connected'} /><Metric label="Intent creation" value={s.data?.capabilities?.intentCreation ? 'READY' : 'BOUNDARY'} /><Metric label="Webhook" value={s.data?.capabilities?.webhookVerification ? 'READY' : 'BOUNDARY'} /></div>
      <p className="mt-6 rounded-2xl border border-white/10 p-4 text-sm text-zinc-400">{s.data?.message ?? 'Payment infrastructure is present, but a production provider must be configured before real payment execution.'}</p>
    </>}
  </Shell>;
}
