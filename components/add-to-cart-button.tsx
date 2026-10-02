'use client';
import { useState } from 'react';
export default function AddToCartButton({productId,offerId,disabled=false}:{productId:string;offerId?:string;disabled?:boolean}){
 const [state,setState]=useState('أضف للسلة');
 async function add(){setState('جارٍ الإضافة…');try{const r=await fetch('/api/cart',{method:'PUT',headers:{'content-type':'application/json'},body:JSON.stringify({items:[{productId,qty:1,...(offerId?{offerId}:{})}]})});const d=await r.json();setState(d.ok?'تمت الإضافة ✓':'تعذر الإضافة');}catch{setState('تعذر الإضافة')}}
 return <button disabled={disabled||state==='جارٍ الإضافة…'} onClick={add} style={{padding:'14px 22px',borderRadius:12,border:0,cursor:disabled?'not-allowed':'pointer'}}>{disabled?'غير متاح':state}</button>;
}
