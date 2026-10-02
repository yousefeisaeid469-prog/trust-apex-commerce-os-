import { ReturnsSurface } from '../../components/domains/returns-surface';

export const dynamic = 'force-dynamic';

async function loadDashboard() {
  return { counts: [], values: [], aging: [], refunds: [], surfaceStatus: 'LIVE' as const };
}

export default async function ReturnsPage() {
  const dashboard = await loadDashboard();
  return (
    <div className="min-h-screen">
      <ReturnsSurface dashboard={dashboard} />
      <section className="mx-auto max-w-6xl px-6 pb-12">
        <div className="rounded-xl border p-5">
          <h2 className="text-lg font-semibold">Return workflow</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-4">
            <div className="rounded-lg border p-4"><strong>1. Request</strong><p className="mt-1 text-sm opacity-70">Validate ownership, order state, reason and item quantities.</p></div>
            <div className="rounded-lg border p-4"><strong>2. Inspect</strong><p className="mt-1 text-sm opacity-70">Receive the item and persist condition, recovery and restock decisions.</p></div>
            <div className="rounded-lg border p-4"><strong>3. Settle</strong><p className="mt-1 text-sm opacity-70">Calculate a bounded refund and link it to the captured payment.</p></div>
            <div className="rounded-lg border p-4"><strong>4. Confirm</strong><p className="mt-1 text-sm opacity-70">Only provider confirmation can mark the financial settlement successful.</p></div>
          </div>
        </div>
      </section>
    </div>
  );
}
