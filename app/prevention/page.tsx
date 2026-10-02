'use client';
import { useState } from 'react';

const signals = [
  ['DELIVERY_RISK', 'ممكن الطلب يتأخر', '🚚'],
  ['STOCKOUT_RISK', 'ممكن المنتج يخلص', '📦'],
  ['RETURN_RISK', 'ممكن أندم وأرجعه', '↩️'],
  ['PRICE_VOLATILITY', 'السعر ممكن يتغير', '💰'],
  ['SELLER_RISK', 'في إشارة خطر من البائع', '🛡️'],
  ['PAYMENT_FRICTION', 'الدفع فيه مشكلة', '💳'],
  ['FIT_RISK', 'المقاس ممكن ما يناسبني', '📏'],
  ['CART_ABANDONMENT', 'سيبت السلة وعايز أكمل', '🛒'],
];

export default function PreventionPage() {
  const [signal, setSignal] = useState('DELIVERY_RISK');
  const [confidence, setConfidence] = useState('0.82');
  const [severity, setSeverity] = useState('MEDIUM');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  async function analyze() {
    setLoading(true); setData(null);
    const r = await fetch('/api/prevention', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ signal, confidence: Number(confidence), severity }) });
    setData(await r.json()); setLoading(false);
  }

  return <main className="min-h-screen bg-black px-6 py-14 text-white md:px-12">
    <div className="mx-auto max-w-6xl">
      <a href="/" className="text-sm text-zinc-500">← Marketplace</a>
      <div className="mt-8 max-w-4xl">
        <span className="text-xs uppercase tracking-[.35em] text-amber-400">TRUST V124 · PREVENTION OS</span>
        <h1 className="mt-4 text-5xl font-semibold tracking-tight md:text-7xl">قبل ما تحصل المشكلة،<br/><em className="not-italic text-zinc-400">نحاول نمنعها.</em></h1>
        <p className="mt-6 text-lg leading-8 text-zinc-400">طبقة استباقية فوق Problem Solver: تلتقط الإشارات، تقيّم الخطر، وتختار تدخلًا قابلًا للعكس بدل انتظار المشكلة ثم محاولة إنقاذها.</p>
      </div>
      <section className="mt-12 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{signals.map(([id,label,icon]) => <button key={id} onClick={() => setSignal(id)} className={`rounded-3xl border p-5 text-right transition ${signal===id?'border-amber-400/60 bg-amber-400/10':'border-white/10 bg-white/[.03] hover:bg-white/[.06]'}`}><span className="text-2xl">{icon}</span><b className="mt-4 block">{label}</b><small className="mt-2 block text-zinc-500">تدخل قبل المشكلة</small></button>)}</section>
      <section className="mt-6 grid gap-3 md:grid-cols-[1fr_1fr_auto]">
        <label className="rounded-2xl border border-white/10 bg-white/[.03] p-4"><span className="text-xs text-zinc-500">CONFIDENCE</span><input className="mt-2 w-full bg-transparent text-white outline-none" value={confidence} onChange={e=>setConfidence(e.target.value)} type="number" min="0" max="1" step="0.01" /></label>
        <label className="rounded-2xl border border-white/10 bg-white/[.03] p-4"><span className="text-xs text-zinc-500">SEVERITY</span><select className="mt-2 w-full bg-transparent text-white outline-none" value={severity} onChange={e=>setSeverity(e.target.value)}><option className="bg-black">LOW</option><option className="bg-black">MEDIUM</option><option className="bg-black">HIGH</option><option className="bg-black">CRITICAL</option></select></label>
        <button onClick={analyze} className="rounded-2xl bg-white px-8 py-4 font-semibold text-black">{loading?'جاري التحليل…':'امنع المشكلة →'}</button>
      </section>
      {data?.decision && <section className="mt-8 rounded-[2rem] border border-white/10 bg-white/[.04] p-7 md:p-10">
        <div className="flex flex-wrap items-start justify-between gap-6"><div><span className="text-xs uppercase tracking-[.25em] text-amber-400">Preventive Decision</span><h2 className="mt-2 text-3xl font-semibold">{data.decision.intervention.title}</h2></div><div className="rounded-2xl border border-white/10 px-5 py-4"><b className="text-3xl">{data.decision.riskScore}</b><span className="ml-2 text-zinc-500">Risk / 100</span></div></div>
        <p className="mt-6 text-lg leading-8 text-zinc-300">{data.decision.customerMessage}</p>
        <div className="mt-7 grid gap-3 md:grid-cols-3"><div className="rounded-2xl border border-white/10 p-4"><span className="text-zinc-500">Confidence</span><b className="mt-2 block">{Math.round(data.decision.confidence*100)}%</b></div><div className="rounded-2xl border border-white/10 p-4"><span className="text-zinc-500">Mode</span><b className="mt-2 block">{data.decision.intervention.mode}</b></div><div className="rounded-2xl border border-white/10 p-4"><span className="text-zinc-500">Reversible</span><b className="mt-2 block">{data.decision.intervention.reversible?'YES':'NO'}</b></div></div>
        <div className="mt-7 rounded-2xl bg-black/40 p-5"><b>Guardrails</b><ul className="mt-3 space-y-2 text-sm text-zinc-500">{data.decision.guardrails.map((x:string)=><li key={x}>✓ {x}</li>)}</ul></div>
      </section>}
      <p className="mt-8 text-sm text-zinc-600">V124 is a deterministic prevention foundation. Real prevention requires connected order, inventory, carrier, payment, seller and analytics providers; no live provider is claimed here.</p>
    </div>
  </main>;
}
