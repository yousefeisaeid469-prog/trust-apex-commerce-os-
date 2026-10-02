import type { CartLine } from '../core/service';
import { getProduct } from '../repository/catalog';
import { query } from '../../platform/db/postgres';
import { quoteMarketplacePromotions } from '../../marketplace/promotions';
export type PricingAdjustment={code:string;label:string;amount:number};
export type PricingResult={subtotal:number;discount:number;shipping:number;total:number;currency:'EGP';adjustments:PricingAdjustment[]};
export async function priceCart(items:CartLine[], discountCode?:string, customerId?:string, shippingBase=60):Promise<PricingResult>{
 let normalized:CartLine[]=items.map(l=>({productId:String(l.productId),qty:Number(l.qty),...(l.offerId?{offerId:String(l.offerId)}:{})}));
 const promotion=await quoteMarketplacePromotions({lines:normalized.map(l=>({productId:l.productId,quantity:l.qty,offerId:l.offerId})),promotionCode:discountCode,customerId,shippingBase:items.length?Math.max(0,shippingBase):0});
 let subtotal=0;
 for(const line of promotion.effectiveLines) subtotal+=line.unitPrice*line.quantity;
 subtotal=Number(subtotal.toFixed(2));
 const shipping=subtotal===0?0:(subtotal-promotion.discount)>=1500?0:Math.max(0,shippingBase-promotion.adjustments.filter(a=>a.label==='SHIPPING COUPON').reduce((sum,a)=>sum+a.amount,0));
 return {subtotal,discount:promotion.discount,shipping,total:Math.max(0,Number((subtotal-promotion.discount+shipping).toFixed(2))),currency:'EGP',adjustments:promotion.adjustments.map(a=>({code:a.code,label:a.label,amount:a.amount}))};
}
