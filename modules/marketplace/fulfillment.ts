import { query } from '../platform/db/postgres';
import type { FulfillmentOption } from './fulfillment-ranking';

const num=(v:unknown,d=0)=>Number.isFinite(Number(v))?Number(v):d;

export function rankFulfillment(options:FulfillmentOption[], qty=1){
  return options.filter(x=>x.availableUnits>=qty).map(x=>({...x,score:Math.max(0,1-Math.min(1,x.maxDays/30))*.45+Math.max(0,1-Math.min(1,(x.shippingCost+x.fulfillmentCost)/500))*.25+Math.max(0,1-Math.min(1,x.minDays/14))*.20+Math.min(1,x.availableUnits/Math.max(qty,1))*.10})).sort((a,b)=>b.score-a.score||a.maxDays-b.maxDays||(a.shippingCost+a.fulfillmentCost)-(b.shippingCost+b.fulfillmentCost)||a.locationId.localeCompare(b.locationId));
}

export async function getFulfillmentOptions(offerId:string,destinationRegion:string,qty=1){
 const r=await query(`select p.offer_id,p.location_id,l.region,p.min_days,p.max_days,p.shipping_cost,p.fulfillment_cost,coalesce(i.available_units,0) available_units from trust_fulfillment_promises p join trust_fulfillment_locations l on l.id=p.location_id left join trust_fulfillment_inventory i on i.location_id=p.location_id and i.offer_id=p.offer_id where p.offer_id=$1 and p.destination_region=$2 and l.active=true`,[offerId,destinationRegion]);
 return rankFulfillment(r.rows.map((x:any)=>({offerId:String(x.offer_id),locationId:String(x.location_id),region:String(x.region),minDays:num(x.min_days),maxDays:num(x.max_days),shippingCost:num(x.shipping_cost),fulfillmentCost:num(x.fulfillment_cost),availableUnits:num(x.available_units),score:0})),qty);
}

export async function resolveDelivery(offerId:string,destinationRegion:string,qty=1){
 const options=await getFulfillmentOptions(offerId,destinationRegion,qty); return options[0]??undefined;
}
