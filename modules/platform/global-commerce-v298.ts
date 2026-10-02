import type { RationalFxQuote, ShippingMode } from './global-commerce-v297/contracts.ts';
import { quoteGlobalCart, type GlobalQuote } from './global-commerce-v297/engine.ts';
import { money, convertRational } from './global-commerce-v297/money.ts';
import { getCapability, assertLocale, assertSettlementCurrency } from './global-commerce-v297/registry.ts';
import { planMarketplaceCheckout, type MarketplaceCheckoutPlan } from '../marketplace/checkout-planner';
import { withPgTransaction, query } from './db/postgres';
import { createHash } from 'node:crypto';

export type GlobalCheckoutLine = { productId:string; quantity:number; offerId?:string };
export type GlobalCheckoutRequest = {
  lines: GlobalCheckoutLine[];
  destinationCountry:string;
  locale:string;
  settlementCurrency:string;
  shippingMode?:ShippingMode;
  fx?:RationalFxQuote;
  customerId?:string;
};
export type GlobalCheckoutPricingLine = {
  productId:string; offerId?:string; quantity:number;
  sourceUnitPriceMinor:bigint; sourceCurrency:'EGP';
  unitPriceMinor:bigint; currency:string; sellerId:string;
};
export type GlobalCheckoutQuote = GlobalQuote & {
  quoteId:string;
  expiresAt:string;
  items:GlobalCheckoutPricingLine[];
  fulfillmentPlan:MarketplaceCheckoutPlan;
  pricingVersion:'V298.0.0';
};

const hashInput=(input:GlobalCheckoutRequest)=>createHash('sha256').update(JSON.stringify({
  ...input,
  fx:input.fx?{...input.fx,numerator:input.fx.numerator.toString(),denominator:input.fx.denominator.toString()}:null,
})).digest('hex');

export { minorToMajor } from './global-money-v298';

export async function createGlobalCheckoutQuote(input:GlobalCheckoutRequest, ttlMs=10*60_000):Promise<GlobalCheckoutQuote>{
  if(!Number.isInteger(ttlMs)||ttlMs<1_000||ttlMs>30*60_000) throw new Error('INVALID_QUOTE_TTL');
  if(!Array.isArray(input.lines)||!input.lines.length) throw new Error('EMPTY_CART');
  const capability=getCapability(input.destinationCountry);
  const locale=assertLocale(input.locale,capability.country);
  const settlementCurrency=assertSettlementCurrency(input.settlementCurrency,capability.country);
  const plan=await planMarketplaceCheckout(input.lines.map(x=>({productId:String(x.productId),qty:Number(x.quantity),offerId:x.offerId})),capability.country);
  const globalLines=plan.items.map(item=>({
    productId:item.productId,
    sellerId:item.sellerId,
    quantity:item.qty,
    unitPrice: convertSourcePrice(item.unitPrice,settlementCurrency,input.fx),
    categoryId:'',
  }));
  const quote=quoteGlobalCart({destinationCountry:capability.country,locale,settlementCurrency,lines:globalLines,shippingMode:input.shippingMode,fx:input.fx});
  const items=plan.items.map(item=>({
    productId:item.productId, offerId:item.offerId, quantity:item.qty,
    sourceUnitPriceMinor:BigInt(Math.round(item.unitPrice*100)), sourceCurrency:'EGP' as const,
    unitPriceMinor:convertSourcePrice(item.unitPrice,settlementCurrency,input.fx).amountMinor,
    currency:settlementCurrency,sellerId:item.sellerId,
  }));
  const expiresAt=new Date(Date.now()+ttlMs).toISOString();
  const requestHash=hashInput(input);
  return withPgTransaction(async client=>{
    const existing=await client.query<{id:string;expires_at:string;global_pricing_json:any;items_json:any}>('select id,expires_at,global_pricing_json,items_json from trust_checkout_quotes where request_hash=$1 and consumed_at is null and expires_at>now() limit 1',[requestHash]);
    if(existing.rows[0]) return {...(existing.rows[0].global_pricing_json as GlobalQuote),quoteId:String(existing.rows[0].id),expiresAt:new Date(existing.rows[0].expires_at).toISOString(),items:existing.rows[0].items_json as GlobalCheckoutPricingLine[],fulfillmentPlan:plan,pricingVersion:'V298.0.0'};
    const inserted=await client.query<{id:string}>(`insert into trust_checkout_quotes(request_hash,items_json,pricing_json,currency,expires_at,destination_country,locale,settlement_currency,shipping_mode,fx_quote_json,tax_snapshot_json,global_pricing_json,pricing_version)
      values($1,$2::jsonb,$3::jsonb,$4,$5,$6,$7,$8,$9,$10::jsonb,$11::jsonb,$12::jsonb,'V298.0.0') returning id`,[
      requestHash,JSON.stringify(items,(_,v)=>typeof v==='bigint'?v.toString():v),JSON.stringify({...quote,fulfillmentPlan:plan},(_,v)=>typeof v==='bigint'?v.toString():v),settlementCurrency,expiresAt,capability.country,locale,settlementCurrency,input.shippingMode??capability.shipping[0],input.fx?JSON.stringify(input.fx,(_,v)=>typeof v==='bigint'?v.toString():v):null,JSON.stringify(quote.taxes,(_,v)=>typeof v==='bigint'?v.toString():v),JSON.stringify(quote,(_,v)=>typeof v==='bigint'?v.toString():v)
    ]);
    return {...quote,quoteId:String(inserted.rows[0].id),expiresAt,items,fulfillmentPlan:plan,pricingVersion:'V298.0.0'};
  });
}

function convertSourcePrice(unitPriceEgp:number,target:string,fx?:RationalFxQuote){
  const source=money(BigInt(Math.round(unitPriceEgp*100)),'EGP');
  if(target==='EGP') return source;
  if(!fx) throw new Error('FX_QUOTE_REQUIRED');
  return convertRational(source,fx);
}

export async function getGlobalCheckoutQuote(quoteId:string):Promise<GlobalCheckoutQuote|undefined>{
  const r=await query<any>('select * from trust_checkout_quotes where id=$1 and consumed_at is null and expires_at>now() and pricing_version=\'V298.0.0\'',[quoteId]);
  const row=r.rows[0]; if(!row) return undefined;
  const pricing=row.global_pricing_json as GlobalQuote;
  return {...pricing,quoteId,expiresAt:new Date(row.expires_at).toISOString(),items:row.items_json as GlobalCheckoutPricingLine[],fulfillmentPlan:JSON.parse(JSON.stringify((row.pricing_json as any).fulfillmentPlan??{})),pricingVersion:'V298.0.0'} as GlobalCheckoutQuote;
}
