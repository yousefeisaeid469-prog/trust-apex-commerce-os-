'use client';

import { useState } from 'react';

export default function CustomerAuthPage() {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit() {
    setError('');
    if (!email.trim() || !password) { setError('اكتب الإيميل وكلمة المرور'); return; }
    if (mode === 'register' && password.length < 8) { setError('كلمة المرور لازم تكون 8 حروف على الأقل'); return; }
    setBusy(true);
    try {
      const res = await fetch(`/api/auth/${mode}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || 'فشل تسجيل الدخول');
      const next = new URLSearchParams(window.location.search).get('next') || '/';
      window.location.href = next;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'حصل خطأ، جرّب تاني');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main dir="rtl" className="min-h-screen bg-black px-8 py-14 text-white">
      <div className="mx-auto max-w-md">
        <span className="text-xs uppercase tracking-[.3em] text-amber-400">ثِقة</span>
        <h1 className="mt-3 text-3xl font-semibold">{mode === 'login' ? 'تسجيل الدخول' : 'حساب جديد'}</h1>
        <p className="mt-2 text-zinc-400">
          {mode === 'login' ? 'ادخل بحسابك عشان تكمل طلبك.' : 'أنشئ حساب عشان تحفظ سلتك وطلباتك.'}
        </p>

        <div className="mt-8 space-y-4">
          {error && <div className="rounded-2xl border border-red-500/40 bg-red-500/10 p-4 text-red-300">{error}</div>}
          <input
            type="email" placeholder="الإيميل" value={email} onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && submit()}
            className="w-full rounded-2xl border border-white/15 bg-transparent px-4 py-3 placeholder:text-zinc-600"
          />
          <input
            type="password" placeholder="كلمة المرور" value={password} onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && submit()}
            className="w-full rounded-2xl border border-white/15 bg-transparent px-4 py-3 placeholder:text-zinc-600"
          />
          <button onClick={submit} disabled={busy} className="w-full rounded-full bg-amber-400 px-5 py-3 font-semibold text-black disabled:opacity-50">
            {busy ? 'جاري التنفيذ...' : mode === 'login' ? 'دخول' : 'إنشاء الحساب'}
          </button>
          <button
            onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); }}
            className="w-full text-center text-sm text-zinc-400 underline"
          >
            {mode === 'login' ? 'لسه معندكش حساب؟ سجّل دلوقتي' : 'عندك حساب بالفعل؟ سجّل الدخول'}
          </button>
        </div>
      </div>
    </main>
  );
}
