'use client';
import { useEffect } from 'react';
export default function ProductViewTracker({productId,category,price}:{productId:string;category:string;price:number}){
 useEffect(()=>{void fetch('/api/marketplace/preferences',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({productId,category,price})});},[productId,category,price]);
 return null;
}
