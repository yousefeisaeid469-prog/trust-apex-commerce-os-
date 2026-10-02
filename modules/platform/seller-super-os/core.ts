import type {SellerSnapshot,SellerSuperBrief,SellerOpportunity,ListingAudit,RestockSignal} from './contracts.ts';

const norm=(v:string)=>v.trim().replace(/\s+/g,' ');
export function auditListing(p:SellerSnapshot['products'][number]):ListingAudit{
  const missing:string[]=[]; const strengths:string[]=[]; const name=norm(p.name);
  if(name.length<12)missing.push('عنوان أوضح'); else strengths.push('عنوان قابل للفهم');
  if(!p.category)missing.push('تصنيف'); else strengths.push('تصنيف موجود');
  if(!p.tags?.length)missing.push('وسوم بحث'); else strengths.push(`${p.tags.length} وسوم`);
  if(!p.image)missing.push('صورة المنتج'); else strengths.push('صورة موجودة');
  if(!(p.price>0))missing.push('سعر صالح'); else strengths.push('سعر صالح');
  const score=Math.max(0,Math.min(100,100-missing.length*18));
  return {productId:p.id,score,missing,strengths,titleSuggestion:name||'أضف عنوانًا واضحًا يصف المنتج والفائدة الرئيسية',descriptionPrompt:`اكتب وصفًا صادقًا لـ ${name||'المنتج'} اعتمادًا فقط على البيانات المتاحة، بدون اختراع مواصفات.`};
}
export function buildRestockSignals(products:SellerSnapshot['products']):RestockSignal[]{
  return products.filter(p=>p.stock<=10).map(p=>({productId:p.id,productName:p.name,stock:p.stock,urgency:p.stock===0?100:Math.min(100,Math.round((11-p.stock)*10)),action:p.stock===0?'استعادة المخزون فورًا':'مراجعة نقطة إعادة الطلب'})).sort((a,b)=>b.urgency-a.urgency||a.productId.localeCompare(b.productId)).slice(0,10);
}
export function buildSellerOpportunities(s:SellerSnapshot):SellerOpportunity[]{
  const p:SellerOpportunity[]=[]; const products=s.products, orders=s.orders;
  const low=products.filter(x=>x.stock>0&&x.stock<=10).length, out=products.filter(x=>x.stock===0).length;
  const processing=orders.filter(x=>x.status==='processing').length, shipped=orders.filter(x=>x.status==='shipped').length;
  const weak=products.map(auditListing).filter(x=>x.score<70).length;
  if(out)p.push({id:'RESTOCK',title:`استعادة ${out} منتج نافد`,priority:96,impact:'HIGH',reason:'المنتج النافد لا يستطيع تحويل الطلب إلى مبيعات.',action:'افتح مركز المخزون وحدد كمية إعادة الطلب.',monetizable:true,evidence:[`${out} out-of-stock`]});
  if(low)p.push({id:'LOW_STOCK',title:`حماية ${low} منتجات منخفضة المخزون`,priority:88,impact:'HIGH',reason:'انخفاض المخزون قد يسبب فقدان مبيعات أو تجربة غير مستقرة.',action:'راجع نقاط إعادة الطلب قبل إطلاق عروض.',monetizable:true,evidence:[`${low} low-stock`]});
  if(weak)p.push({id:'LISTING_QUALITY',title:`رفع جودة ${weak} صفحات منتج`,priority:82,impact:'HIGH',reason:'صفحات المنتج غير المكتملة تقلل وضوح القرار الشرائي.',action:'أكمل العنوان والتصنيف والوسوم والصور الناقصة.',monetizable:true,evidence:[`${weak} listings below 70/100`]});
  if(processing)p.push({id:'ORDER_FLOW',title:`تسريع ${processing} طلب قيد التجهيز`,priority:78,impact:'MEDIUM',reason:'تقليل زمن التجهيز يحسن تجربة العميل ويقلل التعثر.',action:'راجع طابور التجهيز والقدرة التشغيلية.',monetizable:false,evidence:[`${processing} processing orders`]});
  if(shipped)p.push({id:'DELIVERY',title:`متابعة ${shipped} شحنة`,priority:70,impact:'MEDIUM',reason:'المتابعة المبكرة تساعد على اكتشاف استثناءات التسليم.',action:'راقب tracking والاستثناءات من Fulfillment OS.',monetizable:false,evidence:[`${shipped} shipped orders`]});
  if(!s.verificationStatus||s.verificationStatus!=='verified')p.push({id:'TRUST',title:'إكمال توثيق التاجر',priority:74,impact:'MEDIUM',reason:'إشارات الثقة الواضحة تساعد العملاء والمنصة على تقييم البائع.',action:'أكمل متطلبات التحقق من حساب التاجر.',monetizable:true,evidence:[`verification=${s.verificationStatus??'unknown'}`]});
  p.push({id:'GROWTH',title:'اختبار نمو موجّه بدل خصم شامل',priority:62,impact:'LOW',reason:'اختبارات محددة أسهل في القياس وتحافظ على اقتصاديات العرض.',action:'اختر منتجًا مؤهلًا ثم اختبر Deal/Coupon أو Sponsored placement عبر policy gates.',monetizable:true,evidence:['always-on growth guardrail']});
  return p.sort((a,b)=>b.priority-a.priority||a.id.localeCompare(b.id)).slice(0,7);
}
export function buildSellerSuperBrief(s:SellerSnapshot):SellerSuperBrief{
  const catalog=s.products.length, inStock=s.products.filter(p=>p.stock>0).length;
  const availability=catalog?Math.round(inStock/catalog*100):0;
  const delivered=s.orders.filter(o=>o.status==='delivered').length;
  const fulfillment=s.orders.length?Math.round(delivered/s.orders.length*100):0;
  const lowStock=s.products.filter(p=>p.stock>0&&p.stock<=10).length, outOfStock=s.products.filter(p=>p.stock===0).length;
  const processing=s.orders.filter(o=>o.status==='processing').length, shipped=s.orders.filter(o=>o.status==='shipped').length;
  const revenue=s.orders.reduce((sum,o)=>sum+(Number.isFinite(o.total)?o.total:0),0), aov=s.orders.length?revenue/s.orders.length:0;
  const listingAudits=s.products.map(auditListing), listingScore=catalog?Math.round(listingAudits.reduce((x,a)=>x+a.score,0)/catalog):100;
  const healthScore=Math.round(availability*.35+fulfillment*.25+listingScore*.25+(s.verificationStatus==='verified'?100:60)*.15);
  return {healthScore,availability,fulfillment,catalog,stockUnits:s.products.reduce((x,p)=>x+p.stock,0),orders:s.orders.length,revenue,aov,lowStock,outOfStock,processing,shipped,opportunities:buildSellerOpportunities(s),restock:buildRestockSignals(s.products),listings:listingAudits.sort((a,b)=>a.score-b.score).slice(0,10)};
}
