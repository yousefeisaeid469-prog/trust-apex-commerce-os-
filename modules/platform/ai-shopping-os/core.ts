import type {ShoppingIntent,ShoppingRequest,ProductSignal,Recommendation,ComparisonRow,PriceInsight,ShoppingPlan,GuideSection} from './contracts.ts';

export function classifyIntent(query:string):ShoppingIntent {
  const q=query.toLowerCase();
  if(/compare|vs\.?|versus|مقارنة|احسن من/.test(q)) return 'COMPARE';
  if(/reorder|again|restock|إعادة|تاني/.test(q)) return 'REORDER';
  if(/deal|discount|sale|cheap|خصم|عرض|أرخص/.test(q)) return 'DEAL';
  if(/price|cost|سعر|بكام/.test(q)) return 'TRACK_PRICE';
  if(/guide|how to choose|دليل|اختار/.test(q)) return 'SHOPPING_GUIDE';
  if(/cart|buy|add|شراء|اشتري|عربة/.test(q)) return 'BUILD_CART';
  if(/research|review|does it|هل|مواصفات/.test(q)) return 'RESEARCH';
  return 'DISCOVER';
}

export function recommend(products:ProductSignal[], request:ShoppingRequest, opts:{preferredTags?:string[]; maxDeliveryDays?:number}={}):Recommendation[] {
  const tags=new Set(opts.preferredTags??[]);
  return products.filter(p=>p.stock>0&&p.currency===request.currency&&(!request.budgetMinor||p.priceMinor<=request.budgetMinor)&&(!opts.maxDeliveryDays||p.deliveryDays<=opts.maxDeliveryDays))
    .map(p=>{let score=0;const reasons:string[]=[]; score+=Math.min(35,p.rating/5*35); score+=Math.min(20,Math.log10(p.reviewCount+1)*7); score+=Math.min(20,p.sellerTrust/100*20); score+=Math.max(0,15-p.deliveryDays*3); const tagHits=p.tags.filter(t=>tags.has(t)).length; score+=Math.min(10,tagHits*3); if(p.rating>=4.5)reasons.push('high rating');if(p.sellerTrust>=90)reasons.push('trusted seller');if(p.deliveryDays<=2)reasons.push('fast delivery');if(tagHits)reasons.push('matches preferences');return {productId:p.productId,score,reasons};})
    .sort((a,b)=>b.score-a.score||a.productId.localeCompare(b.productId));
}

export function compareProducts(products:ProductSignal[], keys:string[]=['price','rating','reviews','delivery','sellerTrust']):ComparisonRow[]{
  const rows:ComparisonRow[]=[];
  for(const key of keys){const values:Record<string,string|number|bigint>={}; for(const p of products){values[p.productId]=key==='price'?p.priceMinor:key==='rating'?p.rating:key==='reviews'?p.reviewCount:key==='delivery'?p.deliveryDays:p.sellerTrust;} const numeric=products.map(p=>({id:p.productId,v:Number(values[p.productId])})).filter(x=>Number.isFinite(x.v)); const winnerId=key==='price'?numeric.sort((a,b)=>a.v-b.v)[0]?.id:numeric.sort((a,b)=>b.v-a.v)[0]?.id; rows.push({key,values,winnerId});}
  return rows;
}

export function priceInsight(history:bigint[], currentMinor:bigint):PriceInsight {
  if(!history.length)return {currentMinor,lowestMinor:currentMinor,highestMinor:currentMinor,percentile:50,verdict:'UNKNOWN'};
  const sorted=[...history].sort((a,b)=>a<b?-1:a>b?1:0); const lower=sorted.filter(x=>x<=currentMinor).length; const percentile=Math.round((Math.max(0,lower-1)/Math.max(1,sorted.length-1))*100); const low=sorted[0],high=sorted[sorted.length-1]; const verdict=percentile<=20?'LOW':percentile>=80?'HIGH':'TYPICAL'; return {currentMinor,lowestMinor:low,highestMinor:high,percentile,verdict};
}

export function buildShoppingPlan(request:ShoppingRequest):ShoppingPlan {
  const intent=request.intent??classifyIntent(request.query); const steps:ShoppingPlan['steps']=[]; const add=(action:ShoppingPlan['steps'][number]['action'],description:string,requiresApproval=false)=>steps.push({id:crypto.randomUUID(),action,description,requiresApproval});
  add('SEARCH',`Search the catalog for: ${request.query}`); if(intent==='COMPARE')add('COMPARE','Compare the strongest matching products side by side'); if(intent==='DEAL'){add('FILTER','Filter for active deals and budget fit');add('SET_ALERT','Offer a price alert when the target is not met');} if(intent==='REORDER')add('REORDER','Find the most recent eligible reorderable item'); if(intent==='SHOPPING_GUIDE')add('COMPARE','Build a decision guide from relevant attributes, reviews and total cost'); if(intent==='BUILD_CART')add('ADD_TO_CART','Prepare the selected items in the cart'); add('CHECKOUT','Present the final cart, shipping, tax and payment summary for confirmation',true); return {requestId:request.id,steps,approvalLevel:'CHECKOUT_CONFIRMATION'};
}

export function buildGuide(products:ProductSignal[], sections:{title:string;predicate:(p:ProductSignal)=>boolean}[]):GuideSection[]{return sections.map(s=>({title:s.title,bullets:products.filter(s.predicate).slice(0,5).map(p=>`${p.productId}: ${p.rating.toFixed(1)}/5, ${p.deliveryDays} day delivery`),productIds:products.filter(s.predicate).slice(0,5).map(p=>p.productId)})).filter(s=>s.productIds.length>0);}
