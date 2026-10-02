export type AmazonRevenueSurface =
  | 'FIRST_PARTY_RETAIL' | 'THIRD_PARTY_SELLER_SERVICES' | 'ADVERTISING' | 'SUBSCRIPTIONS'
  | 'FULFILLMENT' | 'SELLER_SERVICES' | 'AFFILIATE' | 'B2B' | 'SUPPLY_CHAIN_SERVICES'
  | 'FINANCIAL_SERVICES' | 'DEVICES_AND_MEDIA' | 'OTHER_SERVICES';

export type AmazonCommerceCapability =
  | 'MARKETPLACE_COMMISSION' | 'SELLER_MEMBERSHIP' | 'SPONSORED_PRODUCTS' | 'SPONSORED_BRANDS'
  | 'SPONSORED_DISPLAY' | 'SUBSCRIBE_AND_SAVE' | 'PREMIUM_MEMBERSHIP' | 'FBA'
  | 'MULTICHANNEL_FULFILLMENT' | 'GLOBAL_FULFILLMENT' | 'SUPPLY_CHAIN' | 'B2B_PROCUREMENT'
  | 'BUSINESS_MEMBERSHIP' | 'GLOBAL_SELLING' | 'BRAND_SERVICES' | 'AFFILIATE_COMMERCE'
  | 'CUSTOMER_REWARDS' | 'PAYMENT_SERVICES' | 'LENDING_SERVICES' | 'DEVICES' | 'DIGITAL_CONTENT'
  | 'STREAMING' | 'FIRST_PARTY_RETAIL' | 'PRIVATE_LABEL' | 'DEALS_AND_COUPONS'
  | 'WISHLISTS_AND_PRICE_ALERTS' | 'REORDER' | 'REVIEWS_AND_QA' | 'CUSTOM_PRODUCTS' | 'RECOMMERCE';

export type RevenueProgram = { id:string; capability:AmazonCommerceCapability; surface:AmazonRevenueSurface; monetization:'FEE'|'CPC'|'CPM'|'SUBSCRIPTION'|'FULFILLMENT_FEE'|'SERVICE_FEE'|'COMMISSION'|'MARGIN'|'OTHER'; active:boolean; providerRequired:boolean; description:string };
export type RevenueEvent = { surface:AmazonRevenueSurface; programId:string; sourceId:string; amountMinor:bigint; currency:'EGP'; occurredAt:string; evidenceType?:'ORDER'|'AD_CLICK'|'AD_IMPRESSION'|'SUBSCRIPTION'|'FULFILLMENT'|'SERVICE'|'PROVIDER'|'LEDGER'; evidenceId?:string; idempotencyKey?:string };
export type RevenuePortfolio = { programs:RevenueProgram[]; surfaces:AmazonRevenueSurface[]; auditableEvents:number; totalMinor:bigint; bySurface:Record<AmazonRevenueSurface,bigint> };
export type RevenueMeter = { programId:string; baseMinor?:bigint; units?:number; rateBps?:number; fixedMinor?:bigint; capMinor?:bigint; floorMinor?:bigint };
export type RevenueCharge = RevenueEvent & { status:'QUOTED'|'POSTED'|'VOID'; calculation:string };
export type RevenueEngineSnapshot = { version:'V216.0.0'; quoted:number; posted:number; totalMinor:bigint; byProgram:Record<string,bigint> };
