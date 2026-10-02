import type {IntelligenceProduct,MarketplaceContext,MarketplaceInsight,MarketplaceIntelligenceSnapshot,RankedOffer} from './contracts.ts';

const norm=(v:string)=>v.normalize('NFKC').toLowerCase().replace(/[\u064B-\u065F\u0670\u06D6-\u06ED]/g,'').replace(/[إأآٱ]/g,'ا').replace(/ى/g,'ي').replace(/ة/g,'ه').replace(/ؤ/g,'و').replace(/ئ/g,'ي').replace(/[^\p{L}\p{N}]+/gu,' ').trim();
const tokens=(v:string)=>norm(v).split(/\s+/).filter(Boolean);
const clamp=(n:number,min=0,max=100)=>Math.max(min,Math.min(max,Math.round(n)));
function distance(a:string,b:string){if(a===b)return 0;if(!a)return b.length;if(!b)return a.length;const row=Array.from({length:b.length+1},(_,i)=>i);for(let i=1;i<=a.length;i++){let prev=row[0];row[0]=i;for(let j=1;j<=b.length;j++){const old=row[j];row[j]=Math.min(row[j]+1,row[j-1]+1,prev+(a[i-1]===b[j-1]?0:1));prev=old}}return row[b.length]}
function tokenMatch(q:string,t:string){if(q===t)return 1;if(t.startsWith(q)||q.startsWith(t))return .82;const m=Math.max(q.length,t.length);return distance(q,t)<=(m>=7?2:1)?.58:0}
function relevance(p:IntelligenceProduct,q:string){if(!q)return 0;const qs=tokens(q);const fields=[...tokens(p.name),...tokens(p.category),...p.tags.flatMap(tokens),...tokens(p.merchant)];if(!qs.length)return 0;let total=0;for(const qt of qs){let best=0;for(const t of fields)best=Math.max(best,tokenMatch(qt,t));total+=best}return total/qs.length}
function matches(p:IntelligenceProduct,c:MarketplaceContext){if(c.category&&norm(p.category)!==norm(c.category))return false;if(c.region&&norm(p.region)!==norm(c.region))return false;if(c.maxPrice!==undefined&&p.price>c.maxPrice)return false;if(c.minRating!==undefined&&p.rating<c.minRating)return false;if(c.inStock&&p.stock<=0)return false;return true}
function rankOne(p:IntelligenceProduct,c:MarketplaceContext):RankedOffer{
 const rel=relevance(p,c.q||''); const preferred=new Set((c.preferredTags||[]).map(norm)); const tagHits=p.tags.filter(t=>preferred.has(norm(t))).length;
 const trust=clamp(p.rating/5*100); const availability=p.stock>0?clamp(Math.min(100,45+Math.log10(p.stock+1)*28)):0;
 const discount=p.oldPrice&&p.oldPrice>p.price?clamp((1-p.price/p.oldPrice)*100):0;
 const budget=c.maxPrice===undefined?100:clamp(100-Math.max(0,p.price-c.maxPrice)/Math.max(c.maxPrice,1)*100);
 const preference=preferred.size?clamp(tagHits/preferred.size*100):50;
 const score=clamp(rel*44+trust*.20+availability*.12+discount*.08+budget*.08+preference*.08);
 const reasons:string[]=[];if(rel>=.75)reasons.push('مطابقة قوية للبحث');else if(rel>0)reasons.push('مطابقة جزئية للبحث');if(p.rating>=4.5)reasons.push('تقييم قوي');if(p.stock>0)reasons.push('متاح حاليًا');if(discount>=10)reasons.push('خصم معلن');if(tagHits)reasons.push('وسوم مناسبة لتفضيلاتك');if(!reasons.length)reasons.push('ترشيح من الكتالوج الحالي');
 return {...p,score,match:clamp(rel*100),value:clamp((discount*.6)+(budget*.4)),trust,availability,reasons:reasons.slice(0,4)};
}
export function rankMarketplaceIntelligence(products:IntelligenceProduct[],context:MarketplaceContext={}):RankedOffer[]{
 const ranked=products.filter(p=>matches(p,context)).map(p=>rankOne(p,context)).sort((a,b)=>b.score-a.score||b.trust-a.trust||a.price-b.price||a.id.localeCompare(b.id));
 const merchantCounts=new Map<string,number>(); const out:RankedOffer[]=[];
 for(const item of ranked){const count=merchantCounts.get(item.merchant)||0;const adjusted=item.score-Math.min(18,count*7);out.push({...item,score:adjusted});merchantCounts.set(item.merchant,count+1)}
 return out.sort((a,b)=>b.score-a.score||b.trust-a.trust||a.price-b.price||a.id.localeCompare(b.id));
}
function insights(products:IntelligenceProduct[],offers:RankedOffer[]):MarketplaceInsight[]{
 const out:MarketplaceInsight[]=[]; const outOfStock=products.filter(p=>p.stock<=0).length; const discounted=products.filter(p=>p.oldPrice&&p.oldPrice>p.price).length; const weakTrust=products.filter(p=>p.rating<4).length; const merchants=new Set(products.map(p=>p.merchant)).size;
 if(outOfStock)out.push({id:'AVAILABILITY',priority:90,title:`حماية ${outOfStock} عرضًا غير متاح`,reason:'الترتيب لا ينبغي أن يحول عدم التوفر إلى تجربة شراء مضللة.',evidence:[`${outOfStock} offers out of stock`],action:'راجع المخزون أو استبعد العرض حتى يعود متاحًا.',monetizable:true,guardrail:'لا تُنشئ مخزونًا وهميًا ولا تعد بموعد تسليم غير مؤكد.'});
 if(discounted)out.push({id:'DEAL_DISCOVERY',priority:78,title:`استكشف ${discounted} عرضًا بسعر مخفّض`,reason:'السعر المخفض المعلن يمكن أن يدعم صفحات deals أو مقارنة القيمة.',evidence:[`${discounted} active price reductions`],action:'اختبر إبراز العروض المؤهلة مع توضيح السعر السابق والحالي.',monetizable:true,guardrail:'لا تعرض خصمًا إلا إذا كان السعر السابق موثقًا.'});
 if(weakTrust)out.push({id:'TRUST_SIGNAL',priority:72,title:`راجع ${weakTrust} عرضًا بإشارة تقييم منخفضة`,reason:'الجودة والثقة جزء من قرار الترتيب، وليست مجرد وسيلة لرفع التحويل.',evidence:[`${weakTrust} offers below 4/5`],action:'حسّن جودة المنتج/الخدمة أو اجمع تقييمات حقيقية وفق السياسة.',monetizable:false,guardrail:'لا تشتري تقييمات ولا تغيّر الترتيب لإخفاء تقييمات حقيقية.'});
 if(merchants>1)out.push({id:'MERCHANT_DIVERSITY',priority:66,title:'حافظ على تنوع التجار في النتائج',reason:'التنوع يقلل هيمنة تاجر واحد عندما تكون العروض متقاربة.',evidence:[`${merchants} merchants represented`],action:'استخدم تنويع النتائج بعد حساب الصلة والجودة.',monetizable:true,guardrail:'لا تُخفض عرضًا بسبب هوية التاجر وحدها ولا تمنح تاجرًا أولوية مدفوعة دون إفصاح.'});
 if(offers.length)out.push({id:'MONETIZATION_READY',priority:60,title:'افصل التوصية عن الترويج المدفوع',reason:'أفضل النتائج العضوية يجب أن تبقى قابلة للتفسير حتى عند وجود sponsored inventory.',evidence:[`${offers.length} ranked offers`],action:'أضف sponsored slots كطبقة منفصلة مع disclosure وfrequency caps.',monetizable:true,guardrail:'الدفع لا يغيّر الإشارة العضوية سرًا؛ الإعلان يظل معلنًا.'});
 return out.sort((a,b)=>b.priority-a.priority||a.id.localeCompare(b.id)).slice(0,6);
}
export function buildMarketplaceIntelligence(products:IntelligenceProduct[],context:MarketplaceContext={}):MarketplaceIntelligenceSnapshot{
 const offers=rankMarketplaceIntelligence(products,context);const q=norm(context.q||'');const mode=context.category?'category':q?'search':'discovery';
 return {version:'V206',total:offers.length,query:q,mode,offers:offers.slice(0,24),categories:[...new Set(products.map(p=>p.category))].sort(),regions:[...new Set(products.map(p=>p.region))].sort(),insights:insights(products,offers)};
}
