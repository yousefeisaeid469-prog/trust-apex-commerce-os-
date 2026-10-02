'use client';

import { useEffect, useState } from 'react';

type StatusResponse = {
  ok: boolean;
  merchantStatus?: 'pending' | 'verified' | 'rejected';
  latestRequest?: { status: 'submitted' | 'approved' | 'rejected'; rejectionReason: string | null; createdAt: string } | null;
  error?: string;
};

const statusLabel: Record<string, string> = {
  pending: 'لم يتم التقديم بعد',
  verified: 'متجر موثّق',
  rejected: 'مرفوض',
};

export default function MerchantVerificationPage() {
  const [status, setStatus] = useState<StatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    legalName: '', nationalIdNumber: '', commercialRegistryNumber: '',
    phoneNumber: '', idDocumentUrl: '', registryDocumentUrl: '',
  });

  async function load() {
    setLoading(true);
    try {
      const res = await fetch('/api/merchant/verification', { cache: 'no-store' });
      const data = await res.json();
      setStatus(data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function submit() {
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch('/api/merchant/verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || 'فشل تقديم الطلب');
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'فشل تقديم الطلب');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <main dir="rtl" className="min-h-screen bg-black px-8 py-14 text-white"><p className="text-zinc-500">جاري التحميل...</p></main>;

  if (!status?.ok) {
    return (
      <main dir="rtl" className="min-h-screen bg-black px-8 py-14 text-white">
        <div className="mx-auto max-w-xl rounded-3xl border border-white/10 bg-white/[.03] p-8">
          <p className="text-zinc-300">{status?.error === 'MERCHANT_PROFILE_REQUIRED' ? 'لازم تفتح متجر أولاً قبل تقديم طلب التوثيق.' : 'لازم تسجّل الدخول كتاجر.'}</p>
        </div>
      </main>
    );
  }

  const pendingRequest = status.latestRequest?.status === 'submitted';
  const isVerified = status.merchantStatus === 'verified';

  return (
    <main dir="rtl" className="min-h-screen bg-black px-8 py-14 text-white">
      <div className="mx-auto max-w-xl">
        <span className="text-xs uppercase tracking-[.3em] text-amber-400">ثِقة · V152</span>
        <h1 className="mt-3 text-4xl font-semibold">توثيق المتجر</h1>
        <p className="mt-4 text-zinc-400">شارة "متجر موثّق" بتظهر للعملاء بعد مراجعة يدوية لبطاقة الرقم القومي والسجل التجاري.</p>

        <div className="mt-6 rounded-2xl border border-white/10 bg-white/[.03] p-4 text-sm">
          <span className="text-zinc-500">الحالة الحالية: </span>
          <b className={isVerified ? 'text-emerald-400' : status.merchantStatus === 'rejected' ? 'text-red-400' : 'text-amber-400'}>
            {statusLabel[status.merchantStatus ?? 'pending']}
          </b>
          {status.latestRequest?.status === 'rejected' && status.latestRequest.rejectionReason && (
            <p className="mt-2 text-red-300">سبب الرفض: {status.latestRequest.rejectionReason}</p>
          )}
        </div>

        {isVerified && <p className="mt-8 text-emerald-400">تم توثيق متجرك بنجاح ✓</p>}

        {!isVerified && pendingRequest && (
          <p className="mt-8 text-zinc-400">طلبك قيد المراجعة حاليًا، هنعلمك أول ما يتم اتخاذ قرار.</p>
        )}

        {!isVerified && !pendingRequest && (
          <div className="mt-8 space-y-4">
            {error && <div className="rounded-2xl border border-red-500/40 bg-red-500/10 p-4 text-red-300">{error}</div>}
            <input placeholder="الاسم القانوني الكامل" value={form.legalName} onChange={(e) => setForm({ ...form, legalName: e.target.value })} className="w-full rounded-2xl border border-white/15 bg-transparent px-4 py-3 placeholder:text-zinc-600" />
            <input placeholder="الرقم القومي (14 رقم)" value={form.nationalIdNumber} onChange={(e) => setForm({ ...form, nationalIdNumber: e.target.value })} className="w-full rounded-2xl border border-white/15 bg-transparent px-4 py-3 placeholder:text-zinc-600" />
            <input placeholder="رقم الهاتف (01xxxxxxxxx)" value={form.phoneNumber} onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })} className="w-full rounded-2xl border border-white/15 bg-transparent px-4 py-3 placeholder:text-zinc-600" />
            <input placeholder="رقم السجل التجاري (اختياري)" value={form.commercialRegistryNumber} onChange={(e) => setForm({ ...form, commercialRegistryNumber: e.target.value })} className="w-full rounded-2xl border border-white/15 bg-transparent px-4 py-3 placeholder:text-zinc-600" />
            <input placeholder="رابط صورة البطاقة (بعد الرفع)" value={form.idDocumentUrl} onChange={(e) => setForm({ ...form, idDocumentUrl: e.target.value })} className="w-full rounded-2xl border border-white/15 bg-transparent px-4 py-3 placeholder:text-zinc-600" />
            <input placeholder="رابط مستند السجل التجاري (اختياري)" value={form.registryDocumentUrl} onChange={(e) => setForm({ ...form, registryDocumentUrl: e.target.value })} className="w-full rounded-2xl border border-white/15 bg-transparent px-4 py-3 placeholder:text-zinc-600" />
            <button onClick={submit} disabled={submitting} className="w-full rounded-full bg-amber-400 px-5 py-3 font-semibold text-black disabled:opacity-50">
              {submitting ? 'جاري الإرسال...' : 'تقديم للمراجعة'}
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
