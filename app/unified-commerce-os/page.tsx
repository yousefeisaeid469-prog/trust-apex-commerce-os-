'use client';
import {useEffect,useState} from 'react';

type Overview=any;
const domains=[['orders','Orders'],['payments','Payments'],['reservations','Inventory'],['sellerOrders','Seller Orders'],['fulfillments','Fulfillment'],['shipments','Delivery'],['events','Events'],['deliveries','Event Delivery'],['execution','Execution'],['revenue','Revenue']];
export default function UnifiedCommerceOS(){
 const [data,setData]=useState<Overview|null>(null); const [error,setError]=useState('');
 useEffect(()=>{fetch('/api/commerce/os/overview',{cache:'no-store'}).then(async r=>{const x=await r.json(); if(!r.ok)throw new Error(x.message||x.error); setData(x)}).catch(e=>setError(e.message));},[]);
 if(error)return <main style={{padding:40,fontFamily:'system-ui'}}><h1>TRUST Commerce OS</h1><p>Live control-plane data unavailable: {error}</p></main>;
 if(!data)return <main style={{padding:40,fontFamily:'system-ui'}}><h1>TRUST Commerce OS</h1><p>Loading live commerce state…</p></main>;
 return <main style={{minHeight:'100vh',background:'#07111f',color:'#f8fafc',padding:'32px',fontFamily:'system-ui'}}>
  <div style={{maxWidth:1400,margin:'0 auto'}}>
   <div style={{display:'flex',justifyContent:'space-between',gap:20,alignItems:'end',marginBottom:28}}><div><div style={{fontSize:13,opacity:.65}}>TRUST APEX OS • V374</div><h1 style={{fontSize:38,margin:'6px 0'}}>Unified Commerce OS</h1><p style={{opacity:.7,margin:0}}>One operational view over the existing order, payment, inventory, fulfillment, delivery, execution and revenue authorities.</p></div><div style={{padding:'10px 14px',borderRadius:12,background:data.health.state==='HEALTHY'?'#123524':'#3b2810'}}>{data.health.state} {data.health.code?`• ${data.health.code}`:''}</div></div>
   <section style={{display:'grid',gridTemplateColumns:'repeat(4,minmax(0,1fr))',gap:14,marginBottom:18}}>{[['Orders 24h',data.commerce.ordersLast24h],['Order value 24h',data.commerce.orderValueLast24h],['Revenue ledger',data.commerce.revenueLedgerAmount],['Verified recoveries 24h',data.commerce.verifiedRecoveriesLast24h]].map(([k,v])=><div key={k as string} style={{background:'#0d1b2d',border:'1px solid #1e334d',borderRadius:16,padding:18}}><div style={{opacity:.6,fontSize:13}}>{k}</div><div style={{fontSize:26,fontWeight:700,marginTop:8}}>{String(v)}</div></div>)}</section>
   <section style={{display:'grid',gridTemplateColumns:'repeat(5,minmax(0,1fr))',gap:12}}>{domains.map(([key,label])=>{const m=data.domains[key];return <div key={key} style={{background:'#0d1b2d',border:'1px solid #1e334d',borderRadius:14,padding:16}}><div style={{fontWeight:650}}>{label}</div><div style={{fontSize:25,margin:'8px 0'}}>{m.count}</div><div style={{fontSize:12,opacity:.65,wordBreak:'break-word'}}>{JSON.stringify(m.statuses)}</div></div>})}</section>
   <section style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14,marginTop:18}}><div style={{background:'#0d1b2d',border:'1px solid #1e334d',borderRadius:16,padding:20}}><h2 style={{marginTop:0}}>Stale work</h2><p>Consumer deliveries: <b>{data.staleWork.consumerDeliveries}</b></p><p>Execution jobs: <b>{data.staleWork.executionJobs}</b></p><p style={{opacity:.65,fontSize:13}}>V373 remains the bounded recovery authority; this surface only observes and coordinates.</p></div><div style={{background:'#0d1b2d',border:'1px solid #1e334d',borderRadius:16,padding:20}}><h2 style={{marginTop:0}}>Recent payment failures</h2>{data.recentPaymentFailures.length?data.recentPaymentFailures.map((x:any)=><p key={x.status}>{x.status}: <b>{x.count}</b></p>):<p>No failed payment states in the last 24h.</p>}</div></section>
   <footer style={{marginTop:24,opacity:.5,fontSize:12}}>Captured {data.capturedAt}. Read model only; business authorities remain authoritative.</footer>
  </div>
 </main>;
}
