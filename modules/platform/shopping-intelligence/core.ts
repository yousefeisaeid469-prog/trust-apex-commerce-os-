import type {DecisionCandidate,DecisionResult,Interest,PriceAlert,PricePoint} from './contracts.ts';

export function recordPrice(history:PricePoint[], point:PricePoint):PricePoint[]{
  if(point.amountMinor<0n || !point.currency) throw new Error('INVALID_PRICE_POINT');
  return [...history,point].sort((a,b)=>new Date(a.at).getTime()-new Date(b.at).getTime());
}
export function priceStats(history:PricePoint[]){
  if(!history.length) return null;
  const amounts=history.map(x=>x.amountMinor); const current=history[amounts.length-1];
  const min=amounts.reduce((a,b)=>a<b?a:b); const max=amounts.reduce((a,b)=>a>b?a:b);
  return {current,min,max,points:history.length};
}
export function shouldTriggerPriceAlert(alert:PriceAlert,currentMinor:bigint,currency:string){
  return alert.active && alert.currency===currency && currentMinor<=alert.targetMinor;
}
export function createInterest(query:string,now=new Date()):Interest{
  const q=query.trim(); if(q.length<2||q.length>300) throw new Error('INVALID_INTEREST');
  return {id:crypto.randomUUID(),query:q,createdAt:now.toISOString(),active:true};
}
export function helpMeDecide(candidates:DecisionCandidate[]):DecisionResult|null{
  const usable=candidates.filter(c=>c.stock>0&&c.rating>=0&&c.rating<=5&&c.deliveryDays>=0);
  if(!usable.length)return null;
  const scored=usable.map(c=>{const score=c.rating*20+Math.max(0,20-c.deliveryDays*3)+Math.min(15,Math.log10(Number(c.priceMinor)+1)*2)+Math.min(10,c.stock>10?10:c.stock);return {c,score};}).sort((a,b)=>b.score-a.score||a.c.priceMinor<b.c.priceMinor?-1:a.c.priceMinor>b.c.priceMinor?1:0);
  const w=scored[0]; const reasons:string[]=[]; if(w.c.rating>=4.5)reasons.push('high rating'); if(w.c.deliveryDays<=2)reasons.push('fast delivery'); if(w.c.stock>0)reasons.push('in stock'); return {winnerId:w.c.id,score:w.score,reasons};
}
