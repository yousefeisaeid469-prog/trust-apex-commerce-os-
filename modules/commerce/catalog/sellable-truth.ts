import { query } from '../../platform/db/postgres';

export type SellableStatus = 'PRODUCT_INACTIVE'|'CATALOG_UNAVAILABLE'|'NO_ACTIVE_OFFER'|'OUT_OF_STOCK'|'STOCK_TRUTH_CONFLICT'|'SELLABLE';
export type SellableCatalogTruth = {
  productId:string; merchantId:string; catalogItemId?:string; catalogKey?:string; name:string; category:string;
  productPrice:number; productStock:number; activeOfferCount:number; availableOfferCount:number;
  lowestOfferPrice?:number; activeOfferStock:number; activeVariantCount:number; activeVariantStock:number; sellableStatus:SellableStatus;
};
function mapRow(r:any):SellableCatalogTruth{return {
  productId:String(r.product_id), merchantId:String(r.merchant_id), catalogItemId:r.catalog_item_id?String(r.catalog_item_id):undefined,
  catalogKey:r.catalog_key?String(r.catalog_key):undefined, name:String(r.name), category:String(r.category),
  productPrice:Number(r.product_price), productStock:Number(r.product_stock), activeOfferCount:Number(r.active_offer_count),
  availableOfferCount:Number(r.available_offer_count), lowestOfferPrice:r.lowest_offer_price==null?undefined:Number(r.lowest_offer_price),
  activeOfferStock:Number(r.active_offer_stock), activeVariantCount:Number(r.active_variant_count), activeVariantStock:Number(r.active_variant_stock),
  sellableStatus:String(r.sellable_status) as SellableStatus,
};}
export async function getSellableCatalogTruth(productId:string){const r=await query(`select * from trust_sellable_catalog_truth where product_id=$1 limit 1`,[productId]);return r.rows[0]?mapRow(r.rows[0]):null;}
export async function listSellableCatalogConflicts(limit=100){const safe=Math.min(500,Math.max(1,Math.floor(limit)));const r=await query(`select * from trust_sellable_catalog_truth where sellable_status <> 'SELLABLE' order by product_id asc limit $1`,[safe]);return r.rows.map(mapRow);}
export const LIVE_POSTGRES_SELLABLE_CATALOG_AUTHORITY=true;
