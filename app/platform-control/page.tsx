'use client';
import { useEffect, useState } from 'react';

type Diagnostic = { ok: boolean; version: string; state: string; checks: {name:string;state:string;latencyMs:number;detail?:string}[]; timestamp:string };

export default function PlatformControl() {
  const [data, setData] = useState<Diagnostic | null>(null);
  useEffect(() => { fetch('/api/platform/diagnostics', { cache: 'no-store' }).then(r => r.json()).then(setData).catch(() => setData(null)); }, []);
  return <main style={{minHeight:'100vh',padding:'48px',background:'#0b0d12',color:'#f5f5f5',fontFamily:'system-ui'}}>
    <div style={{maxWidth:1100,margin:'0 auto'}}>
      <p style={{opacity:.65,letterSpacing:2}}>TRUST APEX / CONTROL PLANE</p>
      <h1 style={{fontSize:48,margin:'10px 0'}}>Operational Command Center</h1>
      <p style={{maxWidth:720,opacity:.75}}>حالة تشغيل المنصة، العقود الأمنية، والـruntime في شاشة واحدة — بدون كشف أي secrets.</p>
      <section style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))',gap:16,marginTop:32}}>
        <Card title="Release" value={data?.version ?? 'Loading…'} />
        <Card title="Platform State" value={data?.state ?? 'Loading…'} />
        <Card title="Diagnostics" value={data ? `${data.checks.length} checks` : 'Loading…'} />
      </section>
      <section style={{marginTop:24,padding:24,border:'1px solid #2a2e39',borderRadius:18,background:'#11141b'}}>
        <h2>System checks</h2>
        {data?.checks.map(c => <div key={c.name} style={{display:'flex',justifyContent:'space-between',padding:'16px 0',borderBottom:'1px solid #242833'}}><span>{c.name}</span><span>{c.state} · {c.latencyMs}ms</span></div>)}
      </section>
    </div>
  </main>
}
function Card({title,value}:{title:string;value:string}){return <div style={{padding:24,border:'1px solid #2a2e39',borderRadius:18,background:'#11141b'}}><div style={{opacity:.6}}>{title}</div><strong style={{display:'block',fontSize:28,marginTop:8}}>{value}</strong></div>}
