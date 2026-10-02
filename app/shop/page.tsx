'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';

type Item={id:string;name:string;category:string;price:number;merchantName:string;rating:number;stock:number;image:string};
type Facet={category:string;count:number};

export default function ShopPage(){
  const [q,setQ]=useState(''); const [items,setItems]=useState<Item[]>([]); const [loading,setLoading]=useState(true);
  const [sort,setSort]=useState('relevance'); const [category,setCategory]=useState(''); const [tag,setTag]=useState('');
  const [minPrice,setMinPrice]=useState(''); const [maxPrice,setMaxPrice]=useState(''); const [minRating,setMinRating]=useState('');
  const [inStock,setInStock]=useState(false); const [facets,setFacets]=useState<Facet[]>([]); const [error,setError]=useState('');
  const [page,setPage]=useState(1); const [pages,setPages]=useState(1); const [total,setTotal]=useState(0);

  async function load(nextPage=1){
    setLoading(true); setError('');
    try{
      const qs=new URLSearchParams();
      if(q.trim()) qs.set('q',q.trim()); if(category) qs.set('category',category); if(tag.trim()) qs.set('tag',tag.trim());
      if(minPrice) qs.set('minPrice',minPrice); if(maxPrice) qs.set('maxPrice',maxPrice); if(minRating) qs.set('minRating',minRating);
      if(inStock) qs.set('inStock','true'); qs.set('sort',sort); qs.set('page',String(nextPage)); qs.set('limit','24');
      const r=await fetch('/api/marketplace/search?'+qs.toString(),{cache:'no-store'}); const d=await r.json();
      if(!d.ok) throw new Error(d.error||'SEARCH_FAILED');
      setItems(d.items??[]); setFacets((d.facets??[]).map((x:any)=>({category:String(x.category),count:Number(x.count)})));
      setPage(Number(d.page??nextPage)); setPages(Number(d.pages??1)); setTotal(Number(d.total??0));
      window.history.replaceState(null,'','/shop?'+qs.toString());
    }catch(e){setError(e instanceof Error?e.message:'تعذر تحميل المتجر');}finally{setLoading(false);}
  }

  useEffect(()=>{const p=new URLSearchParams(location.search);setQ(p.get('q')??'');setCategory(p.get('category')??'');setSort(p.get('sort')??'relevance');setPage(Number(p.get('page')??'1')||1);},[]);
  useEffect(()=>{load(page);},[sort,category,inStock]);

  const apply=()=>{setPage(1);load(1);};
  return <main style={{maxWidth:1280,margin:'0 auto',padding:'32px 20px',fontFamily:'system-ui'}}>
    <header style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:16,flexWrap:'wrap'}}><div><p style={{opacity:.55}}>TRUST Marketplace · V387</p><h1>اكتشف واشتري</h1><p style={{opacity:.7}}>بحث حقيقي من الكتالوج ونتائج قابلة للمشاركة.</p></div><Link href="/">الرئيسية</Link></header>
    <section style={{display:'flex',gap:10,margin:'28px 0',flexWrap:'wrap'}}><input value={q} onChange={e=>setQ(e.target.value)} onKeyDown={e=>{if(e.key==='Enter')apply();}} placeholder="ابحث عن منتج أو تصنيف أو متجر" style={{flex:1,minWidth:220,padding:14,borderRadius:12,border:'1px solid #ccc'}}/><button onClick={apply} style={{padding:'0 22px',borderRadius:12,border:0}}>بحث</button><select value={sort} onChange={e=>{setSort(e.target.value);setPage(1);}} style={{padding:12,borderRadius:12}}><option value="relevance">الأكثر صلة</option><option value="rating">الأعلى تقييمًا</option><option value="price_asc">الأقل سعرًا</option><option value="price_desc">الأعلى سعرًا</option><option value="newest">الأحدث</option></select></section>
    <section style={{display:'flex',gap:8,flexWrap:'wrap',alignItems:'center',marginBottom:24}}><input value={minPrice} onChange={e=>setMinPrice(e.target.value)} placeholder="أقل سعر" style={{padding:10,width:110}}/><input value={maxPrice} onChange={e=>setMaxPrice(e.target.value)} placeholder="أعلى سعر" style={{padding:10,width:110}}/><input value={minRating} onChange={e=>setMinRating(e.target.value)} placeholder="التقييم" style={{padding:10,width:110}}/><input value={tag} onChange={e=>setTag(e.target.value)} placeholder="وسم" style={{padding:10,width:110}}/><label><input type="checkbox" checked={inStock} onChange={e=>{setInStock(e.target.checked);setPage(1);}}/> متوفر فقط</label><button onClick={apply}>تطبيق</button></section>
    {facets.length>0&&<section style={{display:'flex',gap:8,flexWrap:'wrap',marginBottom:20}}><span>التصنيفات:</span>{facets.slice(0,12).map(f=><button key={f.category} onClick={()=>{setCategory(f.category);setPage(1);}}>{f.category} ({f.count})</button>)}{category&&<button onClick={()=>{setCategory('');setPage(1);}}>مسح</button>}</section>}
    {error&&<p role="alert">{error}</p>}<p style={{opacity:.6}}>{loading?'جاري التحميل…':`${total.toLocaleString()} نتيجة · صفحة ${page} من ${pages}`}</p>
    {loading ? <p>جارٍ تحميل المنتجات…</p> : (
      <section style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(230px,1fr))',gap:16}}>
        {items.map(p => (
          <Link key={p.id} href={`/product/${p.id}`} style={{color:'inherit',textDecoration:'none',border:'1px solid #e5e5e5',borderRadius:16,padding:14}}>
            <div style={{height:180,background:'#f4f4f4',borderRadius:12,overflow:'hidden'}}>
              <img src={p.image} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}}/>
            </div>
            <p style={{fontSize:12,opacity:.55}}>{p.category} · {p.merchantName}</p>
            <h2 style={{fontSize:18}}>{p.name}</h2>
            <strong>{Number(p.price).toFixed(2)} EGP</strong>
            <p>★ {Number(p.rating).toFixed(1)} · {p.stock>0 ? 'متاح' : 'غير متاح'}</p>
          </Link>
        ))}
      </section>
    )}
    {!loading&&pages>1&&<nav aria-label="صفحات المنتجات" style={{display:'flex',justifyContent:'center',gap:8,marginTop:28}}>{Array.from({length:Math.min(pages,10)},(_,i)=>i+1).map(n=><button key={n} onClick={()=>load(n)} aria-current={page===n?'page':undefined}>{n}</button>)}</nav>}
  </main>;
}
