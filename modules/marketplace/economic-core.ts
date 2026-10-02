import {calculateFee} from './fee-engine.ts';
export type PriceLayer={base:number;seller:number;dynamic:number;deal:number;coupon:number;voucher:number;quantity:number;membership:number;b2b:number;regional:number;tax:number;shipping:number};
export function calculateFinalPrice(p:PriceLayer){const gross=Math.max(0,p.base+p.seller+p.dynamic);const discounts=Math.max(0,p.deal)+Math.max(0,p.coupon)+Math.max(0,p.voucher)+Math.max(0,p.quantity)+Math.max(0,p.membership)+Math.max(0,p.b2b);const merchandise=Math.max(0,gross-discounts);return Number((merchandise+Math.max(0,p.regional)+Math.max(0,p.tax)+Math.max(0,p.shipping)).toFixed(2));}
export function marketplaceFee(gross:number,rateBps:number,min=0,max?:number){return calculateFee({baseAmount:gross,rateBps,minimumFee:min,maximumFee:max});}
