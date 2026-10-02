'use client';
import { useEffect, useState } from 'react';

type Seller = { sellerId:string; displayName:string; country:string; trustScore:number };
export default function GlobalCommerceNetworkPage(){
  const [sellers,setSellers]=useState<Seller[]>([]);
  useEffect(()=>{ fetch('/api/global-commerce-network').then(r=>r.json()).then(d=>setSellers(d.sellers ?? [])).catch(()=>setSellers([])); },[]);
  return <main className="min-h-screen bg-black text-white px-6 py-16 md:px-12"><div className="mx-auto max-w-6xl">
    <div className="mb-12"><p className="text-xs uppercase tracking-[0.35em] text-amber-400">TRUST V121</p><h1 className="mt-4 text-4xl font-semibold md:text-6xl">Global Commerce Network</h1><p className="mt-5 max-w-3xl text-zinc-400 text-lg">شبكة تجارة متعددة التجار: هوية بائع موثوقة، مخزون شبكي، Universal Cart، وطبقة جاهزة للتجارة العابرة للحدود.</p></div>
    <section className="grid gap-4 md:grid-cols-4">{[['Seller Identity','Verified merchant graph'],['Network Inventory','Cross-merchant offers'],['Universal Cart','Split-order boundary'],['Cross-Border','Quote + duty boundary']].map(([a,b])=><div key={a} className="rounded-2xl border border-white/10 bg-white/[.04] p-5"><div className="font-medium">{a}</div><div className="mt-2 text-sm text-zinc-500">{b}</div></div>)}</section>
    <section className="mt-10 rounded-3xl border border-white/10 bg-white/[.03] p-6"><div className="flex items-center justify-between"><h2 className="text-xl font-semibold">Verified Network Sellers</h2><span className="text-xs text-zinc-500">Provider-neutral foundation</span></div><div className="mt-5 grid gap-3">{sellers.map(s=><div key={s.sellerId} className="flex items-center justify-between rounded-2xl border border-white/10 p-4"><div><div>{s.displayName}</div><div className="text-sm text-zinc-500">{s.country} · seller {s.sellerId}</div></div><div className="text-right"><div className="text-amber-400">{s.trustScore}/100</div><div className="text-xs text-zinc-500">TRUST score</div></div></div>)}</div></section>
    <p className="mt-8 text-sm text-zinc-600">لا يتم عرض أسعار شحن، ضرائب، FX أو مواعيد وصول حقيقية قبل توصيل مزودي الخدمة واختبارهم.</p>
  </div></main>;
}
