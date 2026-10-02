'use client';

import { useEffect, useMemo, useState } from 'react';

type Order = { id: string; status?: string; total?: number; createdAt?: string; items?: Array<{ name?: string; qty?: number }> };
type ReturnItem = { id: string; status?: string; orderId?: string; createdAt?: string };
type Profile = { displayName?: string; phone?: string; city?: string };

const tabs = [
  ['overview', 'نظرة عامة'], ['orders', 'طلباتي'], ['returns', 'المرتجعات'], ['profile', 'حسابي'], ['privacy', 'الخصوصية'],
] as const;

export default function CustomerExperience() {
  const [tab, setTab] = useState<(typeof tabs)[number][0]>('overview');
  const [profile, setProfile] = useState<Profile | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [returns, setReturns] = useState<ReturnItem[]>([]);
  const [name, setName] = useState('');
  const [city, setCity] = useState('');
  const [phone, setPhone] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  async function load() {
    const [p, o, r] = await Promise.all([
      fetch('/api/customer/profile', { cache: 'no-store' }).then(x => x.json()),
      fetch('/api/customer/orders', { cache: 'no-store' }).then(x => x.json()),
      fetch('/api/returns', { cache: 'no-store' }).then(x => x.json()),
    ]);
    if (p.ok) { setProfile(p.profile ?? {}); setName(p.profile?.displayName ?? ''); setCity(p.profile?.city ?? ''); setPhone(p.profile?.phone ?? ''); }
    if (o.ok) setOrders(o.orders ?? []);
    if (r.ok) setReturns(r.returns ?? []);
  }
  useEffect(() => { load(); }, []);

  const activeOrders = useMemo(() => orders.filter(o => !['delivered', 'cancelled', 'refunded'].includes(String(o.status).toLowerCase())), [orders]);
  const recentOrders = orders.slice(0, 4);

  async function saveProfile() {
    setBusy(true); setMessage('');
    try {
      const r = await fetch('/api/customer/profile', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ displayName: name, city, phone }) });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error ?? 'تعذر حفظ البيانات');
      setProfile(d.profile); setMessage('تم حفظ بيانات الحساب.');
    } catch (e) { setMessage(e instanceof Error ? e.message : 'حدث خطأ'); }
    finally { setBusy(false); }
  }

  return <main id="main-content" className="cx-page">
    <div className="cx-shell">
      <header className="cx-hero">
        <div>
          <div className="cx-eyebrow">TRUST / CUSTOMER EXPERIENCE OS</div>
          <h1>كل تجربتك.<br /><em>في مكان واحد.</em></h1>
          <p>مركز شخصي لإدارة الطلبات، الشحن، المرتجعات، الحساب والخصوصية — بدون تشتيت وبدون لوحات منفصلة.</p>
        </div>
        <div className="cx-identity">
          <div className="cx-avatar">{(profile?.displayName || 'T').slice(0,1).toUpperCase()}</div>
          <div><span>حساب TRUST</span><b>{profile?.displayName || 'عميل TRUST'}</b><small>بياناتك تحت سيطرتك</small></div>
        </div>
      </header>

      <nav className="cx-tabs" aria-label="أقسام حساب العميل">
        {tabs.map(([id, label]) => <button key={id} className={tab === id ? 'active' : ''} onClick={() => setTab(id)}>{label}</button>)}
      </nav>

      {message && <div className="cx-message" role="status">{message}</div>}

      {tab === 'overview' && <>
        <section className="cx-stats">
          <article><span>الطلبات</span><strong>{orders.length}</strong><small>إجمالي الطلبات المسجلة</small></article>
          <article><span>قيد التنفيذ</span><strong>{activeOrders.length}</strong><small>تحتاج متابعة</small></article>
          <article><span>المرتجعات</span><strong>{returns.length}</strong><small>طلبات الإرجاع</small></article>
          <article><span>الحساب</span><strong>✓</strong><small>مركز موحد وآمن</small></article>
        </section>
        <section className="cx-grid">
          <article className="cx-card cx-primary-card"><div className="cx-card-head"><div><span>LIVE ORDER CENTER</span><h2>طلباتك الحالية</h2></div><button onClick={() => setTab('orders')}>عرض الكل ↗</button></div>
            {activeOrders.length ? activeOrders.slice(0,3).map(o => <OrderRow key={o.id} order={o} />) : <Empty icon="✓" title="لا توجد طلبات قيد التنفيذ" text="عندما تضع طلبًا جديدًا سيظهر هنا مع حالته وتتبع الشحنة." />}
          </article>
          <article className="cx-card cx-ai-card"><span>TRUST CONCIERGE</span><h2>ماذا تريد أن تفعل؟</h2><div className="cx-actions"><button onClick={() => location.href='/'}>استكشف المنتجات <b>→</b></button><button onClick={() => setTab('orders')}>تتبع طلب <b>→</b></button><button onClick={() => setTab('returns')}>إدارة إرجاع <b>→</b></button><button onClick={() => setTab('privacy')}>تحكم في بياناتي <b>→</b></button></div></article>
        </section>
        <section className="cx-card"><div className="cx-card-head"><div><span>RECENT ACTIVITY</span><h2>آخر نشاط</h2></div></div><div className="cx-orders">{recentOrders.length ? recentOrders.map(o => <OrderRow key={o.id} order={o} />) : <Empty icon="○" title="لا يوجد نشاط بعد" text="ابدأ التسوق لتظهر رحلتك هنا." />}</div></section>
      </>}

      {tab === 'orders' && <section className="cx-card"><div className="cx-card-head"><div><span>ORDERS</span><h2>كل طلباتك</h2></div><a href="/order-tracker">التتبع المتقدم ↗</a></div><div className="cx-orders">{orders.length ? orders.map(o => <OrderRow key={o.id} order={o} detailed />) : <Empty icon="□" title="لا توجد طلبات" text="طلباتك ستظهر هنا بعد أول عملية شراء." />}</div></section>}

      {tab === 'returns' && <section className="cx-card"><div className="cx-card-head"><div><span>RETURNS & REFUNDS</span><h2>المرتجعات والاستردادات</h2></div></div>{returns.length ? <div className="cx-return-list">{returns.map(r => <div className="cx-return" key={r.id}><span>RETURN</span><b>{r.id}</b><small>الطلب: {r.orderId || '—'} · الحالة: {r.status || 'قيد المراجعة'}</small><button>التفاصيل ↗</button></div>)}</div> : <Empty icon="↺" title="لا توجد مرتجعات" text="لو احتجت إرجاع منتج، ستظهر حالته وتحديثاته هنا." />}</section>}

      {tab === 'profile' && <section className="cx-card cx-form-card"><div className="cx-card-head"><div><span>IDENTITY</span><h2>بيانات الحساب</h2></div></div><div className="cx-form"><label>اسم العرض<input value={name} onChange={e => setName(e.target.value)} maxLength={80} /></label><label>المدينة<input value={city} onChange={e => setCity(e.target.value)} /></label><label>رقم الهاتف<input value={phone} onChange={e => setPhone(e.target.value)} inputMode="tel" /></label></div><button className="cx-save" disabled={busy} onClick={saveProfile}>{busy ? 'جاري الحفظ…' : 'حفظ التغييرات'}</button></section>}

      {tab === 'privacy' && <section className="cx-privacy"><article className="cx-card"><span>PRIVACY CENTER</span><h2>أنت المتحكم في بياناتك.</h2><p>إعدادات الخصوصية هنا منفصلة عن بيانات الدفع والعمليات الحساسة. لا نخزن أسرارًا في المتصفح كبديل للحماية من الخادم.</p><div className="cx-privacy-row"><div><b>التخصيص المحلي</b><small>يمكنك إيقاف التجربة الشخصية على هذا الجهاز.</small></div><button onClick={() => { localStorage.removeItem('trust_recent'); localStorage.removeItem('trust_personalization'); setMessage('تم مسح بيانات التخصيص المحلية.'); }}>مسح بيانات الجهاز</button></div><div className="cx-privacy-row"><div><b>التحكم في الجلسة</b><small>العمليات الحساسة يجب أن تبقى محمية عبر الخادم.</small></div><a href="/admin-login">مركز الأمان ↗</a></div></article><article className="cx-card"><span>TRANSPARENCY</span><h2>ماذا نعرض لك؟</h2><ul><li>حالة الطلب والشحنة كما يوفرها النظام.</li><li>حالة المرتجع والاسترداد دون اختلاق أرقام أو أرصدة.</li><li>إعدادات حسابك الأساسية.</li><li>خيارات واضحة للتحكم في التخصيص المحلي.</li></ul></article></section>}

      <footer className="cx-footer"><span>TRUST V110 / CUSTOMER EXPERIENCE OS</span><span>Commerce · Payments · Fulfillment · Trust</span></footer>
    </div>
  </main>;
}

function OrderRow({ order, detailed=false }: { order: Order; detailed?: boolean }) { return <div className="cx-order"><div className="cx-order-icon">⌁</div><div className="cx-order-main"><b>{order.id}</b><span>{order.status || 'قيد المعالجة'}{detailed && order.items?.length ? ` · ${order.items.length} منتج` : ''}</span></div><strong>{typeof order.total === 'number' ? `${order.total.toLocaleString('ar-EG')} ج.م` : '—'}</strong><a href={`/order-tracker?order=${encodeURIComponent(order.id)}`}>تتبع ↗</a></div> }
function Empty({icon,title,text}:{icon:string;title:string;text:string}) { return <div className="cx-empty"><b>{icon}</b><h3>{title}</h3><p>{text}</p></div> }
