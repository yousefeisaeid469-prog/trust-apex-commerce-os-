export type Metric = { name:string; value:number; labels?:Record<string,string> };
const counters = new Map<string, number>();
export function increment(name:string, value=1, labels:Record<string,string>={}) { const key=name+JSON.stringify(labels); counters.set(key,(counters.get(key)??0)+value); return counters.get(key)!; }
export function snapshot(): Metric[] { return [...counters].map(([key,value])=>{ const i=key.indexOf('{'); if(i<0) return {name:key,value}; return {name:key.slice(0,i),value,labels:JSON.parse(key.slice(i))}; }); }
export function resetMetrics(){ counters.clear(); }
