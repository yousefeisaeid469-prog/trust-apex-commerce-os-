'use client';
import { useState } from 'react';

type Offer={id:string;productId:string;storeName:string;price:number;shippingFee:number;stock:number;deliveryMinDays:number;deliveryMaxDays:number;fulfillmentMode:string;sellerRating:number};
export default function OfferSelector({productId,offers,buyBoxId}:{productId:string;offers:Offer[];buyBoxId?:string}){
 const [offerId,setOfferId]=useState(buyBoxId??offers.find(o=>o.stock>0)?.id??'');
 const [state,setState]=useState('');
 async function add(){if(!offerId)return;setState('جاري الإضافة…');const r=await fetch('/api/cart/items',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({productId,offerId,qty:1})});const d=await r.json().catch(()=>({}));setState(r.ok?'تمت الإضافة للسلة ✓':(d.error??'تعذر الإضافة'));}
 return <div style={{display:'grid',gap:12,marginTop:20}}><h3 style={{marginBottom:0}}>أفضل عروض البائعين</h3>{offers.map(o=><label key={o.id} style={{display:'grid',gridTemplateColumns:'auto 1fr auto',gap:12,alignItems:'center',padding:14,border:'1px solid '+(o.id===offerId?'#111':'#ddd'),borderRadius:14,cursor:'pointer'}}><input type="radio" name="offer" checked={o.id===offerId} onChange={()=>setOfferId(o.id)} disabled={o.stock<=0}/><span><strong>{o.storeName}</strong><br/><small>★ {o.sellerRating.toFixed(1)} · {o.fulfillmentMode} · توصيل {o.deliveryMinDays}-{o.deliveryMaxDays} أيام</small></span><strong>{o.price.toFixed(2)} EGP</strong></label>)}<button onClick={add} disabled={!offerId} style={{padding:'13px 18px',borderRadius:12,border:0,cursor:'pointer'}}>أضف العرض المختار للسلة</button>{state&&<small>{state}</small>}</div>;
}
