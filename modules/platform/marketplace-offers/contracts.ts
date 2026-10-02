export type Variant = { id:string; sku:string; attributes:Record<string,string>; priceMinor:bigint; currency:string; stock:number; active?:boolean };
export type SellerOffer = { id:string; productId:string; sellerId:string; variantId?:string; priceMinor:bigint; currency:string; stock:number; rating:number; handlingDays:number; deliveryDays:number; condition:'NEW'|'USED'|'REFURBISHED'; active?:boolean };
export type RankedOffer = SellerOffer & { score:number; reasons:string[] };
export type Reservation = { id:string; offerId:string; quantity:number; expiresAt:string };
