export type RegionCode = string;
export type CountryCode = string;
export type FulfillmentMode = 'STANDARD'|'EXPRESS'|'PICKUP';
export interface LocalizedText { [locale:string]: string }
export interface GlobalProduct { id:string; merchantId:string; title:LocalizedText; description?:LocalizedText; categoryId:string; sku:string; priceMinor:bigint; currency:string; inventory:number; active:boolean; regionAllowlist?:CountryCode[]; }
export interface Money { amountMinor:bigint; currency:string; }
export interface FxQuote { base:string; quote:string; rate:number; asOf:string; provider:string; expiresAt:string }
export interface TaxLine { jurisdiction:string; rate:number; amountMinor:bigint }
export interface ShippingQuote { carrier:string; service:string; amount:Money; etaDays:number; mode:FulfillmentMode }
export interface GlobalOffer { productId:string; sellerId:string; item:Money; shipping:Money; taxes:TaxLine[]; total:Money; shippingQuote?:ShippingQuote; fx?:FxQuote }
export interface MarketplaceRegion { country:CountryCode; defaultCurrency:string; defaultLocale:string; supportedCurrencies:string[]; supportedFulfillment:FulfillmentMode[]; }
