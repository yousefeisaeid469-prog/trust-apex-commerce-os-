'use client';

import { useEffect, useMemo, useState } from 'react';

type Tab = 'overview' | 'commerce' | 'intelligence' | 'trust';
type Overview = {
  kpis: { gmvToday: number; ordersToday: number; conversion: number; trustIndex: number; activeMerchants: number; activeProducts: number };
  services: { id: string; label: string; status: string; p95: number; uptime: number; owner: string }[];
  attention: { severity: string; title: string; detail: string; action: string }[];
};

const fallback: Overview = {
  kpis: { gmvToday: 184620, ordersToday: 1248, conversion: 4.82, trustIndex: 98.4, activeMerchants: 1842, activeProducts: 68420 },
  services: [
    { id: 'discovery', label: 'Discovery', status: 'operational', p95: 118, uptime: 99.98, owner: 'Experience' },
    { id: 'checkout', label: 'Checkout', status: 'operational', p95: 176, uptime: 99.97, owner: 'Commerce' },
    { id: 'payments', label: 'Payments', status: 'watch', p95: 244, uptime: 99.94, owner: 'Finance' },
    { id: 'inventory', label: 'Inventory', status: 'operational', p95: 132, uptime: 99.99, owner: 'Supply' },
    { id: 'trust', label: 'Trust & Fraud', status: 'operational', p95: 96, uptime: 99.995, owner: 'Risk' },
    { id: 'ai', label: 'TRUST Intelligence', status: 'operational', p95: 210, uptime: 99.96, owner: 'AI' },
  ],
  attention: [
    { severity: 'HIGH', title: 'Payment latency watch', detail: 'P95 ارتفع عن خط الأساس. لا يوجد فشل واسع حاليًا.', action: 'Inspect Payments' },
    { severity: 'MEDIUM', title: 'Low-stock cluster', detail: '14 منتجًا مرشحون لنفاد المخزون خلال 72 ساعة.', action: 'Open Inventory Radar' },
    { severity: 'LOW', title: 'Discovery opportunity', detail: 'هناك فرصة لتحسين ترتيب نتائج فئة الإكسسوارات.', action: 'Run Simulation' },
  ],
};

const money = (n: number) => new Intl.NumberFormat('ar-EG', { maximumFractionDigits: 0 }).format(n);

export default function TrustApexNexus({ onNotify }: { onNotify?: (text: string) => void }) {
  const [tab, setTab] = useState<Tab>('overview');
  const [data, setData] = useState<Overview>(fallback);
  const [pulse, setPulse] = useState(0);

  useEffect(() => {
    fetch('/api/platform/overview', { cache: 'no-store' })
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(x => setData(x))
      .catch(() => setData(fallback));
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setPulse(v => v + 1), 8000);
    return () => clearInterval(timer);
  }, []);

  const serviceScore = useMemo(() => Math.round(data.services.reduce((s, x) => s + x.uptime, 0) / data.services.length * 100) / 100, [data.services]);

  const notify = (text: string) => onNotify?.(text);
  const tabCopy: Record<Tab, { title: string; subtitle: string }> = {
    overview: { title: 'عقل TRUST في شاشة واحدة.', subtitle: 'طبقة موحدة تجمع التجارة، الثقة، الذكاء، والعمليات.' },
    commerce: { title: 'كل رحلة الطلب تحت السيطرة.', subtitle: 'من الاكتشاف إلى Checkout ثم Fulfillment وRetention.' },
    intelligence: { title: 'الذكاء يقترح — والإنسان يقرر.', subtitle: 'محاكاة قبل التنفيذ، ووضوح حول التأثير والثقة.' },
    trust: { title: 'الثقة ليست Badge.', subtitle: 'Risk, Payments, Inventory وGovernance يعملون كمنظومة واحدة.' },
  };

  return <section className="apex-nexus" aria-label="TRUST Apex Nexus">
    <div className="nexus-head">
      <div><span className="eyebrow">TRUST APEX NEXUS · V129</span><h2>{tabCopy[tab].title}</h2><p>{tabCopy[tab].subtitle}</p></div>
      <div className="nexus-live"><span>●</span> LIVE <small>pulse {pulse}</small></div>
    </div>
    <div className="nexus-tabs" role="tablist">
      {([['overview','Executive'],['commerce','Commerce'],['intelligence','Intelligence'],['trust','Trust'] ] as [Tab,string][]).map(([key,label]) => <button key={key} className={tab===key?'selected':''} onClick={() => setTab(key)}>{label}</button>)}
    </div>

    {tab === 'overview' && <>
      <div className="nexus-kpis">
        <Metric label="GMV TODAY" value={`EGP ${money(data.kpis.gmvToday)}`} delta="+18.7%" />
        <Metric label="ORDERS" value={money(data.kpis.ordersToday)} delta="+11.2%" />
        <Metric label="CONVERSION" value={`${data.kpis.conversion}%`} delta="+0.91pp" />
        <Metric label="TRUST INDEX" value={data.kpis.trustIndex.toFixed(1)} delta="healthy" />
        <Metric label="MERCHANTS" value={money(data.kpis.activeMerchants)} delta="active" />
        <Metric label="CATALOG" value={money(data.kpis.activeProducts)} delta="indexed" />
      </div>
      <div className="nexus-grid">
        <div className="nexus-panel"><div className="nexus-panel-head"><h3>Service Mesh</h3><span>{serviceScore}% avg uptime</span></div><div className="service-mesh">{data.services.map(s => <div className={`service-row ${s.status}`} key={s.id}><span className="service-dot"/><b>{s.label}</b><small>{s.owner}</small><em>{s.p95}ms P95</em><strong>{s.uptime}%</strong></div>)}</div></div>
        <div className="nexus-panel"><div className="nexus-panel-head"><h3>Priority Attention</h3><span>3 signals</span></div><div className="attention-list">{data.attention.map(a => <button key={a.title} onClick={() => notify(`${a.action} · مراجعة فقط`)}><span className={`severity ${a.severity.toLowerCase()}`}>{a.severity}</span><div><b>{a.title}</b><p>{a.detail}</p></div><i>→</i></button>)}</div></div>
      </div>
    </>}

    {tab === 'commerce' && <NexusBoard items={[
      ['DISCOVERY','4.82% conversion','Search → Product → Cart','/discovery'],['CHECKOUT','98.9% completion','Cart → Payment','/api/checkout'],['FULFILLMENT','42–120 min','Promise → Dispatch','/order-tracker'],['RETENTION','+14.2%','Reorder + Wishlist','/retention'],
    ]} notify={notify} />}
    {tab === 'intelligence' && <NexusBoard items={[
      ['DECISION QUEUE','18 pending','AI proposals awaiting review','/decision-center'],['SCENARIO LAB','24 scenarios','Price / stock / ads simulations','/scenario-lab'],['AI QUALITY','98.1%','Guardrails + evaluation score','/ai-quality'],['AUTOPILOT','SAFE','Execution requires approval','/autopilot'],
    ]} notify={notify} />}
    {tab === 'trust' && <NexusBoard items={[
      ['FRAUD SHIELD','0.21% blocked','Velocity + anomaly signals','/reliability'],['PAYMENTS','99.94%','Latency watch only','/api/finance'],['GOVERNANCE','100% logged','Privileged action trail','/governance'],['PRIVACY','LOCAL-FIRST','Consent + data controls','/consent-center'],
    ]} notify={notify} />}

    <div className="nexus-footer"><span>One platform · one operating picture · many specialized systems.</span><div><a href="/merchant-os">Merchant OS</a><a href="/customer-os">Customer OS</a><a href="/governance">Governance</a><a href="/admin">Private Admin</a></div></div>
  </section>;
}

function Metric({ label, value, delta }: { label: string; value: string; delta: string }) { return <div className="nexus-metric"><span>{label}</span><b>{value}</b><small>{delta}</small></div>; }
function NexusBoard({ items, notify }: { items: string[][]; notify: (text: string) => void }) { return <div className="nexus-board">{items.map(([label,value,detail,href]) => <article key={label}><span>{label}</span><strong>{value}</strong><p>{detail}</p><div><a href={href}>Open →</a><button onClick={() => notify(`${label}: Simulation / review فقط`)}>Simulate</button></div></article>)}</div>; }
