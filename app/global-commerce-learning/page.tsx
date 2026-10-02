'use client';
import {useEffect,useState} from 'react';
export default function GlobalCommerceLearning(){
 const [data,setData]=useState<any>(null); const [error,setError]=useState('');
 useEffect(()=>{fetch('/api/commerce/automation/policies',{cache:'no-store'}).then(async r=>{const j=await r.json(); if(!r.ok) throw new Error(j.error||'Unavailable'); setData(j)}).catch(e=>setError(e.message))},[]);
 return <main style={{padding:32,fontFamily:'system-ui'}}><h1>Global Commerce Learning</h1><p>V378 learned-policy state. Policies never become business authorities.</p>{error&&<p>{error}</p>}{data?.policies?.map((p:any)=><section key={p.policy_id} style={{border:'1px solid #ddd',borderRadius:12,padding:16,marginTop:12}}><strong>{p.state}</strong><div>{p.fingerprint}</div><div>Action: {p.action} · Revision: {p.revision}</div><pre>{JSON.stringify(p.evidence,null,2)}</pre></section>)}</main>;
}
