import { query } from '../platform/db/postgres';
import { resolveBuyBox, type Offer } from './offers';

export type MissionInput = { missionText?: string; category?: string; budget?: number; region?: string };
export type BundleRecommendation = {
  productId:string; name:string; category:string; image:string; offer?:Offer;
  unitPrice:number; score:number; reason:string[];
};

const n=(v:unknown,d=0)=>Number.isFinite(Number(v))?Number(v):d;
const clean=(v:unknown,max=180)=>String(v??'').trim().slice(0,max);
const clamp=(v:number,min=0,max=1)=>Math.max(min,Math.min(max,v));

function tokenize(text:string){return [...new Set(clean(text,500).toLowerCase().split(/[^\p{L}\p{N}]+/u).filter(x=>x.length>=2).slice(0,32))];}

function compatibility(seed:{category:string;tags:string[]}, candidate:{category:string;tags:string[];price:number}, budget:number|null){
  const seedTags=new Set(seed.tags.map(x=>x.toLowerCase()));
  const shared=candidate.tags.filter(x=>seedTags.has(x.toLowerCase())).length;
  const distinctCategory=candidate.category.toLowerCase()!==seed.category.toLowerCase()?1:0;
  const budgetFit=budget===null?0.6:clamp(1-candidate.price/Math.max(budget,1));
  return shared*.22+distinctCategory*.34+budgetFit*.24+clamp(candidate.tags.length/8)*.10;
}

async function bestOffer(productId:string){
  const r=await query(`select catalog_item_id from trust_marketplace_offers where product_id=$1 and status='ACTIVE' order by stock desc limit 1`,[productId]);
  if(!r.rows[0])return undefined;
  return (await resolveBuyBox(String(r.rows[0].catalog_item_id))).offer;
}

export async function recommendSmartBundle(input:{productId:string;budget?:number;region?:string;limit?:number}):Promise<{seed:any;items:BundleRecommendation[];total:number;remainingBudget:number|null;mode:string}>{
  const seedRow=await query(`select id,name,category,tags,price,image,rating,stock from trust_products where id=$1 and active=true limit 1`,[input.productId]);
  if(!seedRow.rows[0])throw new Error('PRODUCT_NOT_FOUND');
  const seed=seedRow.rows[0];
  const budget=input.budget!==undefined&&Number.isFinite(input.budget)?Math.max(0,input.budget):null;
  const limit=Math.min(8,Math.max(1,Math.floor(input.limit??5)));
  const rows=await query(`select id,name,category,tags,price,image,rating,stock from trust_products where active=true and stock>0 and id<>$1 and category<>$2 order by rating desc,stock desc,created_at desc limit 120`,[input.productId,seed.category]);
  const candidates=rows.rows.map((r:any)=>({id:String(r.id),name:String(r.name),category:String(r.category),tags:Array.isArray(r.tags)?r.tags.map(String):[],price:n(r.price),image:String(r.image??''),rating:n(r.rating),stock:n(r.stock)}));
  const ranked=candidates.map(c=>({c,score:compatibility({category:String(seed.category),tags:Array.isArray(seed.tags)?seed.tags.map(String):[]},c,budget)})).sort((a,b)=>b.score-a.score||b.c.rating-a.c.rating||a.c.id.localeCompare(b.c.id));
  const picked:BundleRecommendation[]=[];let running=0;
  for(const entry of ranked){
    if(picked.length>=limit)break;
    const offer=await bestOffer(entry.c.id);
    const price=offer?.price??entry.c.price;
    if(budget!==null && running+price>budget)continue;
    const reason:string[]=[];
    if(entry.c.category.toLowerCase()!==String(seed.category).toLowerCase())reason.push('فئة مختلفة تكمل المنتج الأساسي');
    const shared=entry.c.tags.filter((x:string)=>(Array.isArray(seed.tags)?seed.tags:[]).map(String).some((s:string)=>s.toLowerCase()===x.toLowerCase()));
    if(shared.length)reason.push(`وسوم مشتركة: ${shared.slice(0,3).join('، ')}`);
    if(offer?.stock && offer.stock>0)reason.push('عرض متاح حاليًا');
    picked.push({productId:entry.c.id,name:entry.c.name,category:entry.c.category,image:entry.c.image,offer,unitPrice:price,score:Math.round(entry.score*10000)/10000,reason});
    running+=price;
  }
  const seedPrice=await bestOffer(String(seed.id));
  const seedCost=seedPrice?.price??n(seed.price);
  const total=Math.round((running+seedCost)*100)/100;
  return {seed:{id:String(seed.id),name:String(seed.name),category:String(seed.category),price:seedCost},items:picked,total,remainingBudget:budget===null?null:Math.max(0,Math.round((budget-total)*100)/100),mode:'EXPLAINABLE_COMPLEMENTARY_BUNDLE'};
}

export async function createShoppingMission(sessionKey:string,input:MissionInput){
  const text=clean(input.missionText,500);
  const category=clean(input.category,120)||null;
  const budget=input.budget!==undefined&&Number.isFinite(input.budget)?Math.max(0,input.budget):null;
  const region=clean(input.region,80)||'GLOBAL';
  if(!text && !category)throw new Error('MISSION_SCOPE_REQUIRED');
  const r=await query(`insert into trust_marketplace_shopping_missions(session_hash,mission_text,category,budget,region) values(encode(digest($1,'sha256'),'hex'),$2,$3,$4,$5) returning id,mission_text,category,budget,region,status,created_at`,[sessionKey,text,category,budget,region]);
  return r.rows[0];
}

export async function recommendForMission(missionId:string,sessionKey:string,limit=8){
  const m=await query(`select id,mission_text,category,budget,region from trust_marketplace_shopping_missions where id=$1 and session_hash=encode(digest($2,'sha256'),'hex') and status='ACTIVE' limit 1`,[missionId,sessionKey]);
  if(!m.rows[0])throw new Error('MISSION_NOT_FOUND');
  const mission=m.rows[0];
  const tokens=tokenize(`${mission.mission_text??''} ${mission.category??''}`);
  const budget=mission.budget===null?null:n(mission.budget);
  const rows=await query(`select id,name,category,tags,price,image,rating,stock from trust_products where active=true and stock>0 and ($1::text is null or lower(category)=lower($1)) order by rating desc,stock desc,created_at desc limit 160`,[mission.category||null]);
  const scored=rows.rows.map((r:any)=>{const tags=Array.isArray(r.tags)?r.tags.map(String):[];const hay=[String(r.name),String(r.category),...tags].join(' ').toLowerCase();const hits=tokens.filter(t=>hay.includes(t)).length;const price=n(r.price);const budgetScore=budget===null?.5:clamp(1-price/Math.max(budget,1));return {r,score:Math.min(1,hits*.16)+n(r.rating)/5*.22+(n(r.stock)>0?0.12:0)+budgetScore*.18};}).sort((a,b)=>b.score-a.score||String(a.r.id).localeCompare(String(b.r.id))).slice(0,Math.min(12,Math.max(1,limit)));
  const out=[];
  for(const x of scored){const offer=await bestOffer(String(x.r.id));const price=offer?.price??n(x.r.price);out.push({productId:String(x.r.id),name:String(x.r.name),category:String(x.r.category),image:String(x.r.image??''),unitPrice:price,offerId:offer?.id??null,score:Math.round(x.score*10000)/10000,reason:'مطابقة مباشرة للمهمة مع التوفر والسعر والتقييم'});}
  await query(`delete from trust_marketplace_mission_recommendations where mission_id=$1`,[missionId]);
  for(const item of out) await query(`insert into trust_marketplace_mission_recommendations(mission_id,product_id,offer_id,score,reason_json) values($1,$2,$3,$4,$5::jsonb)`,[missionId,item.productId,item.offerId,item.score,JSON.stringify({reason:item.reason})]);
  return {mission,recommendations:out};
}
