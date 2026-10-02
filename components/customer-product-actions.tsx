'use client';
import {useState} from 'react';
export default function CustomerProductActions({productId,currentPrice}:{productId:string;currentPrice:number}){
  const [message,setMessage]=useState('');
  async function toggleWishlist(){const r=await fetch('/api/marketplace/wishlist',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({productId})});const d=await r.json();setMessage(d.ok?'❤️ اتضاف لقائمة الرغبات':d.error==='AUTH_REQUIRED'?'سجّل الدخول الأول':'تعذر الحفظ');}
  async function alertPrice(){const raw=window.prompt('السعر المستهدف بالجنيه المصري',String(Math.max(1,Math.floor(currentPrice*.9))));if(!raw)return;const r=await fetch('/api/marketplace/price-alerts',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({productId,targetPrice:Number(raw)})});const d=await r.json();setMessage(d.ok?'🔔 تنبيه السعر اتفعل':d.error==='AUTH_REQUIRED'?'سجّل الدخول الأول':'تعذر تفعيل التنبيه');}
  return <div style={{display:'flex',gap:8,flexWrap:'wrap',marginTop:12}}><button onClick={toggleWishlist}>♡ قائمة الرغبات</button><button onClick={alertPrice}>🔔 تنبيه انخفاض السعر</button>{message&&<span style={{alignSelf:'center'}}>{message}</span>}</div>;
}
