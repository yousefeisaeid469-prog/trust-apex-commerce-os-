'use client';
import { useEffect,useState } from 'react';
export default function PostPurchasePage(){
 const [data,setData]=useState<any>(null); const [error,setError]=useState('');
 useEffect(()=>{fetch('/api/customer/post-purchase',{cache:'no-store'}).then(async r=>{const j=await r.json();if(!r.ok)throw new Error(j.error||'LOAD_FAILED');setData(j.overview);}).catch(e=>setError(e.message));},[]);
 if(error)return <main><h1>After your purchase</h1><p>{error}</p></main>;
 if(!data)return <main><h1>After your purchase</h1><p>Loading live order activity…</p></main>;
 return <main><h1>After your purchase</h1><p>Live status from your account.</p><section><h2>Orders</h2><ul>{data.orders.map((o:any)=><li key={o.id}>{o.id} — {o.status} — {o.total} {o.currency}</li>)}</ul></section><section><h2>Returns</h2><ul>{data.returns.map((r:any)=><li key={r.id}>{r.id} — {r.status}</li>)}</ul></section><section><h2>Reviews</h2><ul>{data.reviews.map((r:any)=><li key={r.id}>{r.productId} — {r.status} — {r.verifiedPurchase?'verified purchase':'not verified'}</li>)}</ul></section><section><h2>Loyalty</h2><p>{data.loyalty?`${data.loyalty.points} points · ${data.loyalty.tier}`:'No loyalty account yet.'}</p></section><section><h2>Notifications</h2><p>{data.notifications.length} recent notifications.</p></section></main>;
}
