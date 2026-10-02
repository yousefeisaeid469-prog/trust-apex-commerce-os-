'use client';

import { useEffect, useMemo, useState } from 'react';
import TrustApexNexus from './trust-apex-nexus';
import { formatEGP, formatIndicative, CURRENCY_META, ALL_CURRENCY_CODES, RATES_AS_OF, type SupportedCurrency } from '../lib/i18n/currency';
import { GLOBAL_LANGUAGES, resolveLanguage } from '../lib/i18n/global';
import { rankMarketplaceProducts } from '../modules/marketplace/experience-2';

export type Product = { id:string; name:string; category:string; price:number; oldPrice?:number; merchant:string; rating:number; stock:number; region:string; tags:string[]; image:string };

type Toast = { id: number; text: string };
type CartLine = { product: Product; qty: number };
type Modal = 'product' | 'fit' | 'style' | 'trend' | 'shared' | 'ad' | 'compare' | 'concierge' | 'delivery' | 'price-alert' | 'trust' | 'wishlist' | 'cart' | null;
type Drawer = 'cart' | 'wishlist' | null;

const money = formatEGP;
const modules = [
  ['Command Center', 'القيادة المركزية', '/v63-command-center'],
  ['Visitor Monetization', 'تحقيق الدخل من الزوار', '/visitor-monetization'],
  ['Supply Chain AI', 'التوريد والمخزون', '/opportunity-radar'],
  ['Revenue Copilot', 'مساعد الإيرادات', '/revenue-copilot'],
  ['Revenue Intelligence', 'ذكاء الإيرادات', '/revenue-intelligence'],
  ['Revenue Experiments', 'تجارب الإيرادات', '/revenue-experimentation'],
  ['Revenue Decision Loop', 'حلقة قرارات الإيرادات', '/revenue-decision-loop'],
  ['Production Readiness', 'الجاهزية والأمان', '/production-readiness'],
  ['Production Security & Scale', 'أمان وتوسّع الإنتاج', '/production-security-scale'],
  ['Production Observability', 'المراقبة والبنية العالمية', '/observability'],
  ['Global Reliability', 'التعافي من الكوارث والتشغيل العالمي', '/global-reliability'],
  ['Owner Control Room', 'غرفة التحكم الخاصة بالمالك', '/owner-control-room'],
  ['Trust & Fraud', 'الثقة ومكافحة الاحتيال', '/reliability'],
  ['Governance', 'الحوكمة والتدقيق', '/governance'],
];

export default function TrustOSShell() {
  const [mode, setMode] = useState<'shop' | 'os'>('shop');
  const [query, setQuery] = useState('');
  const [cat, setCat] = useState('All');
  const [cart, setCart] = useState<CartLine[]>([]);
  const [wish, setWish] = useState<string[]>([]);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [voice, setVoice] = useState(false);
  const [mood, setMood] = useState('');
  const [modal, setModal] = useState<Modal>(null);
  const [selected, setSelected] = useState<Product | null>(null);
  const [consent, setConsent] = useState(false);
  const [sort, setSort] = useState<'featured'|'price-low'|'price-high'|'rating'>('featured');
  const [compare, setCompare] = useState<string[]>([]);
  const [recent, setRecent] = useState<string[]>([]);
  const [savedSearches, setSavedSearches] = useState<string[]>([]);
  const [commandQuery, setCommandQuery] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [drawer, setDrawer] = useState<Drawer>(null);
  const [searchFocus, setSearchFocus] = useState(false);
  const [deliveryMode, setDeliveryMode] = useState<'fast'|'balanced'|'eco'>('balanced');
  const [currency, setCurrency] = useState<SupportedCurrency>('EGP');
  const [language, setLanguage] = useState('ar');
  const [dealMode, setDealMode] = useState<'today'|'bundle'|'new'>('today');
  const [compact, setCompact] = useState(false);
  const [compareOpen, setCompareOpen] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [checkoutBusy, setCheckoutBusy] = useState(false);
  const [customerAuthed, setCustomerAuthed] = useState(false);
  const [serverSuggestions, setServerSuggestions] = useState<Product[]>([]);
  const [catalogSearchBusy, setCatalogSearchBusy] = useState(false);
  const [guest, setGuest] = useState({ name: '', phone: '', address: '' });
  useEffect(() => { fetch('/api/admin/session', { cache: 'no-store' }).then(r => r.json()).then(x => setIsAdmin(Boolean(x?.authenticated))).catch(() => setIsAdmin(false)); }, []);
  useEffect(() => { fetch('/api/auth/me', { cache: 'no-store' }).then(r => r.json()).then(x => setCustomerAuthed(Boolean(x?.authenticated))).catch(() => setCustomerAuthed(false)); }, []);
  useEffect(() => { try { const saved = localStorage.getItem('trust.language'); if (saved) setLanguage(resolveLanguage(saved).tag); const savedCurrency = localStorage.getItem('trust.currency'); if (savedCurrency) setCurrency(savedCurrency.toUpperCase()); } catch {} }, []);
  useEffect(() => { const lang = resolveLanguage(language); document.documentElement.lang = lang.tag; document.documentElement.dir = lang.dir; localStorage.setItem('trust.language', lang.tag); }, [language]);
  useEffect(() => { localStorage.setItem('trust.currency', currency); }, [currency]);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) { setServerSuggestions([]); return; }
    let cancelled = false;
    const timer = setTimeout(() => {
      fetch(`/api/catalog/suggestions?q=${encodeURIComponent(q)}`, { cache: 'no-store' })
        .then(r => r.json())
        .then(data => {
          if (cancelled) return;
          setServerSuggestions(Array.isArray(data?.suggestions) ? data.suggestions.map((p:any) => ({
            id: p.id, name: p.name, category: p.category, price: Number(p.price), merchant: p.merchantName ?? '',
            rating: 0, stock: 1, region: '', tags: [], image: p.image ?? ''
          })) : []);
        })
        .catch(() => { if (!cancelled) setServerSuggestions([]); });
    }, 220);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [query]);

  async function executeCatalogSearch() {
    const q = query.trim();
    if (!q) return;
    setCatalogSearchBusy(true);
    try {
      const params = new URLSearchParams({ q, limit: '60', sort: sort === 'price-low' ? 'price_asc' : sort === 'price-high' ? 'price_desc' : sort === 'rating' ? 'rating' : 'relevance' });
      if (cat !== 'All') params.set('category', cat);
      const response = await fetch(`/api/catalog/search?${params}`, { cache: 'no-store' });
      const data = await response.json();
      if (!response.ok || !data.ok) throw new Error(data?.error ?? 'CATALOG_SEARCH_FAILED');
      setProducts((data.items ?? []).map((p:any): Product => ({
        id:p.id,name:p.name,category:p.category,price:Number(p.price),oldPrice:p.oldPrice,merchant:p.merchantName ?? '',
        rating:Number(p.rating),stock:Number(p.stock),region:p.region,tags:p.tags ?? [],image:p.image ?? ''
      })));
      setSearchFocus(false);
      document.getElementById('catalog')?.scrollIntoView({behavior:'smooth'});
    } catch {
      notify('تعذر تنفيذ البحث من الكتالوج الآن');
    } finally { setCatalogSearchBusy(false); }
  }

  useEffect(() => {
    let cancelled = false;
    setProductsLoading(true);
    fetch('/api/products?limit=60', { cache: 'no-store' })
      .then(r => r.json())
      .then(data => {
        if (cancelled) return;
        const items = Array.isArray(data?.items) ? data.items : [];
        setProducts(items.map((p: any): Product => ({
          id: p.id, name: p.name, category: p.category, price: p.price, oldPrice: p.oldPrice,
          merchant: p.merchantName, rating: p.rating, stock: p.stock, region: p.region,
          tags: p.tags ?? [], image: p.image ?? '',
        })));
      })
      .catch(() => { if (!cancelled) setProducts([]); })
      .finally(() => { if (!cancelled) setProductsLoading(false); });
    return () => { cancelled = true; };
  }, []);

  async function checkout() {
    if (cart.length === 0) return notify('السلة فاضية');
    if (!customerAuthed) {
      if (!guest.name.trim() || guest.name.trim().length < 2) return notify('اكتب اسمك كامل');
      if (!/^01[0125]\d{8}$/.test(guest.phone.trim())) return notify('رقم التليفون لازم يكون رقم مصري صحيح (01xxxxxxxxx)');
      if (!guest.address.trim() || guest.address.trim().length < 10) return notify('اكتب عنوان التوصيل بالتفصيل');
    }
    setCheckoutBusy(true);
    try {
      const items = cart.map(line => ({ productId: line.product.id, qty: line.qty }));
      const previewRes = await fetch('/api/checkout/preview', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({items,clientItems:cart.map(line=>({productId:line.product.id,unitPrice:line.product.price}))}) }).then(r=>r.json());
      if (!previewRes?.ok) { notify(`تعذّر تحديث السلة: ${previewRes?.error ?? 'خطأ غير معروف'}`); return; }
      const preview=previewRes.checkout;
      if (preview.code === 'INSUFFICIENT_STOCK') {
        setCart(lines=>lines.map(line=>{const item=preview.items.find((x:any)=>x.productId===line.product.id);return item?{...line,qty:Math.min(line.qty,Math.max(0,Number(item.stock))),product:{...line.product,price:Number(item.unitPrice),stock:Number(item.stock)}}:line}).filter(line=>line.qty>0));
        notify('المخزون اتغير — عدّلت الكميات المتاحة، راجع السلة قبل التأكيد'); return;
      }
      if (preview.priceChanged) {
        setCart(lines=>lines.map(line=>{const item=preview.items.find((x:any)=>x.productId===line.product.id);return item?{...line,product:{...line.product,price:Number(item.unitPrice),stock:Number(item.stock)}}:line}));
        notify('سعر منتج اتغير — حدّثنا السعر، راجع الإجمالي واضغط تأكيد مرة تانية'); return;
      }
      if (customerAuthed) {
        const cartRes=await fetch('/api/cart',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({items})}).then(r=>r.json());
        if(!cartRes?.ok){notify(`تعذّر تجهيز السلة: ${cartRes?.error??'خطأ غير معروف'}`);return;}
      }
      const idempotencyKey=`checkout_${Date.now()}_${Math.random().toString(36).slice(2,10)}`;
      const orderRes=await fetch('/api/checkout/commit',{method:'POST',headers:{'Content-Type':'application/json','Idempotency-Key':idempotencyKey},body:JSON.stringify({items,shipping:preview.shipping,idempotencyKey,paymentMethod:'cod',guest:customerAuthed?undefined:{name:guest.name.trim(),phone:guest.phone.trim(),address:guest.address.trim()}})}).then(r=>r.json());
      if(!orderRes?.ok){notify(`فشل إتمام الطلب: ${orderRes?.error??'خطأ غير معروف'}`);return;}
      notify(`تم تأكيد الطلب رقم ${orderRes.order.id} — احتفظ بيه لمتابعة الطلب من صفحة تتبّع الطلبات — الدفع كاش عند الاستلام — الإجمالي ${money(orderRes.order.total)}`);
      setCart([]);setDrawer(null);setModal(null);setGuest({name:'',phone:'',address:''});
    } catch { notify('حصل خطأ أثناء إتمام الطلب، جرّب تاني'); } finally { setCheckoutBusy(false); }
  }

  useEffect(() => {
    try {
      const savedCart = JSON.parse(localStorage.getItem('trust.cart') || '[]') as CartLine[];
      const savedWish = JSON.parse(localStorage.getItem('trust.wish') || '[]') as string[];
      const savedConsent = localStorage.getItem('trust.consent') === '1';
      if (Array.isArray(savedCart)) setCart(savedCart);
      if (Array.isArray(savedWish)) setWish(savedWish);
      const savedRecent = JSON.parse(localStorage.getItem('trust.recent') || '[]') as string[];
      const savedSearches = JSON.parse(localStorage.getItem('trust.searches') || '[]') as string[];
      if (Array.isArray(savedRecent)) setRecent(savedRecent);
      if (Array.isArray(savedSearches)) setSavedSearches(savedSearches);
      setConsent(savedConsent);
    } catch { /* first session / corrupt local state */ }
  }, []);

  useEffect(() => { localStorage.setItem('trust.cart', JSON.stringify(cart)); }, [cart]);
  useEffect(() => { localStorage.setItem('trust.wish', JSON.stringify(wish)); }, [wish]);
  useEffect(() => { localStorage.setItem('trust.consent', consent ? '1' : '0'); }, [consent]);
  useEffect(() => { localStorage.setItem('trust.recent', JSON.stringify(recent)); }, [recent]);
  useEffect(() => { localStorage.setItem('trust.searches', JSON.stringify(savedSearches)); }, [savedSearches]);

  const categories = ['All', ...Array.from(new Set(products.map(p => p.category)))];
  const filtered = useMemo(() => {
    const list = products.filter(p =>
    (cat === 'All' || p.category === cat) &&
    (!query || `${p.name} ${p.tags.join(' ')}`.toLowerCase().includes(query.toLowerCase())) &&
    (!mood || p.tags.some(t => mood.toLowerCase().includes(t) || (mood === 'ليلي' && t === 'night') || (mood === 'داكن' && t === 'dark')))
  );
    if (sort === 'featured') {
      return rankMarketplaceProducts(list, { query, category: cat === 'All' ? undefined : cat, preferredTags: mood ? [mood.toLowerCase()] : [] });
    }
    return [...list].sort((a,b) => sort === 'price-low' ? a.price-b.price : sort === 'price-high' ? b.price-a.price : b.rating-a.rating);
  }, [cat, query, mood, sort, products]);
  const cartCount = cart.reduce((sum, line) => sum + line.qty, 0);
  const cartTotal = cart.reduce((sum, line) => sum + line.product.price * line.qty, 0);
  const cartStockWarnings = cart.filter(line => line.qty > line.product.stock);
  const wishlistProducts = products.filter(p => wish.includes(p.id));
  const suggestions = query.trim() ? (serverSuggestions.length ? serverSuggestions : products.filter(p => `${p.name} ${p.tags.join(' ')}`.toLowerCase().includes(query.toLowerCase())).slice(0, 4)) : recent.map(id => products.find(p => p.id === id)).filter(Boolean).slice(0,4) as Product[];
  const displayMoney = (n: number) => currency === 'EGP' ? money(n) : `${money(n)} (${formatIndicative(n, currency)})`;

  const notify = (text: string) => {
    const id = Date.now() + Math.random();
    setToasts(x => [...x, { id, text }]);
    setTimeout(() => setToasts(x => x.filter(t => t.id !== id)), 2800);
  };

  const add = (product: Product) => {
    setCart(lines => {
      const exists = lines.find(line => line.product.id === product.id);
      return exists
        ? lines.map(line => line.product.id === product.id ? { ...line, qty: Math.min(line.qty + 1, product.stock) } : line)
        : [...lines, { product, qty: 1 }];
    });
    notify(`تمت إضافة ${product.name} للسلة`);
  };

  const changeQty = (id: string, delta: number) => setCart(lines => lines.flatMap(line => {
    if (line.product.id !== id) return [line];
    const qty = Math.min(line.product.stock, line.qty + delta);
    return qty > 0 ? [{ ...line, qty }] : [];
  }));

  const toggleWish = (product: Product) => {
    setWish(ids => ids.includes(product.id) ? ids.filter(id => id !== product.id) : [...ids, product.id]);
    notify(wish.includes(product.id) ? 'تمت إزالة المنتج من الأمنيات' : 'تم حفظ المنتج — سنراقب السعر');
  };

  const openProduct = (product: Product) => { setSelected(product); setRecent(ids => [product.id, ...ids.filter(id => id !== product.id)].slice(0, 6)); setSearchFocus(false); setModal('product'); };
  const openCart = () => { setDrawer('cart'); setModal(null); };
  const openWishlist = () => { setDrawer('wishlist'); setModal(null); };
  const saveSearch = () => { const q = query.trim(); if (!q) return notify('اكتب بحثًا أولاً'); setSavedSearches(xs => [q, ...xs.filter(x => x !== q)].slice(0, 5)); notify(`تم حفظ البحث: ${q}`); };
  const recommended = products.filter(p => recent.includes(p.id) || p.rating >= 4.7).slice(0, 4);
  const recentProducts = recent.map(id => products.find(p => p.id === id)).filter(Boolean) as Product[];
  const dealProducts = products.filter(p => p.oldPrice).slice(0, 3);
  const compareProducts = products.filter(p => compare.includes(p.id));
  const commandItems = [['Marketplace','/'],['Customer OS','/customer-os'],['Merchant OS','/merchant-os'],['Admin OS','/admin'],['Governance','/governance'],['AI Boardroom','/ai-boardroom'],['Opportunity Radar','/opportunity-radar'],['Order Tracker','/order-tracker'],['Data Core','/data-core'],['Why TRUST','/trust-difference'],['AI Concierge','/concierge'],['Visual Search','/visual-search'],['Discovery Revolution','/discovery'],['Notifications','/notifications'],['Personal Shopper','/personal-shopper'],['Merchant Supergraph','/merchant-supergraph-admin'],['Problem Solver OS','/problem-solver-admin'],['Prevention OS','/prevention-admin'],['Protection OS','/protection-admin'],['Decision Fabric','/decision-fabric-admin']].filter(([name]) => name.toLowerCase().includes(commandQuery.toLowerCase()));
  const toggleCompare = (product: Product) => setCompare(ids => ids.includes(product.id) ? ids.filter(id => id !== product.id) : ids.length >= 3 ? ids : [...ids, product.id]);
  const askVoice = () => { setVoice(v => !v); if (!voice) notify('Arabic Voice Commerce جاهز — جرّب: هودي أسود ثقيل لارج'); };
  const acceptConsent = () => { setConsent(true); notify('تم حفظ تفضيل الخصوصية — بدون بيع للهوية الشخصية'); };
  const logout = () => { fetch('/api/auth/logout', { method: 'POST' }).then(() => { setCustomerAuthed(false); notify('تم تسجيل الخروج'); }); };

  return <div className={`trust-shell ${compact ? 'focus-mode' : ''}`}>
    <header className="topbar">
      <div className="brand"><span className="brand-mark">T</span><div><b>TRUST</b><small>APEX COMMERCE OS · V129</small></div></div>
      <div className="top-actions">
        <button className={mode === 'shop' ? 'active' : ''} onClick={() => setMode('shop')}>Marketplace</button>
        <button className={mode === 'os' ? 'active' : ''} onClick={() => setMode('os')}>TRUST OS</button>
        <button className="top-icon" onClick={openWishlist}>♡ <span>المفضلة</span></button><button className="top-icon" onClick={openCart}>🛒 <span>{cartCount}</span></button>{customerAuthed ? <button className="top-icon" onClick={logout}>👤 <span>خروج</span></button> : <a href="/customer-login">تسجيل الدخول</a>}{isAdmin && <a href="/admin">Admin OS</a>}<a href="/governance">Governance</a><a href="/trust-difference">Why TRUST</a><a href="/discovery">Discovery</a><a href="/notifications">Notifications</a><a href="/personal-shopper">Personal Shopper</a><a href="/global-commerce-network">Network</a><a href="/order-tracker">Orders</a><a href="/problem-solver">Solve a Problem</a><a href="/prevention">Prevent Problems</a><a href="/protection">Protection</a><a href="/decision-fabric">Decision Fabric</a><a href="/trust-commerce-network">TRUST One</a>
        <button className="top-icon" onClick={() => setCompact(v => !v)} aria-pressed={compact}>◐ <span>{compact ? 'Compact' : 'Focus'}</span></button>{compare.length > 0 && <button className="top-icon" onClick={() => setCompareOpen(true)}>⚖ <span>مقارنة {compare.length}</span></button>}<span className="live-dot">● LIVE</span>
      </div>
    </header>

    {mode === 'shop' ? <>
      <section className="hero">
        <div className="hero-copy"><span className="eyebrow">INTELLIGENT COMMERCE · EGYPT</span>
          <h1>تجارة أذكى.<br/><em>ثقة أقوى.</em><br/>تجربة مختلفة.</h1>
          <p>Marketplace مبني حول الذكاء، الثقة، التخصيص، والمخزون الحقيقي — من أول زيارة حتى ما بعد التسليم.</p><div className="hero-proof"><span>✓ أسعار واضحة</span><span>✓ بائعون موثوقون</span><span>✓ Checkout بدون مفاجآت</span></div>
          <div className={`searchbar ${searchFocus ? 'is-focused' : ''} ${catalogSearchBusy ? 'is-loading' : ''}`}><span>⌕</span><input value={query} onFocus={() => setSearchFocus(true)} onChange={e => setQuery(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') void executeCatalogSearch(); }} aria-label="البحث" placeholder="ابحث عن منتج، ستايل، لون..."/><button onClick={() => void executeCatalogSearch()} disabled={catalogSearchBusy} aria-label="تنفيذ البحث">{catalogSearchBusy ? '…' : '⌕'}</button><button onClick={askVoice} aria-label="البحث الصوتي">🎙</button></div>
          {searchFocus && <div className="search-suggest" onMouseDown={e => e.preventDefault()}><div><b>{query ? 'نتائج سريعة' : 'اكتشاف سريع'}</b><button onClick={() => { setSearchFocus(false); setQuery(''); }}>إغلاق</button></div>{suggestions.length ? suggestions.map(p => <button key={p.id} onClick={() => openProduct(p)}><img src={p.image} alt=""/><span><b>{p.name}</b><small>{p.merchant} · {displayMoney(p.price)}</small></span><i>↗</i></button>) : <p>جرب: hoodie، black، night، cargo</p>}</div>}
          <div className="hero-chips"><button onClick={() => setMood('داكن')}>داكن اليوم</button><button onClick={() => setMood('ليلي')}>Night Style</button><button onClick={() => setMood('oversized')}>Oversized</button><button onClick={() => setModal('style')}>AI Stylist</button><button onClick={() => { setQuery(''); setMood(''); }}>إظهار الكل</button></div>
        </div>
        <div className="hero-panel"><div className="panel-top"><span>TRUST INTELLIGENCE</span><span className="pulse">●</span></div><div className="orb"><div className="orb-core">AI</div></div><div className="signal"><span>Market Pulse</span><b>+24.8%</b></div><div className="signal"><span>Trust Score</span><b>98.4</b></div><div className="signal"><span>Fastest Dispatch</span><b>42 min</b></div></div><div className="hero-command-rail"><button onClick={() => setModal('concierge')}><b>TRUST Concierge</b><span>خلّيني أختار لك</span></button><button onClick={() => setModal('delivery')}><b>Delivery Promise</b><span>شوف أقرب موعد</span></button><button onClick={() => setModal('price-alert')}><b>Price Watch</b><span>راقب السعر</span></button><button onClick={() => setModal('trust')}><b>Why TRUST?</b><span>اعرف درجة الثقة</span></button></div>
      </section>

      <TrustApexNexus onNotify={notify} />
      <section className="live-strip"><div><span className="live-pulse">●</span><b>TRUST LIVE</b><small>المنصة تعمل الآن</small></div><div><span>⚡</span><b>42–90 دقيقة</b><small>تقدير Dispatch محلي</small></div><div><span>🛡️</span><b>98.4</b><small>Trust Index</small></div><div><span>♻</span><b>أقل بيانات</b><small>Privacy-first</small></div><div className="currency-switch"><label>🌐 <select aria-label="اللغة" value={language} onChange={e => setLanguage(e.target.value)}>{GLOBAL_LANGUAGES.map(l => <option key={l.tag} value={l.tag}>{l.nativeName} — {l.englishName}</option>)}</select></label><label>💱 <select aria-label="العملة" value={currency} onChange={e => setCurrency(e.target.value)}>{ALL_CURRENCY_CODES.map(c => <option key={c} value={c}>{c} — {CURRENCY_META[c]?.label ?? c}</option>)}</select></label><small className="currency-note" title={`سعر تقريبي بتاريخ ${RATES_AS_OF} — كل الطلبات بتتحصّل بالجنيه المصري فعليًا`}>تحويل العرض فقط ⓘ</small></div></section>

      <section className="metrics"><div><b>{productsLoading ? '…' : products.length}</b><span>منتجات مختارة</span></div><div><b>98.4%</b><span>Trust Index</span></div><div><b>24/7</b><span>AI Intelligence</span></div><div><b>0</b><span>تتبع غير ضروري للهوية</span></div></section>

      <section className="catalog" id="catalog"><div className="section-head"><div><span className="eyebrow">DISCOVERY ENGINE</span><h2>اكتشف اللي يناسبك</h2></div><div className="catalog-tools"><select value={sort} onChange={e => setSort(e.target.value as typeof sort)} aria-label="ترتيب المنتجات"><option value="featured">الأبرز</option><option value="rating">الأعلى تقييماً</option><option value="price-low">السعر: الأقل</option><option value="price-high">السعر: الأعلى</option></select><button onClick={() => setModal('compare')}>مقارنة {compare.length ? `(${compare.length})` : ''}</button><button onClick={saveSearch}>حفظ البحث</button></div><div className="categories">{categories.map(c => <button key={c} className={cat === c ? 'selected' : ''} onClick={() => setCat(c)}>{c === 'All' ? 'الكل' : c}</button>)}</div></div>
        <div className="product-grid">{filtered.map(p => <article className="product-card" key={p.id}>
          <div className="product-image"><img src={p.image} alt={p.name} loading="lazy" onError={e => { e.currentTarget.style.opacity = '0'; }}/><button className="compare-btn" onClick={() => toggleCompare(p)} aria-label="مقارنة المنتج">{compare.includes(p.id) ? '✓' : '⇄'}</button><button className="heart" onClick={() => toggleWish(p)} aria-label="حفظ المنتج">{wish.includes(p.id) ? '♥' : '♡'}</button>{p.oldPrice && <span className="sale">عرض</span>}<div className="quick">TRUST Match · {p.match ?? Math.round(80 + p.rating * 3)}%</div><button className="inspect" onClick={() => openProduct(p)}>عرض سريع</button></div>
          <div className="product-info"><div className="merchant">{p.merchant} · <span>✓ موثوق</span></div><h3>{p.name}</h3><div className="rating">★★★★★ <small>{p.rating}</small></div><div className="price">{displayMoney(p.price)} {p.oldPrice && <del>{displayMoney(p.oldPrice)}</del>}</div><div className="stock">{p.stock < 20 ? '⚡ كمية محدودة' : '● متوفر'} · شحن من {p.region}</div>{p.reasons && <div className="match-reasons" aria-label="أسباب الترشيح">{p.reasons.slice(0,2).map(reason => <span key={reason}>✓ {reason}</span>)}</div>}<button className="add" onClick={() => add(p)}>أضف للسلة <span>＋</span></button><div className="micro-actions"><button onClick={() => { setSelected(p); setModal('price-alert'); }}>راقب السعر</button><button onClick={() => openProduct(p)}>تفاصيل الثقة</button></div></div>
        </article>)}</div>
        {productsLoading && <div className="empty-state"><b>جاري تحميل المنتجات...</b></div>}
        {!productsLoading && !products.length && <div className="empty-state"><b>لسه مفيش منتجات على المنصة.</b><p>التجار يقدروا يضيفوا منتجاتهم من لوحة التاجر.</p></div>}
        {!productsLoading && products.length > 0 && !filtered.length && <div className="empty-state"><b>مفيش نتائج مطابقة.</b><button onClick={() => { setQuery(''); setMood(''); setCat('All'); }}>إعادة البحث</button></div>}
      </section>

      <section className="recommendation-zone"><div className="section-head"><div><span className="eyebrow">TRUST PERSONALIZATION</span><h2>اختيارات أذكى ليك</h2></div><span className="recommendation-note">تُبنى من نشاط الجلسة فقط</span></div><div className="recommendation-grid">{recommended.map(p => <button className="recommendation-card" key={p.id} onClick={() => openProduct(p)}><img src={p.image} alt="" loading="lazy"/><div><span>{p.merchant} · موثوق</span><b>{p.name}</b><strong>{displayMoney(p.price)}</strong><small>AI Match · {Math.round(90 + p.rating)}%</small></div></button>)}</div>{savedSearches.length > 0 && <div className="saved-searches"><span>عمليات البحث المحفوظة:</span>{savedSearches.map(x => <button key={x} onClick={() => setQuery(x)}>{x}</button>)}</div>}</section>
      <section className="personal-cockpit">
        <div className="cockpit-head"><div><span className="eyebrow">TRUST PERSONAL COCKPIT</span><h2>كل حاجة مهمة ليك، في مكان واحد.</h2><p>إعداداتك، اختياراتك، وتنبيهاتك — محفوظة محليًا على جهازك.</p></div><button className="cockpit-reset" onClick={() => { localStorage.removeItem('trust.searches'); localStorage.removeItem('trust.recent'); setSavedSearches([]); setRecent([]); notify('تم مسح بيانات التخصيص المحلية'); }}>مسح التخصيص</button></div>
        <div className="cockpit-grid">
          <article className="cockpit-card"><span>SMART SEARCHES</span><b>{savedSearches.length}</b><p>عمليات بحث محفوظة</p><div className="cockpit-tags">{savedSearches.slice(0,3).map(x => <button key={x} onClick={() => setQuery(x)}>{x}</button>)}{!savedSearches.length && <small>احفظ أول بحث من شريط البحث.</small>}</div></article>
          <article className="cockpit-card"><span>RECENT MEMORY</span><b>{recentProducts.length}</b><p>منتجات في سجل التصفح</p><button onClick={() => recentProducts[0] ? openProduct(recentProducts[0]) : notify('شاهد منتجًا أولًا')}>متابعة التسوق →</button></article>
          <article className="cockpit-card"><span>ALERTS</span><b>3</b><p>تنبيهات ذكية جاهزة</p><div className="alert-list"><span>↘ Price Watch</span><span>⚡ Delivery</span><span>✦ New Drop</span></div></article>
          <article className="cockpit-card"><span>PRIVACY CONTROL</span><b>{consent ? 'ON' : 'OFF'}</b><p>{consent ? 'التخصيص مسموح محليًا' : 'التخصيص غير مفعّل'}</p><button onClick={() => { setConsent(!consent); notify(!consent ? 'تم تفعيل التخصيص المحلي' : 'تم إيقاف التخصيص المحلي'); }}>{consent ? 'إيقاف التخصيص' : 'تفعيل التخصيص'}</button></article>
        </div>
      </section>
      <section className="experience-hub">
        <div className="experience-head"><div><span className="eyebrow">TRUST DISCOVERY ENGINE</span><h2>اختيارات تتغير معاك.</h2><p>عروض، إعادة شراء، ومجموعات ذكية في مسار واحد.</p></div><div className="experience-tabs">{[['today','⚡ عروض اليوم'],['bundle','✦ Bundles'],['new','✦ وصل حديثًا']].map(([key,label]) => <button key={key} className={dealMode===key?'selected':''} onClick={() => setDealMode(key as typeof dealMode)}>{label}</button>)}</div></div>
        <div className="experience-grid">
          <article className="experience-feature"><span>TRUST WALLET</span><b>مكافآت شفافة</b><strong>1,240 نقطة</strong><small>تجريبية — لا تمثل رصيدًا ماليًا</small><button onClick={() => notify('Wallet: شاشة المكافآت التجريبية جاهزة')}>افتح المحفظة →</button></article>
          <article className="experience-feature"><span>SMART BUNDLE</span><b>وفّر أكثر معًا</b><strong>حتى 12% محاكاة</strong><small>خصم تجريبي قبل ربط محرك التسعير الحقيقي</small><button onClick={() => { setQuery(''); setSort('price-low'); notify('Bundle mode: تم ترتيب المنتجات حسب القيمة'); }}>استكشف Bundles →</button></article>
          <article className="experience-feature"><span>REORDER</span><b>إعادة الشراء بضغطة</b><strong>{recentProducts.length} عناصر حديثة</strong><small>محفوظة محليًا على جهازك</small><button onClick={() => recentProducts[0] ? add(recentProducts[0]) : notify('شاهد منتجًا أولًا لتفعيل Reorder')}>أعد الطلب →</button></article>
        </div>
        <div className="deal-rail">{(dealMode==='today'?dealProducts:dealMode==='bundle'?products.slice(0,3):products.slice(3,6)).map(p => <button key={p.id} onClick={() => openProduct(p)}><img src={p.image} alt="" loading="lazy"/><span><b>{p.name}</b><small>{p.oldPrice ? `خصم ${Math.round((1-p.price/p.oldPrice)*100)}%` : 'TRUST pick'} · {displayMoney(p.price)}</small></span></button>)}</div>
      </section>
      {recentProducts.length > 0 && <section className="recent-zone"><div className="section-head"><div><span className="eyebrow">CONTINUE SHOPPING</span><h2>لسه مخلصناش.</h2></div><button onClick={() => { setRecent([]); localStorage.removeItem('trust.recent'); notify('تم مسح سجل التصفح المحلي'); }}>مسح السجل</button></div><div className="recent-rail">{recentProducts.map(p => <button key={p.id} onClick={() => openProduct(p)}><img src={p.image} alt="" loading="lazy"/><b>{p.name}</b><span>{displayMoney(p.price)}</span></button>)}</div></section>}
      <section className="trust-benefits"><div className="benefit-intro"><span className="eyebrow">TRUST DIFFERENCE</span><h2>المتجر يفهمك، مش بيضغط عليك.</h2><p>اكتشاف شخصي، شفافية في السعر والشحن، وتحكم كامل في البيانات — في تجربة واحدة.</p></div><div className="benefit-grid"><div><b>01</b><h3>Smart Discovery</h3><span>بحث واقتراحات سريعة بدون دوامة فلترة.</span></div><div><b>02</b><h3>Transparent Checkout</h3><span>الرسوم وموعد التسليم قبل القرار النهائي.</span></div><div><b>03</b><h3>Trust by Design</h3><span>إشارات الثقة والإعلانات الممولة واضحة للمستخدم.</span></div><div><b>04</b><h3>Control Your Data</h3><span>الخصوصية اختيار أساسي وليست إعدادًا مخفيًا.</span></div></div></section>

<section className="feature-strip"><Feature n="01" title="AI Stylist" text="كوّن Look كامل من المنتجات الحالية." action="افتح المصمم" onClick={() => setModal('style')} /><Feature n="02" title="Fit Twin" text="3 أسئلة سريعة لتوصية مقاس مبدئية." action="اعرف مقاسك" onClick={() => setModal('fit')} /><Feature n="03" title="Live Inventory Radar" text="قارن المنطقة والسرعة قبل الطلب." action="افتح الرادار" onClick={() => notify('Radar: أقرب مخزون تجريبي متاح الآن')} /></section>

      <section className="apex-tools"><div><span className="eyebrow">SOCIAL + VISITOR ECONOMY</span><h2>مش مجرد متجر.</h2><p>حوّل التصفح إلى اكتشاف، مشاركة، تفاعل، وعودة — مع إفصاح واضح وموافقة المستخدم.</p></div><div className="tool-grid"><Tool title="Style Battles" text="نسّق طقمك وخلي الناس تصوّت." onClick={() => setModal('trend')} /><Tool title="Shared Cart" text="سلة مشتركة للأصدقاء مع كود دعوة." onClick={() => setModal('shared')} /><Tool title="Visitor Showcase" text="مساحة ترويج مصغرة بإفصاح Sponsored." onClick={() => setModal('ad')} /><Tool title="Trend Prediction" text="توقع الاتجاه وخد نقاطاً تجريبية." onClick={() => setModal('trend')} /></div></section>

      <section className="lookbook"><div><span className="eyebrow">SOCIAL COMMERCE</span><h2>Shop the Look</h2><p>محتوى بصري يتحول إلى سلة شراء بدون احتكاك.</p><button onClick={() => notify('Lookbook mode جاهز للربط ببيانات المنتجات والفيديوهات')}>استكشف الـ Lookbook →</button></div><div className="look-cards"><div className="look one">NIGHT / 01</div><div className="look two">UTILITY / 02</div><div className="look three">MINIMAL / 03</div></div></section>
      {!consent && <div className="privacy-bar"><span>نستخدم أقل قدر ممكن من البيانات لتحسين التجربة. لا نبيع الهوية الشخصية.</span><button onClick={acceptConsent}>موافق</button><button onClick={() => notify('يمكنك تغيير التفضيلات لاحقاً من Consent Center')}>التفاصيل</button></div>}
    </> : <OSDashboard cart={cart} wish={wish} notify={notify} />}

    {compareOpen && <Overlay title="مقارنة سريعة" close={() => setCompareOpen(false)}><div className="compare-grid">{compareProducts.length ? compareProducts.map(p => <div key={p.id}><img src={p.image} alt=""/><b>{p.name}</b><span>{displayMoney(p.price)}</span><small>★ {p.rating} · {p.stock} متوفر</small><button onClick={() => { add(p); setCompareOpen(false); }}>أضف للسلة</button></div>) : <p>اختار منتجات للمقارنة.</p>}</div></Overlay>}
    {cartCount > 0 && <div className="cart-float" onClick={openCart} role="button" tabIndex={0}>🛒 <b>{cartCount}</b> <span>{money(cartTotal)}</span></div>}
    {voice && <div className="voice-overlay" onClick={() => setVoice(false)}><div className="voice-card" onClick={e => e.stopPropagation()}><div className="voice-ring">🎙</div><h3>Arabic Voice Commerce</h3><p>جرّب: «أنا عايز هودي أسود ثقيل مقاس لارج»</p><button onClick={() => { setQuery('hoodie'); setVoice(false); notify('تم تحويل الطلب الصوتي إلى بحث تجريبي'); }}>محاكاة البحث</button></div></div>}
    {modal && <ModalLayer modal={modal} product={selected} cart={cart} cartTotal={cartTotal} add={add} changeQty={changeQty} close={() => setModal(null)} notify={notify} consent={consent} setConsent={setConsent} compare={compare} setCompare={setCompare} checkout={checkout} checkoutBusy={checkoutBusy} products={products} setQuery={setQuery} setSort={setSort} deliveryMode={deliveryMode} setDeliveryMode={setDeliveryMode} />}
    {drawer && <div className="drawer-backdrop" onClick={() => setDrawer(null)}><aside className="side-drawer" onClick={e => e.stopPropagation()}><div className="drawer-head"><div><span className="eyebrow">TRUST</span><h2>{drawer === 'cart' ? 'سلة الشراء' : 'المفضلة'}</h2></div><button onClick={() => setDrawer(null)}>×</button></div>{drawer === 'cart' ? <div className="drawer-body">{cart.length ? cart.map(line => <div className="drawer-line" key={line.product.id}><img src={line.product.image} alt=""/><div><b>{line.product.name}</b><small>{displayMoney(line.product.price)} × {line.qty}</small><div><button onClick={() => changeQty(line.product.id,-1)}>−</button><button onClick={() => changeQty(line.product.id,1)}>＋</button></div></div></div>) : <div className="drawer-empty">السلة فاضية حاليًا.</div>}<div className="drawer-total"><div><span>الإجمالي الفرعي</span><small>الشحن يُعاد حسابه على السيرفر عند التأكيد</small></div><b>{displayMoney(cartTotal)}</b></div>{cartStockWarnings.length > 0 && <div className="drawer-warning" role="alert">⚠️ بعض الكميات أكبر من المخزون الحالي. هنراجعها قبل إنشاء الطلب.</div>}{!customerAuthed && <div className="guest-form"><input placeholder="الاسم الكامل" value={guest.name} onChange={e => setGuest({ ...guest, name: e.target.value })} /><input placeholder="رقم التليفون (01xxxxxxxxx)" value={guest.phone} onChange={e => setGuest({ ...guest, phone: e.target.value })} /><textarea placeholder="عنوان التوصيل بالتفصيل" value={guest.address} onChange={e => setGuest({ ...guest, address: e.target.value })} /><small>أو <a href="/customer-login?next=/">سجّل دخول</a> لو عندك حساب بالفعل</small></div>}<p className="cod-note">الدفع كاش عند الاستلام</p><button className="drawer-primary" disabled={checkoutBusy} onClick={checkout}>{checkoutBusy ? 'جاري التنفيذ...' : 'تأكيد الطلب (دفع عند الاستلام) →'}</button></div> : <div className="drawer-body">{wishlistProducts.length ? wishlistProducts.map(p => <button className="drawer-wish" key={p.id} onClick={() => openProduct(p)}><img src={p.image} alt=""/><span><b>{p.name}</b><small>{displayMoney(p.price)}</small></span><i>↗</i></button>) : <div className="drawer-empty">لم تحفظ أي منتج بعد.</div>}</div>}</aside></div>}
    <div className="toasts">{toasts.map(t => <div key={t.id}>{t.text}</div>)}</div>
    <nav className="mobile-nav"><button onClick={() => setMode('shop')}>⌂<span>المتجر</span></button><button onClick={() => { setSearchFocus(true); window.scrollTo({top:0,behavior:'smooth'}); }}>⌕<span>بحث</span></button><button onClick={openCart}>🛒<span>السلة {cartCount ? `(${cartCount})` : ''}</span></button><button onClick={openWishlist}>♡<span>المفضلة {wish.length ? `(${wish.length})` : ''}</span></button></nav><footer><div><b>TRUST</b><span>Marketplace Intelligence & Trust OS</span></div><div>Privacy-first · Approval gates · Auditability · Tenant isolation</div></footer>
  </div>;
}

function Feature({ n, title, text, action, onClick }: { n: string; title: string; text: string; action: string; onClick: () => void }) { return <div><span>{n}</span><h3>{title}</h3><p>{text}</p><button onClick={onClick}>{action} →</button></div>; }
function Tool({ title, text, onClick }: { title: string; text: string; onClick: () => void }) { return <button className="tool-card" onClick={onClick}><b>{title}</b><span>{text}</span><i>↗</i></button>; }

function ModalLayer({ modal, product, cart, cartTotal, add, changeQty, close, notify, consent, setConsent, compare, setCompare, checkout, checkoutBusy, products, setQuery, setSort, deliveryMode, setDeliveryMode }: { modal: Modal; product: Product | null; cart: CartLine[]; cartTotal: number; add: (p: Product) => void; changeQty: (id: string, delta: number) => void; close: () => void; notify: (x: string) => void; consent: boolean; setConsent: (x: boolean) => void; compare: string[]; setCompare: (x: string[]) => void; checkout: () => void; checkoutBusy: boolean; products: Product[]; setQuery: (x:string)=>void; setSort: (x:'featured'|'price-low'|'price-high'|'rating')=>void; deliveryMode: 'fast'|'balanced'|'eco'; setDeliveryMode: (x:'fast'|'balanced'|'eco')=>void }) {
  if (modal === 'product' && product) return <Overlay title={product.name} close={close}><div className="modal-product"><img src={product.image} alt={product.name}/><div><span className="eyebrow">{product.merchant} · VERIFIED</span><h3>{money(product.price)}</h3><p>تقييم {product.rating}/5 · مخزون {product.stock} · شحن من {product.region}</p><button className="primary" onClick={() => { add(product); close(); }}>أضف للسلة</button></div></div></Overlay>;
  if (modal === 'product') return <Overlay title="سلة TRUST" close={close}><div className="cart-lines">{cart.map(line => <div key={line.product.id}><b>{line.product.name}</b><span>{line.qty} × {money(line.product.price)}</span><div><button onClick={() => changeQty(line.product.id, -1)}>−</button><button onClick={() => changeQty(line.product.id, 1)}>＋</button></div></div>)}<strong>الإجمالي: {money(cartTotal)}</strong><button className="primary" disabled={checkoutBusy} onClick={checkout}>{checkoutBusy ? 'جاري التنفيذ...' : 'إتمام الدفع'}</button></div></Overlay>;
  if (modal === 'compare') { const picks = products.filter(p => compare.includes(p.id)); return <Overlay title="مقارنة المنتجات" close={close}><div className="compare-grid">{picks.length ? picks.map(p => <div key={p.id}><img src={p.image} alt=""/><b>{p.name}</b><span>{money(p.price)}</span><small>★ {p.rating} · {p.stock} متوفر</small><button onClick={() => { add(p); close(); }}>أضف للسلة</button></div>) : <p>اختار حتى 3 منتجات للمقارنة من بطاقات المنتجات.</p>}</div></Overlay>; }
  if (modal === 'fit') return <Overlay title="AI Fit Twin" close={close}><FitWizard notify={notify} close={close}/></Overlay>;
  if (modal === 'style') return <Overlay title="AI Stylist" close={close}><StyleWizard notify={notify} add={add} products={products}/></Overlay>;
  if (modal === 'shared') return <Overlay title="Shared Cart" close={close}><div className="wizard"><p>أنشئ كوداً تجريبياً لمشاركة السلة مع أصحابك.</p><div className="share-code">TRUST-{Math.floor(1000 + Math.random() * 9000)}</div><button className="primary" onClick={() => notify('تم نسخ كود السلة التجريبي')}>نسخ الكود</button></div></Overlay>;
  if (modal === 'concierge') return <Overlay title="TRUST Concierge" close={close}><div className="concierge-modal"><h3>قولّي إنت عايز إيه</h3><p>اختار هدفك، وأنا أرتّب لك المنتجات من الكتالوج الحالي.</p><div className="choice-row">{['أفضل قيمة','أعلى تقييم','أسرع شحن','ستايل Night'].map(x => <button key={x} onClick={() => { setQuery(x === 'ستايل Night' ? 'hoodie' : ''); if (x === 'أفضل قيمة') setSort('price-low'); if (x === 'أعلى تقييم') setSort('rating'); notify(`Concierge: تم تطبيق ${x}`); close(); }}>{x}</button>)}</div></div></Overlay>;
  if (modal === 'delivery') return <Overlay title="Delivery Promise" close={close}><div className="promise-card"><div className="delivery-modes"><button className={deliveryMode==='fast'?'chosen':''} onClick={() => setDeliveryMode('fast')}>⚡ الأسرع</button><button className={deliveryMode==='balanced'?'chosen':''} onClick={() => setDeliveryMode('balanced')}>◉ متوازن</button><button className={deliveryMode==='eco'?'chosen':''} onClick={() => setDeliveryMode('eco')}>♻ اقتصادي</button></div><div><b>{deliveryMode==='fast'?'42–90 دقيقة':deliveryMode==='eco'?'اليوم/غدًا':'60–120 دقيقة'}</b><span>تقدير تجريبي لأسرع Dispatch</span></div><div><b>اليوم</b><span>عند توفر المخزون المحلي</span></div><div><b>شفافية كاملة</b><span>موعد التسليم النهائي يظهر قبل الدفع الحقيقي</span></div><button className="primary" onClick={() => notify('تم اختيار أولوية الشحن — محاكاة فقط')}>اختيار الأسرع</button></div></Overlay>;
  if (modal === 'price-alert') return <Overlay title="Price Watch" close={close}><div className="wizard"><p>احفظ المنتج الحالي لمراقبة السعر.</p>{product ? <><h3>{product.name}</h3><strong>{money(product.price)}</strong><button className="primary" onClick={() => { notify('تم تشغيل Price Watch تجريبيًا لهذا المنتج'); close(); }}>فعّل المراقبة</button></> : <p>افتح أي منتج أولاً ثم فعّل Price Watch.</p>}</div></Overlay>;
  if (modal === 'trust') return <Overlay title="TRUST Score" close={close}><div className="trust-breakdown"><div><b>98.4</b><span>Trust Index</span></div><ul><li>✓ بائع موثوق</li><li>✓ تقييمات المنتج ظاهرة</li><li>✓ حالة المخزون معلنة</li><li>✓ Sponsored content مُفصح عنه</li><li>✓ أقل قدر من بيانات الجلسة</li></ul></div></Overlay>;
  if (modal === 'ad') return <Overlay title="Visitor Showcase" close={close}><div className="wizard"><span className="sponsored">SPONSORED · واضح للمستخدم</span><h3>اعرض مشروعك أمام جمهور مهتم</h3><p>نسخة تجريبية من سوق المساحات المصغرة. أي إعلان فعلي يحتاج سياسة موافقة، قياس، وفوترة حقيقية.</p>{!consent && <button className="primary" onClick={() => setConsent(true)}>السماح بالتخصيص</button>}<button onClick={() => notify('تم إرسال طلب الحجز التجريبي للمراجعة')}>احجز مساحة تجريبية</button></div></Overlay>;
  return <Overlay title="Trend Lab" close={close}><div className="wizard"><h3>توقع اتجاه الأسبوع</h3><p>اختار اتجاهاً. النقاط هنا تجريبية ولا تمثل جائزة مالية حقيقية.</p><div className="choice-row">{['Dark Tones', 'Oversized', 'Utility'].map(x => <button key={x} onClick={() => notify(`اختيارك: ${x} · +10 نقاط تجريبية`)}>{x}</button>)}</div></div></Overlay>;
}
function Overlay({ title, children, close }: { title: string; children?: React.ReactNode; close: () => void }) { return <div className="modal-backdrop" onClick={close}><section className="modal-card" onClick={e => e.stopPropagation()}><div className="modal-head"><h2>{title}</h2><button onClick={close} aria-label="إغلاق">×</button></div>{children}</section></div>; }
function FitWizard({ notify, close }: { notify: (x: string) => void; close: () => void }) { const [height, setHeight] = useState(''); const [weight, setWeight] = useState(''); const [fit, setFit] = useState('Regular'); const result = height && weight ? (Number(height) >= 185 ? (fit === 'Loose' ? 'XL' : 'L') : Number(weight) >= 90 ? (fit === 'Loose' ? 'XL' : 'L') : 'M') : ''; return <div className="wizard"><input placeholder="الطول بالسنتيمتر" value={height} onChange={e => setHeight(e.target.value)} inputMode="numeric"/><input placeholder="الوزن بالكيلو" value={weight} onChange={e => setWeight(e.target.value)} inputMode="numeric"/><div className="choice-row">{['Fitted', 'Regular', 'Loose'].map(x => <button className={fit === x ? 'chosen' : ''} key={x} onClick={() => setFit(x)}>{x}</button>)}</div>{result && <div className="fit-result">المقاس المبدئي: <b>{result}</b><small>توصية تقديرية — راجع جدول مقاسات المنتج.</small></div>}<button className="primary" onClick={() => { notify(result ? `Fit Twin: ${result}` : 'أدخل البيانات أولاً'); if (result) close(); }}>احسب المقاس</button></div>; }
function StyleWizard({ notify, add, products }: { notify: (x: string) => void; add: (p: Product) => void; products: Product[] }) { const [style, setStyle] = useState('Night'); const picks = products.filter(p => style === 'Night' ? p.tags.some(t => ['night', 'black', 'dark'].includes(t)) : p.tags.includes('utility')).slice(0, 3); return <div className="wizard"><div className="choice-row">{['Night', 'Utility'].map(x => <button className={style === x ? 'chosen' : ''} key={x} onClick={() => setStyle(x)}>{x}</button>)}</div><div className="style-picks">{picks.map(p => <button key={p.id} onClick={() => add(p)}><b>{p.name}</b><span>{money(p.price)}</span></button>)}</div><button onClick={() => notify(`AI Stylist جهّز ${picks.length} قطع لستايل ${style}`)}>احفظ الـ Look</button></div>; }

function OSDashboard({ cart, wish, notify }: { cart: CartLine[]; wish: string[]; notify: (x: string) => void }) { const cards = [['GMV Today', 'SIMULATION', '—'], ['Conversion', 'SIMULATION', '—'], ['Return Risk', 'SIMULATION', '—'], ['Inventory Health', 'SIMULATION', '—']]; return <main className="os"><div className="os-hero"><div><span className="eyebrow">TRUST OS · CONTROL PLANE · V129</span><h1>لوحة قيادة التجارة الذكية.</h1><p>محركات TRUST الحالية في مكان واحد، مع بوابات موافقة قبل الأفعال عالية التأثير.</p></div><button className="primary" onClick={() => notify('Autopilot بدأ Simulation فقط — لا توجد تغييرات إنتاجية')}>▶ Run Intelligence Simulation</button></div><div className="kpis" aria-label="Simulation metrics">{cards.map(c => <div className="kpi" key={c[0]}><span>{c[0]}</span><b>{c[1]}</b><small>{c[2]}</small></div>)}</div><div className="os-grid"><section className="console"><div className="console-head"><h2>Intelligence Feed</h2><span>LIVE</span></div><div className="feed"><div><i>AI</i><p><b>Restock Signal</b><br/>Heavy Oversized Hoodie قد ينفد خلال 3.2 أيام. تم تجهيز RFQ Draft لـ 4 موردين.</p><button onClick={() => notify('RFQ Draft محفوظ كمسودة — يحتاج اعتماد التاجر')}>Review</button></div><div><i>RISK</i><p><b>Fraud Shield</b><br/>تم رصد نمط طلبات عالي السرعة. القرار المقترح: تأكيد الدفع قبل الشحن.</p><button onClick={() => notify('Fraud Shield: policy check مكتمل')}>Inspect</button></div><div><i>GROW</i><p><b>Visitor Monetization</b><br/>زوار غير مشترين لديهم اهتمام مرتفع. Micro-reward + wishlist قد يرفع العودة.</p><button onClick={() => notify('Visitor campaign: Simulation فقط')}>Simulate</button></div></div></section><section className="module-list"><h2>TRUST Modules</h2>{modules.map(m => <a href={m[2]} key={m[0]}><div><b>{m[0]}</b><span>{m[1]}</span></div><span>→</span></a>)}</section></div><div className="os-bottom"><div><h3>Commerce Flywheel</h3><div className="fly"><span>Visitor</span><b>→</b><span>Discovery</span><b>→</b><span>Trust</span><b>→</b><span>Order</span><b>→</b><span>Retention</span></div></div><div><h3>Session</h3><p>Wishlist: {wish.length} · Cart: {cart.reduce((s, x) => s + x.qty, 0)} · Consent: <b>Governed</b></p></div></div></main>; }
