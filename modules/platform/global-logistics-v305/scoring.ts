import type { LogisticsCandidate,LogisticsPriority,LogisticsWeights } from './contracts.ts';
export function weightsFor(priority:LogisticsPriority):LogisticsWeights {
 if(priority==='COST') return {cost:.70,speed:.10,reliability:.20};
 if(priority==='SPEED') return {cost:.10,speed:.70,reliability:.20};
 if(priority==='RELIABILITY') return {cost:.10,speed:.20,reliability:.70};
 return {cost:.35,speed:.25,reliability:.40};
}
export function reliabilityScore(successCount:number,failureCount:number,circuitState:string){
 const total=Math.max(0,successCount)+Math.max(0,failureCount); if(circuitState==='OPEN') return 0; if(total===0) return .5;
 return Math.max(0,Math.min(1,successCount/total));
}
export function scoreCandidates(candidates:LogisticsCandidate[],priority:LogisticsPriority){
 if(!candidates.length) return [];
 const w=weightsFor(priority);
 const minCost=candidates.reduce((m,c)=>c.costMinor<m?c.costMinor:m,candidates[0].costMinor);
 const maxCost=candidates.reduce((m,c)=>c.costMinor>m?c.costMinor:m,candidates[0].costMinor);
 const minDays=Math.min(...candidates.map(c=>c.maxDays)); const maxDays=Math.max(...candidates.map(c=>c.maxDays));
 const costRange=maxCost-minCost; const dayRange=maxDays-minDays;
 const scored=candidates.map(c=>{
  const costNorm=costRange===0n?1:Number((maxCost-c.costMinor)*1000000n/costRange)/1000000;
  const speedNorm=dayRange===0?1:(maxDays-c.maxDays)/dayRange;
  const score=w.cost*costNorm+w.speed*speedNorm+w.reliability*c.reliability;
  const reasons=[`COST_WEIGHT_${w.cost}`,`SPEED_WEIGHT_${w.speed}`,`RELIABILITY_WEIGHT_${w.reliability}`];
  if(c.reliability>=.95) reasons.push('HIGH_RELIABILITY'); if(c.maxDays===minDays) reasons.push('FASTEST_AVAILABLE'); if(c.costMinor===minCost) reasons.push('LOWEST_COST');
  return {...c,score:Number(score.toFixed(6)),reasons};
 });
 // Explicit selection sort keeps ranking deterministic across runtimes and avoids comparator coercion surprises with bigint fields.
 for(let i=0;i<scored.length;i++){ let best=i; for(let j=i+1;j<scored.length;j++){ const a=scored[best],b=scored[j]; const better=b.score>a.score || (b.score===a.score && (b.maxDays<a.maxDays || (b.maxDays===a.maxDays && (b.costMinor<a.costMinor || (b.costMinor===a.costMinor && b.carrierCode<a.carrierCode))))); if(better) best=j; } if(best!==i){ const tmp=scored[i]; scored[i]=scored[best]; scored[best]=tmp; } }
 return scored;
}
