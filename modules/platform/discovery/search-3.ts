import { discoverProducts, type DiscoveryProduct, type DiscoveryQuery, type DiscoveryHit } from './core.ts';
export type Search3Query = DiscoveryQuery & { suggest?: boolean };
export type Search3Result = ReturnType<typeof discoverProducts> & { normalizedQuery:string; inferredCategory?:string; suggestions:string[]; mode:'keyword'|'category'|'discovery' };
const norm=(v:string)=>v.normalize('NFKC').toLowerCase().replace(/[\u064B-\u065F\u0670\u06D6-\u06ED]/g,'').replace(/[إأآٱ]/g,'ا').replace(/ى/g,'ي').replace(/ة/g,'ه').replace(/ؤ/g,'و').replace(/ئ/g,'ي').replace(/[^\p{L}\p{N}]+/gu,' ').trim();
const toks=(v:string)=>norm(v).split(/\s+/).filter(Boolean);
function distance(a:string,b:string){if(a===b)return 0;if(!a)return b.length;if(!b)return a.length;const r=Array.from({length:b.length+1},(_,i)=>i);for(let i=1;i<=a.length;i++){let prev=r[0];r[0]=i;for(let j=1;j<=b.length;j++){const old=r[j];r[j]=Math.min(r[j]+1,r[j-1]+1,prev+(a[i-1]===b[j-1]?0:1));prev=old}}return r[b.length]}
function inferCategory(products:DiscoveryProduct[],q:string){if(!q)return undefined;const counts=new Map<string,number>();for(const p of products){const c=norm(p.category), words=toks(`${p.name} ${p.tags.join(' ')}`);if(c.includes(q)||q.includes(c))counts.set(p.category,(counts.get(p.category)||0)+3);const overlap=toks(q).filter(t=>words.some(w=>w===t||w.startsWith(t)||t.startsWith(w))).length;if(overlap)counts.set(p.category,(counts.get(p.category)||0)+overlap)}return [...counts.entries()].sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0]))[0]?.[0]}
function suggestions(products:DiscoveryProduct[],q:string){
 const qs=toks(q); if(!qs.length)return [];
 const vocab=new Set<string>(); for(const p of products) for(const t of toks(`${p.name} ${p.category} ${p.tags.join(' ')}`)) if(t.length>=3)vocab.add(t);
 const out:{t:string;s:number}[]=[];
 for(const t of vocab){let s=0; for(const qt of qs){const d=distance(qt,t),m=Math.max(qt.length,t.length); const score=qt===t?1:(t.startsWith(qt)||qt.startsWith(t)?0.86:(d<=(m>=7?2:1)?0.72:0)); s=Math.max(s,score)} if(s>=0.72&&!qs.includes(t))out.push({t,s})}
 return out.sort((a,b)=>b.s-a.s||a.t.localeCompare(b.t)).slice(0,5).map(x=>x.t)
}

export function searchDiscovery3(products:DiscoveryProduct[],input:Search3Query={}):Search3Result{const normalizedQuery=norm(input.q||'');const inferredCategory=inferCategory(products,normalizedQuery);const result=discoverProducts(products,{...input,q:normalizedQuery,filters:{...input.filters,category:input.filters?.category||inferredCategory}});return {...result,normalizedQuery,inferredCategory,suggestions:input.suggest===false?[]:suggestions(products,normalizedQuery),mode:!normalizedQuery?'discovery':inferredCategory?'category':'keyword'}}
export function explainSearchHit(hit:DiscoveryHit){return `${hit.reasons.slice(0,3).join(' · ')||'مطابقة من الكتالوج الحالي'} · score ${Math.round(hit.score)}`}
