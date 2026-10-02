import { createHash } from 'node:crypto';
export type PreferenceProfile = { categories: Record<string, number>; priceCenter: number | null; viewedProducts: number };
const clamp=(v:number,min=0,max=1)=>Math.max(min,Math.min(max,v));
export function sessionDigest(sessionKey:string){return createHash('sha256').update(sessionKey).digest('hex');}
export function personalizedScore(input:{base:number;category:string;price:number;profile:PreferenceProfile}){
 const categoryAffinity=clamp((input.profile.categories[input.category.toLowerCase()]??0)/8);
 const priceAffinity=input.profile.priceCenter && input.profile.priceCenter>0 ? clamp(1-Math.abs(input.price-input.profile.priceCenter)/Math.max(input.profile.priceCenter,1),0,1) : .5;
 const boost=input.profile.viewedProducts===0?0:categoryAffinity*.11+priceAffinity*.04;
 return Math.round((input.base+boost)*100000)/100000;
}
