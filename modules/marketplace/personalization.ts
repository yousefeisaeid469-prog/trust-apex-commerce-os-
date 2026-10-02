import { query } from '../platform/db/postgres';

export { sessionDigest, personalizedScore, type PreferenceProfile } from './personalization-score';

export async function getPreferenceProfile(sessionKey?:string):Promise<PreferenceProfile>{
  if(!sessionKey)return {categories:{},priceCenter:null,viewedProducts:0};
  const digest=sessionDigest(sessionKey);
  const r=await query(`select category,category_count,price_sum,view_count from trust_marketplace_preference_profiles where session_hash=$1`,[digest]);
  if(!r.rows[0])return {categories:{},priceCenter:null,viewedProducts:0};
  const categories:Record<string,number>={};
  for(const row of r.rows) categories[String(row.category).toLowerCase()]=Number(row.category_count);
  const totals=r.rows.reduce((a,row)=>({views:a.views+Number(row.view_count),price:a.price+Number(row.price_sum)}),{views:0,price:0});
  return {categories,priceCenter:totals.views?totals.price/totals.views:null,viewedProducts:totals.views};
}

export async function recordProductView(sessionKey:string,input:{productId:string;category:string;price:number}){
  const digest=sessionDigest(sessionKey);
  const category=String(input.category).trim().toLowerCase().slice(0,120);
  if(!category)return;
  await query(`insert into trust_marketplace_preference_profiles(session_hash,category,category_count,price_sum,view_count,last_view_at) values($1,$2,1,$3,1,now()) on conflict(session_hash,category) do update set category_count=trust_marketplace_preference_profiles.category_count+1,price_sum=trust_marketplace_preference_profiles.price_sum+$3,view_count=trust_marketplace_preference_profiles.view_count+1,last_view_at=now()`,[digest,category,Math.max(0,Number(input.price)||0)]);
  await query(`insert into trust_marketplace_preference_events(session_hash,product_id,category,price,event_type) values($1,$2,$3,$4,'PRODUCT_VIEW')`,[digest,input.productId,category,Math.max(0,Number(input.price)||0)]).catch(()=>undefined);
}
