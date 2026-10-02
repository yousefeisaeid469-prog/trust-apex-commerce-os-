'use client';
import { useEffect,useState } from 'react';
export default function GlobalCommerceIncidents(){
 const [data,setData]=useState<any>(null); const [error,setError]=useState('');
 useEffect(()=>{fetch('/api/commerce/incidents',{cache:'no-store'}).then(r=>r.json()).then(setData).catch(e=>setError(String(e)));},[]);
 return <main style={{padding:32,fontFamily:'system-ui',maxWidth:1100,margin:'auto'}}><h1>Global Commerce Incident Orchestrator</h1><p>Cross-domain incident correlation and bounded recovery. Business authorities remain authoritative.</p>{error&&<p>{error}</p>}{!data&&!error&&<p>Loading live incidents…</p>}{data&&<><p><b>Version:</b> {data.version}</p><p><b>Incidents:</b> {data.incidents?.length??0}</p><div style={{display:'grid',gap:12}}>{(data.incidents||[]).map((i:any)=><article key={i.fingerprint} style={{border:'1px solid #ddd',borderRadius:10,padding:16}}><b>{i.kind}</b> — {i.severity}<div>Fingerprint: {i.fingerprint}</div><pre style={{whiteSpace:'pre-wrap'}}>{JSON.stringify(i.evidence,null,2)}</pre><div>Safe action: {i.safeAction?.commandId||'None — observation only'}</div></article>)}</div></>}</main>;
}
