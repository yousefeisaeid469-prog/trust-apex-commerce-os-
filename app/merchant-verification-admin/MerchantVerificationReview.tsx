'use client';
import { useEffect, useState } from 'react';

type PendingRequest = {
  id: string; merchantId: string; storeName: string; legalName: string; nationalIdNumber: string;
  commercialRegistryNumber: string | null; phoneNumber: string; idDocumentUrl: string; registryDocumentUrl: string | null;
  createdAt: string;
};

export default function MerchantVerificationReview() {
  const [pending, setPending] = useState<PendingRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState('');
  const [rejectReasonById, setRejectReasonById] = useState<Record<string, string>>({});

  async function load() {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin/merchant-verification', { cache: 'no-store' });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || 'فشل تحميل الطلبات');
      setPending(data.pending);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'فشل تحميل الطلبات');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function review(requestId: string, decision: 'approved' | 'rejected') {
    setBusyId(requestId);
    setError('');
    try {
      const res = await fetch('/api/admin/merchant-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId, decision, rejectionReason: rejectReasonById[requestId] }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || 'فشل تنفيذ القرار');
      setPending((prev) => prev.filter((r) => r.id !== requestId));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'فشل تنفيذ القرار');
    } finally {
      setBusyId('');
    }
  }

  return (
    <main dir="rtl" className="min-h-screen bg-black px-8 py-14 text-white">
      <div className="mx-auto max-w-5xl">
        <span className="text-xs uppercase tracking-[.3em] text-amber-400">PRIVATE · V152</span>
        <h1 className="mt-3 text-4xl font-semibold">مراجعة توثيق التجار</h1>
        <p className="mt-4 max-w-2xl text-zinc-400">
          طلبات تحقق حقيقية بمستندات مرفوعة من التجار — مراجعة يدوية قبل منح شارة "متجر موثّق".
        </p>

        {error && <div className="mt-6 rounded-2xl border border-red-500/40 bg-red-500/10 p-4 text-red-300">{error}</div>}
        {loading && <p className="mt-8 text-zinc-500">جاري التحميل...</p>}
        {!loading && pending.length === 0 && !error && (
          <p className="mt-8 text-zinc-500">لا توجد طلبات معلّقة حاليًا.</p>
        )}

        <div className="mt-8 space-y-5">
          {pending.map((r) => (
            <div key={r.id} className="rounded-3xl border border-white/10 bg-white/[.03] p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-semibold">{r.storeName}</h2>
                  <p className="mt-1 text-sm text-zinc-400">{r.legalName}</p>
                </div>
                <span className="rounded-full border border-amber-400/40 px-3 py-1 text-xs text-amber-300">
                  قدّم في {new Date(r.createdAt).toLocaleDateString('ar-EG')}
                </span>
              </div>

              <div className="mt-4 grid gap-3 text-sm text-zinc-300 md:grid-cols-2">
                <p><span className="text-zinc-500">الرقم القومي:</span> {r.nationalIdNumber}</p>
                <p><span className="text-zinc-500">رقم الهاتف:</span> {r.phoneNumber}</p>
                {r.commercialRegistryNumber && (
                  <p><span className="text-zinc-500">السجل التجاري:</span> {r.commercialRegistryNumber}</p>
                )}
                <p>
                  <span className="text-zinc-500">صورة البطاقة:</span>{' '}
                  <a className="text-amber-400 underline" href={r.idDocumentUrl} target="_blank" rel="noreferrer">عرض المستند</a>
                </p>
                {r.registryDocumentUrl && (
                  <p>
                    <span className="text-zinc-500">مستند السجل التجاري:</span>{' '}
                    <a className="text-amber-400 underline" href={r.registryDocumentUrl} target="_blank" rel="noreferrer">عرض المستند</a>
                  </p>
                )}
              </div>

              <div className="mt-5 flex flex-wrap items-center gap-3">
                <button
                  onClick={() => review(r.id, 'approved')}
                  disabled={busyId === r.id}
                  className="rounded-full bg-amber-400 px-5 py-2 text-sm font-semibold text-black disabled:opacity-50"
                >
                  توثيق المتجر
                </button>
                <input
                  placeholder="سبب الرفض (مطلوب عند الرفض)"
                  value={rejectReasonById[r.id] ?? ''}
                  onChange={(e) => setRejectReasonById((prev) => ({ ...prev, [r.id]: e.target.value }))}
                  className="min-w-[220px] flex-1 rounded-full border border-white/15 bg-transparent px-4 py-2 text-sm placeholder:text-zinc-600"
                />
                <button
                  onClick={() => review(r.id, 'rejected')}
                  disabled={busyId === r.id}
                  className="rounded-full border border-red-500/40 px-5 py-2 text-sm font-semibold text-red-300 disabled:opacity-50"
                >
                  رفض
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
