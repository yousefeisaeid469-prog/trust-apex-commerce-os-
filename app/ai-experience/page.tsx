'use client';
import {useState} from 'react';
import {TrustSkeleton} from '../../components/trust-design-system';

type Data={ok:boolean;ai:{signals:Array<any>;actions:Array<any>;guardrails:string[];unavailable:string[]};concierge?:{interpretation:string;recommendations:Array<any>;clarifyingQuestions:string[]}|null};
export default function AiExperience(){
 const [mission,setMission]=useState('عايز موبايل قوي للتصوير والشغل'); const [budget,setBudget]=useState('30000'); const [data,setData]=useState<Data|null>(null); const [loading,setLoading]=useState(false);
 async function run(){setLoading(true);try{const r=await fetch('/api/ai-experience',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({mission,budget:Number(budget),priorities:['quality','price']})});setData(await r.json())}finally{setLoading(false)}}
 return <main className="ai2-page" dir="rtl"><div className="ai2-shell"><header className="ai2-hero"><div><span>TRUST APEX · V194 · AI EXPERIENCE 2.0</span><h1>الذكاء بقى <i>طبقة واحدة.</i></h1><p>واجهة موحدة فوق Marketplace وCustomer OS وMerchant OS وIntelligence Brain — توصيات مفهومة، إشارات واضحة، وحدود تمنع الـAI من ادعاء أو تنفيذ ما لا يملكه.</p></div><div className="ai2-badge"><b>DECISION SUPPORT</b><small>Execution خارج طبقة الـAI</small></div></header>
 <section className="ai2-command"><div><small>AI MISSION</small><textarea value={mission} onChange={e=>setMission(e.target.value)} placeholder="اكتب هدفك..."/></div><div><small>BUDGET · EGP</small><input value={budget} onChange={e=>setBudget(e.target.value)}/><button onClick={run} disabled={loading}>{loading?'جاري التحليل…':'حلّل المهمة ✦'}</button></div></section>
 {loading&&!data&&<TrustSkeleton lines={5}/>} {data&&<><section className="ai2-grid"><article className="ai2-card"><small>SIGNAL GRAPH</small><h2>إيه اللي TRUST عارفه؟</h2><div className="ai2-signals">{data.ai.signals.map(s=><div key={s.id}><b>{s.label}</b><span>{String(s.value)}</span><em>{s.confidence}% · {s.source}</em></div>)}{!data.ai.signals.length&&<p>مفيش إشارات كفاية لسه.</p>}</div></article><article className="ai2-card"><small>NEXT BEST ACTION</small><h2>إيه الخطوة المنطقية؟</h2><div className="ai2-actions">{data.ai.actions.map(a=><div key={a.id}><div><b>{a.title}</b><span>{a.rationale}</span></div><em>{a.confidence}%</em></div>)}</div></article></section>
 {data.concierge&&<section className="ai2-card"><small>EXPLAINABLE SHOPPING</small><h2>{data.concierge.interpretation}</h2><div className="ai2-recs">{data.concierge.recommendations.map((r:any)=><article key={r.title}><span>{r.category}</span><b>{r.title}</b><strong>{r.score}/100</strong><p>{r.reasons.join(' · ')}</p><small>Confidence {r.confidence}%</small></article>)}</div></section>}
 <section className="ai2-guard"><div><small>TRUST GUARDRAILS</small><h2>AI قوي — لكن مش منفلت.</h2></div><div>{[...data.ai.guardrails,...data.ai.unavailable].map((x,i)=><p key={i}>✓ {x}</p>)}</div></section></>}
 </div></main>
}
