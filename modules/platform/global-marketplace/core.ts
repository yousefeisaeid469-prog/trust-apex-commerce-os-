import type {GlobalOffer,GlobalProduct,MarketplaceRegion,Money,TaxLine,FxQuote,ShippingQuote} from './contracts.ts';

export function translate(text:Record<string,string>|undefined,locale:string,fallbacks:string[]=['en','ar']):string {
  if(!text) return '';
  const keys=[locale,...locale.split('-')[0],...fallbacks];
  for(const k of keys){if(text[k]) return text[k];}
  return Object.values(text)[0] ?? '';
}

export function assertCurrency(code:string):string {
  const c=code.trim().toUpperCase();
  if(!/^[A-Z]{3}$/.test(c)) throw new Error('INVALID_CURRENCY_CODE');
  return c;
}

export function convertMoney(money:Money,quote:FxQuote):Money {
  const from=assertCurrency(money.currency),to=assertCurrency(quote.quote);
  if(from!==quote.base) throw new Error('FX_BASE_MISMATCH');
  if(!(quote.rate>0) || !Number.isFinite(quote.rate)) throw new Error('INVALID_FX_RATE');
  const amount=BigInt(Math.round(Number(money.amountMinor)*quote.rate));
  return {amountMinor:amount,currency:to};
}

export function computeTaxes(subtotal:Money, rules:Array<{jurisdiction:string;rate:number}>):TaxLine[] {
  if(!Number.isSafeInteger(Number(subtotal.amountMinor)) || subtotal.amountMinor<0n) throw new Error('INVALID_MONEY');
  return rules.map(r=>{if(r.rate<0 || r.rate>1) throw new Error('INVALID_TAX_RATE'); return {jurisdiction:r.jurisdiction,rate:r.rate,amountMinor:BigInt(Math.round(Number(subtotal.amountMinor)*r.rate))}});
}

export function buildOffer(product:GlobalProduct,region:MarketplaceRegion,shipping?:ShippingQuote,taxes:TaxLine[]=[]):GlobalOffer {
  if(!product.active || product.inventory<1) throw new Error('PRODUCT_UNAVAILABLE');
  if(product.regionAllowlist && !product.regionAllowlist.includes(region.country)) throw new Error('REGION_RESTRICTED');
  const item={amountMinor:product.priceMinor,currency:assertCurrency(product.currency)};
  const ship=shipping?.amount ?? {amountMinor:0n,currency:item.currency};
  if(ship.currency!==item.currency) throw new Error('SETTLEMENT_CURRENCY_MISMATCH');
  const taxTotal=taxes.reduce((a,t)=>a+t.amountMinor,0n);
  return {productId:product.id,sellerId:product.merchantId,item,shipping:ship,taxes,total:{amountMinor:item.amountMinor+ship.amountMinor+taxTotal,currency:item.currency},shippingQuote:shipping};
}
