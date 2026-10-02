'use client';
import { useState } from 'react';

const quotes = [
  ['⚡', 'TRUST Fleet', 'نفس اليوم', '95 EGP', '3–8 ساعات', '420g'],
  ['◉', 'FASTBOX', 'Express', '65 EGP', '8–18 ساعة', '560g'],
  ['♻', 'Nile Express', 'اقتصادي', '42 EGP', '24–48 ساعة', '690g'],
];

const milestones = ['تم إنشاء الشحنة', 'استلام من المخزن', 'في الطريق', 'خارج للتسليم', 'تم التسليم'];

export default function LogisticsPage() {
  const [tab, setTab] = useState<'overview'|'tracking'|'returns'>('overview');
  const [selected, setSelected] = useState(0);
  const [split, setSplit] = useState(true);
  const [copied, setCopied] = useState(false);
  return <main className="logistics-page">
    <section className="logistics-hero">
      <div><div className="eyebrow">TRUST V109 · FULFILLMENT & LOGISTICS OS</div><h1>الشحن، التتبع والمرتجعات<br/><em>في عقل واحد.</em></h1><p>طبقة لوجستية موحدة تربط اختيار شركة الشحن، المخازن، تقسيم الطلب، ETA، التتبع والاستثناءات — مع جاهزية لربط شركات شحن حقيقية لاحقًا.</p></div>
      <div className="logistics-orb"><span>LIVE</span><b>99.2%</b><small>delivery confidence</small></div>
    </section>

    <section className="logistics-tabs"><button className={tab==='overview'?'on':''} onClick={()=>setTab('overview')}>لوحة اللوجستيات</button><button className={tab==='tracking'?'on':''} onClick={()=>setTab('tracking')}>تتبع الطلب</button><button className={tab==='returns'?'on':''} onClick={()=>setTab('returns')}>المرتجعات</button></section>

    {tab==='overview' && <>
      <section className="logistics-kpis"><div><span>ACTIVE SHIPMENTS</span><b>12,840</b><small>+8.4% اليوم</small></div><div><span>ON-TIME DELIVERY</span><b>96.8%</b><small>+1.2 pts</small></div><div><span>AVG ETA</span><b>18.4h</b><small>−2.1h</small></div><div><span>EXCEPTIONS</span><b>0.7%</b><small>تحتاج مراجعة</small></div></section>
      <section className="logistics-grid"><article className="logistics-panel"><header><div><span>SMART CARRIER ROUTER</span><h2>اختر أفضل شحنة</h2></div><button onClick={()=>setSelected((selected+1)%quotes.length)}>تدوير الاختيار ↻</button></header><div className="quote-list">{quotes.map((q,i)=><button key={q[1]} className={selected===i?'chosen':''} onClick={()=>setSelected(i)}><i>{q[0]}</i><div><b>{q[1]}</b><small>{q[2]} · ETA {q[4]}</small></div><strong>{q[3]}</strong><em>{q[5]}</em></button>)}</div><div className="decision"><b>TRUST Recommendation</b><span>أفضل توازن بين السرعة والتكلفة والثقة.</span><strong>{quotes[selected][1]}</strong></div></article>
      <article className="logistics-panel"><header><div><span>FULFILLMENT ORCHESTRATOR</span><h2>توزيع الطلب</h2></div><button onClick={()=>setSplit(!split)}>{split?'Split ON':'Single Node'}</button></header><div className="warehouse"><div><b>WH-CAI-01</b><span>القاهرة · 92% utilization</span><strong>{split?'3 items':'6 items'}</strong></div><div><b>WH-GIZ-02</b><span>الجيزة · 61% utilization</span><strong>{split?'3 items':'—'}</strong></div></div><div className="route-line"><span>Order</span><i></i><span>Warehouse</span><i></i><span>Carrier</span><i></i><span>Customer</span></div></article></section>
    </>}

    {tab==='tracking' && <section className="tracking-card logistics-panel"><header><div><span>TRACKING ENGINE</span><h2>TR-482901734</h2></div><button onClick={async()=>{await navigator.clipboard?.writeText('TR-482901734');setCopied(true);setTimeout(()=>setCopied(false),1200)}}>{copied?'تم النسخ ✓':'نسخ رقم التتبع'}</button></header><div className="tracking-status"><b>في الطريق</b><span>متوقع اليوم · 18:40–21:00</span></div><div className="timeline">{milestones.map((m,i)=><div className={i<3?'done':i===3?'current':''} key={m}><i>{i<3?'✓':i===3?'●':'○'}</i><div><b>{m}</b><small>{i<3?'تم تحديث الحالة بنجاح':i===3?'السائق يقترب من منطقتك':'بانتظار المرحلة السابقة'}</small></div></div>)}</div></section>}

    {tab==='returns' && <section className="returns-grid"><article className="logistics-panel"><span>RETURN INTELLIGENCE</span><h2>بوابة المرتجعات</h2><p>فحص الأهلية، سبب الإرجاع، الاستلام، الفحص، القرار ثم الاسترداد في رحلة واحدة.</p><div className="return-stats"><b>30 <small>يوم نافذة الإرجاع</small></b><b>94.1% <small>معالجة بدون تدخل</small></b><b>2.4d <small>متوسط الاسترداد</small></b></div></article><article className="logistics-panel"><span>EXCEPTION CENTER</span><h2>استثناءات تحتاج قرارًا</h2><div className="exception"><b>عنوان غير مكتمل</b><span>3 طلبات · القاهرة</span><button>مراجعة</button></div><div className="exception"><b>محاولة تسليم فاشلة</b><span>7 طلبات · الجيزة</span><button>إعادة جدولة</button></div><div className="exception"><b>شحنة متأخرة</b><span>2 طلبات · الدقهلية</span><button>تصعيد</button></div></article></section>}

    <section className="logistics-footer"><span>V109 FOUNDATION · PROVIDER ADAPTERS READY</span><span>Demo tracking & quotes — لا تمثل شحنًا حقيقيًا حتى يتم ربط مزود فعلي.</span></section>
  </main>
}
