import type {RankedOffer,SellerOffer,Variant,Reservation} from './contracts.ts';

export function rankOffers(offers:SellerOffer[], opts:{currency?:string; maxHandlingDays?:number}={}) : RankedOffer[] {
  return offers.filter(o=>o.active!==false && o.stock>0 && (!opts.currency || o.currency===opts.currency))
    .map(o=>{let score=100; const reasons:string[]=[];
      score += Math.max(0, 30 - Math.min(30,o.priceMinor>0n?Math.log10(Number(o.priceMinor))*3:0));
      score += Math.min(20,o.rating*4); score += Math.max(0,18-o.handlingDays*3); score += Math.max(0,16-o.deliveryDays*2);
      if(o.condition==='NEW'){score+=8; reasons.push('new condition');} if(o.rating>=4.5){reasons.push('trusted seller');} if(o.deliveryDays<=2){reasons.push('fast delivery');} if(o.stock>=10){reasons.push('in stock');}
      if(opts.maxHandlingDays!==undefined && o.handlingDays>opts.maxHandlingDays) score-=25;
      return {...o,score,reasons};
    }).sort((a,b)=>b.score-a.score||a.priceMinor<b.priceMinor?-1:a.priceMinor>b.priceMinor?1:0);
}

export function selectBestOffer(offers:SellerOffer[], opts:{currency?:string;maxHandlingDays?:number}={}){ return rankOffers(offers,opts)[0] ?? null; }

export function selectVariant(variants:Variant[], attributes:Record<string,string>){
  return variants.find(v=>v.active!==false && v.stock>0 && Object.entries(attributes).every(([k,val])=>v.attributes[k]===val)) ?? null;
}

export function reserveInventory(available:number, quantity:number, ttlSeconds=900, now=new Date()):Reservation {
  if(!Number.isInteger(quantity)||quantity<1) throw new Error('INVALID_QUANTITY');
  if(!Number.isInteger(available)||available<quantity) throw new Error('INSUFFICIENT_INVENTORY');
  if(!Number.isInteger(ttlSeconds)||ttlSeconds<30||ttlSeconds>86400) throw new Error('INVALID_RESERVATION_TTL');
  return {id:crypto.randomUUID(),offerId:'PENDING',quantity,expiresAt:new Date(now.getTime()+ttlSeconds*1000).toISOString()};
}

export function isReservationActive(reservation:Reservation, now=new Date()){return new Date(reservation.expiresAt).getTime()>now.getTime();}
