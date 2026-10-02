'use client';
import { useState } from 'react';

type Result = { interpretation:string; recommendations:Array<{title:string;category:string;estimatedPrice:number;score:number;reasons:string[];confidence:number;nextAction:string}>; clarifyingQuestions:string[]; guardrails:string[] };

export default function ConciergePage() {
  const [query, setQuery] = useState('عايز لابتوب قوي للشغل والجرافيك');
  const [budget, setBudget] = useState('50000');
  const [priority, setPriority] = useState('quality');
  const [result, setResult] = useState<Result | null>(null);
  const run = async () => {
    const res = await fetch('/api/concierge', { method:'POST', headers:{'content-type':'application/json'}, body:JSON.stringify({ query, budget:Number(budget), currency:'EGP', priorities:[priority] }) });
    setResult(await res.json());
  };
  return <main className="min-h-screen bg-black text-white p-6 md:p-12"><div className="mx-auto max-w-6xl">
    <div className="mb-10"><span className="text-xs uppercase tracking-[0.3em] text-zinc-500">TRUST V118</span><h1 className="mt-3 text-4xl md:text-6xl font-semibold">AI Shopping Concierge</h1><p className="mt-4 max-w-2xl text-zinc-400">بدل ما العميل يدور في آلاف المنتجات، يقول هو عايز إيه — وTRUST يبني له قرار شراء مفهوم وقابل للتفسير.</p></div>
    <section className="grid gap-6 lg:grid-cols-[1.1fr_.9fr]">
      <div className="rounded-3xl border border-white/10 bg-white/[.04] p-6"><label className="text-sm text-zinc-400">Shopping Mission</label><textarea value={query} onChange={e=>setQuery(e.target.value)} className="mt-3 h-32 w-full rounded-2xl border border-white/10 bg-black p-4 outline-none" />
      <div className="mt-4 grid grid-cols-2 gap-4"><input value={budget} onChange={e=>setBudget(e.target.value)} className="rounded-xl border border-white/10 bg-black p-3" placeholder="Budget" /><select value={priority} onChange={e=>setPriority(e.target.value)} className="rounded-xl border border-white/10 bg-black p-3"><option value="quality">Quality</option><option value="price">Price</option><option value="delivery">Delivery</option><option value="authenticity">Authenticity</option></select></div><button onClick={run} className="mt-5 w-full rounded-xl bg-white px-5 py-3 font-semibold text-black">ابدأ البحث الذكي ✨</button></div>
      <div className="rounded-3xl border border-white/10 bg-white/[.04] p-6"><div className="text-sm text-zinc-500">TRUST Philosophy</div><div className="mt-5 text-2xl font-semibold">مش “أعلى إعلان” —<br/>بل “أفضل قرار”.</div><p className="mt-4 text-zinc-400">كل توصية لازم يكون لها سبب، وثقة، وحدود واضحة لما نعرفه وما لا نعرفه.</p></div>
    </section>
    {result && <section className="mt-8 space-y-5"><div className="rounded-2xl border border-white/10 p-5 text-zinc-300">{result.interpretation}</div><div className="grid gap-4 md:grid-cols-3">{result.recommendations.map((r,i)=><article key={i} className="rounded-2xl border border-white/10 bg-white/[.03] p-5"><div className="flex justify-between"><span className="text-xs text-zinc-500">{r.category}</span><b>{r.score}/100</b></div><h2 className="mt-3 text-xl font-semibold">{r.title}</h2><div className="mt-2 text-2xl">{r.estimatedPrice.toLocaleString()} EGP</div><ul className="mt-4 space-y-2 text-sm text-zinc-400">{r.reasons.map(x=><li key={x}>✓ {x}</li>)}</ul><div className="mt-5 text-xs text-zinc-500">Confidence {r.confidence}% · {r.nextAction}</div></article>)}</div><div className="rounded-2xl border border-white/10 p-5"><h3 className="font-semibold">أسئلة تحسّن النتيجة</h3><div className="mt-3 flex flex-wrap gap-2">{result.clarifyingQuestions.map(q=><span key={q} className="rounded-full bg-white/5 px-3 py-2 text-sm text-zinc-300">{q}</span>)}</div></div></section>}
  </div></main>;
}
