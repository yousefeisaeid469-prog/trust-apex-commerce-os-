'use client';

import { useEffect, useMemo, useState } from 'react';
import { usePathname } from 'next/navigation';

type Command = { label: string; detail: string; href: string; icon: string; keywords: string };
const commands: Command[] = [
  { label: 'Marketplace', detail: 'اكتشاف المنتجات والتسوق', href: '/', icon: '⌂', keywords: 'marketplace shop products متجر منتجات' },
  { label: 'Customer Experience', detail: 'رحلة العميل وتجربة ما بعد الشراء', href: '/customer-experience', icon: '✦', keywords: 'customer experience journey' },
  { label: 'Customer OS', detail: 'مركز العميل والطلبات', href: '/customer-os', icon: '◎', keywords: 'customer orders' },
  { label: 'Merchant OS', detail: 'تشغيل المتجر والنمو', href: '/merchant-os', icon: '◇', keywords: 'merchant store growth' },
  { label: 'Intelligence Brain', detail: 'الإشارات والقرارات الذكية', href: '/intelligence-brain', icon: '◈', keywords: 'ai intelligence decisions' },
  { label: 'AI Experience', detail: 'طبقة الذكاء الموحدة', href: '/ai-experience', icon: '✦', keywords: 'ai copilot concierge recommendations' },
  { label: 'Notifications', detail: 'إشعارات الطلبات وما بعد الشراء', href: '/notifications', icon: '◌', keywords: 'notifications alerts order updates' },
  { label: 'Purchase Guardian', detail: 'حماية رحلة ما بعد الشراء', href: '/purchase-guardian', icon: '◉', keywords: 'purchase guardian warranty return' },
  { label: 'Governance', detail: 'الحوكمة والتدقيق والصلاحيات', href: '/governance', icon: '▣', keywords: 'governance audit security' },
  { label: 'Private Admin', detail: 'لوحة التحكم الخاصة', href: '/admin', icon: '▤', keywords: 'admin control plane' },
];

export default function TrustExperienceUpgrade() {
  const [palette, setPalette] = useState(false);
  const [online, setOnline] = useState(true);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const [progress, setProgress] = useState(0);
  const [recentRoutes, setRecentRoutes] = useState<string[]>([]);
  const pathname = usePathname();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return commands;
    return commands.filter(c => `${c.label} ${c.detail} ${c.keywords}`.toLowerCase().includes(q));
  }, [query]);

  const routeName = useMemo(() => {
    if (pathname === '/') return 'Marketplace';
    const labels: Record<string,string> = { '/discovery':'Discovery', '/customer-os':'Customer OS', '/merchant-os':'Merchant OS', '/intelligence-brain':'Intelligence Brain', '/ai-experience':'AI Experience', '/purchase-guardian':'Purchase Guardian', '/governance':'Governance', '/admin':'Private Admin', '/order-tracker':'Order Tracking', '/personal-shopper':'Personal Shopper', '/global-commerce-network':'Global Commerce Network', '/protection':'Protection', '/prevention':'Prevention', '/problem-solver':'Problem Solver' };
    return labels[pathname] ?? 'TRUST Platform';
  }, [pathname]);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('trust.recentRoutes') || '[]');
      setRecentRoutes(Array.isArray(saved) ? saved.filter((x): x is string => typeof x === 'string').slice(0,5) : []);
    } catch {}
  }, []);

  useEffect(() => {
    if (!pathname) return;
    try {
      const next = [pathname, ...recentRoutes.filter(x => x !== pathname)].slice(0,5);
      localStorage.setItem('trust.recentRoutes', JSON.stringify(next));
      setRecentRoutes(next);
    } catch {}
  }, [pathname]);

  useEffect(() => {
    const updateProgress = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(max > 0 ? Math.min(100, Math.round((window.scrollY / max) * 100)) : 0);
    };
    window.addEventListener('scroll', updateProgress, { passive: true });
    window.addEventListener('resize', updateProgress);
    updateProgress();
    return () => { window.removeEventListener('scroll', updateProgress); window.removeEventListener('resize', updateProgress); };
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setPalette(true);
        setQuery('');
        setActive(0);
      }
      if (event.key === 'Escape') setPalette(false);
      if (!palette) return;
      if (event.key === 'ArrowDown') { event.preventDefault(); setActive(v => Math.min(v + 1, Math.max(filtered.length - 1, 0))); }
      if (event.key === 'ArrowUp') { event.preventDefault(); setActive(v => Math.max(v - 1, 0)); }
      if (event.key === 'Enter' && filtered[active]) window.location.href = filtered[active].href;
    };
    const sync = () => setOnline(navigator.onLine);
    window.addEventListener('keydown', onKey);
    window.addEventListener('online', sync);
    window.addEventListener('offline', sync);
    sync();
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('online', sync);
      window.removeEventListener('offline', sync);
    };
  }, [palette, filtered, active]);

  useEffect(() => { if (active >= filtered.length) setActive(0); }, [filtered.length, active]);

  return <>
    <div className="experience-progress" aria-hidden="true"><span style={{ width: `${progress}%` }} /></div>
    {!['/admin-login','/customer-login'].includes(pathname ?? '') && <div className="route-context" aria-label="مسار الصفحة"><a href="/">TRUST</a><span>›</span><b>{routeName}</b><span className="route-recent">{recentRoutes.length} صفحات حديثة</span></div>}
    <a className="skip-link" href="#main-content">تخطّي إلى المحتوى</a>
    <div className={`network-state ${online ? 'online' : 'offline'}`} aria-live="polite">
      <span /> {online ? 'متصل' : 'وضع عدم الاتصال'}
    </div>
    <button className="global-command-trigger" onClick={() => { setPalette(true); setQuery(''); setActive(0); }} aria-label="فتح بحث TRUST">
      <span>⌕</span><span className="command-trigger-text">ابحث في TRUST</span><kbd>Ctrl K</kbd>
    </button>
    <div className="mobile-quick-nav" aria-label="تنقل سريع">
      <a href="/">⌂<small>الرئيسية</small></a>
      <a href="/discovery">⌕<small>اكتشف</small></a>
      <a href="/customer-os">◎<small>حسابي</small></a>
      <a href="/purchase-guardian">◉<small>حمايتي</small></a>
    </div>
    {palette && <div className="global-command" role="dialog" aria-modal="true" aria-label="TRUST Command Palette" onClick={() => setPalette(false)}>
      <div className="command-card" onClick={e => e.stopPropagation()}>
        <div className="command-head"><div><b>TRUST COMMAND</b><span>انتقل لأي جزء من المنظومة</span></div><kbd>ESC</kbd></div>
        <div className="command-input-wrap"><span>⌕</span><input autoFocus value={query} onChange={e => { setQuery(e.target.value); setActive(0); }} placeholder="ابحث عن Marketplace, Merchant OS..." aria-label="البحث في TRUST" /></div>
        <div className="command-actions">
          {filtered.map((item, index) => <a key={item.href} className={index === active ? 'active' : ''} href={item.href} onMouseEnter={() => setActive(index)}>
            <i>{item.icon}</i><div><b>{item.label}</b><small>{item.detail}</small></div><span>↵</span>
          </a>)}
          {!filtered.length && <div className="command-empty">مفيش نتيجة مطابقة. جرّب كلمة أبسط.</div>}
        </div>
        <div className="command-footer"><span>↑↓ تنقّل</span><span>Enter فتح</span><span>Esc إغلاق</span><span>بحث شامل</span></div>
      </div>
    </div>}
  </>;
}
