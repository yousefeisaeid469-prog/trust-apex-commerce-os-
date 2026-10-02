'use client';
import {useEffect,useState} from 'react';
type Alert={severity:string;title:string;message:string};
type Purchase={orderId:string;status:string;total:number;currency:string;alerts:Alert[];items:Array<{name:string;quantity:number}>};
type Action={id:string;status:string;action_type:string;reason:string};
type Overview={purchaseCount:number;activeWarranties:number;returnWindows:number;attentionRequired:number;purchases:Purchase[]};
const money=(n:number,c='EGP')=>new Intl.NumberFormat('ar-EG',{style:'currency',currency:c,maximumFractionDigits:0}).format(n);
export default function PurchaseGuardian(){
 const[d,setD]=useState<Overview|null>(null),[a,setA]=useState<Action[]>([]),[e,setE]=useState(''),[busy,setBusy]=useState(false);
 const load=()=>fetch('/api/purchase-guardian',{cache:'no-store'}).then(async r=>{const x=await r.json();if(!x.ok)throw Error(x.error);setD(x.overview);setA(x.actions??[])}).catch(x=>setE(x.message==='AUTH_REQUIRED'?'سجل دخولك عشان تشوف مشترياتك.':'تعذر تحميل Purchase Guardian.'));
 useEffect(()=>{load()},[]);
 const plan=async()=>{setBusy(true);try{const r=await fetch('/api/purchase-guardian',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({operation:'plan'})});const x=await r.json();if(!x.ok)throw Error(x.error);await load()}catch(x){setE(x instanceof Error?x.message:'تعذر تشغيل الوكيل.')}finally{setBusy(false)}};
 const approve=async(id:string)=>{setBusy(true);try{const r=await fetch('/api/purchase-guardian',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({operation:'approve',actionId:id})});const x=await r.json();if(!x.ok)throw Error(x.error);await load()}catch(x){setE(x instanceof Error?x.message:'تعذر اعتماد الإجراء.')}finally{setBusy(false)}};
 return <main dir="rtl" className="min-h-screen bg-black px-6 py-12 text-white"><div className="mx-auto max-w-5xl"><span className="text-xs uppercase tracking-[.3em] text-amber-400">APEX PURCHASE GUARDIAN</span><h1 className="mt-3 text-4xl font-semibold">مشترياتك تحت الحماية 🛡️</h1><p className="mt-2 text-zinc-400">متابعة ما بعد الشراء في مكان واحد.</p>
 {e&&<div className="mt-8 rounded-2xl border border-red-500/30 p-4 text-red-300">{e}</div>}
 {d&&<>
  <div className="mt-8 flex items-center justify-between rounded-3xl border border-amber-400/20 p-5"><div><b>Guardian Agent</b><div className="mt-1 text-sm text-zinc-400">يحوّل التنبيهات إلى إجراءات مقترحة، والإجراءات الحساسة تحتاج موافقتك.</div></div><button disabled={busy} onClick={plan} className="rounded-2xl bg-white px-4 py-2 text-sm font-semibold text-black disabled:opacity-50">{busy?'جاري التشغيل…':'تشغيل الوكيل'}</button></div>
  <div className="mt-8 grid gap-3 sm:grid-cols-4">{[['المشتريات',d.purchaseCount],['ضمانات نشطة',d.activeWarranties],['فترات إرجاع',d.returnWindows],['تحتاج انتباه',d.attentionRequired]].map(([k,v])=><div key={String(k)} className="rounded-3xl border border-white/10 p-5"><div className="text-sm text-zinc-400">{k}</div><div className="mt-2 text-3xl font-bold">{v}</div></div>)}</div>
  {a.length>0&&<div className="mt-8 space-y-3">{a.map(x=><div key={x.id} className="rounded-3xl border border-white/10 p-5"><div className="flex justify-between gap-4"><div><b>{x.action_type}</b><div className="mt-1 text-sm text-zinc-400">{x.reason}</div></div><span className="text-xs text-zinc-500">{x.status}</span></div>{x.status==='APPROVAL_REQUIRED'&&<button disabled={busy} onClick={()=>approve(x.id)} className="mt-4 rounded-xl border border-amber-400/30 px-4 py-2 text-sm">موافقة</button>}</div>)}</div>}
  <div className="mt-8 space-y-4">{d.purchases.map(p=><section key={p.orderId} className="rounded-3xl border border-white/10 p-6"><div className="flex justify-between"><div><div className="text-xs text-zinc-500">طلب #{p.orderId}</div><div className="mt-1 font-semibold">{money(p.total,p.currency)}</div></div><span className="rounded-full border border-white/10 px-3 py-1 text-xs">{p.status}</span></div><div className="mt-4 space-y-2 text-sm text-zinc-300">{p.items.map((i,n)=><div key={`${i.name}-${n}`}>{i.name} × {i.quantity}</div>)}</div>{p.alerts.length>0&&<div className="mt-5 space-y-2">{p.alerts.map((x,i)=><div key={i} className="rounded-2xl border border-amber-400/20 p-4"><b>{x.title}</b><div className="mt-1 text-sm text-zinc-400">{x.message}</div></div>)}</div>}</section>)}</div>
 </>}
 </div></main>;
}
