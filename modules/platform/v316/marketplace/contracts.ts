export type MarketplaceStage = 'TENANT'|'SELLER'|'CATALOG'|'INVENTORY'|'ORDER'|'PAYMENT'|'FULFILLMENT'|'FINANCE'|'ANALYTICS';
export type StageStatus = 'PENDING'|'READY'|'BLOCKED'|'COMPLETED';
export type Money = { amountMinor: bigint; currency: string };
export type MarketplaceCommand = {
  tenantId:string; sellerId:string; productId:string; offerId:string; customerId:string; quantity:number;
  unitPriceMinor:bigint; shippingMinor:bigint; currency:string; commissionBps:number; idempotencyKey:string;
};
export type MarketplaceStep = { stage:MarketplaceStage; status:StageStatus; reason?:string; reference?:string };
export type MarketplaceRun = {
  workflowId:string; status:'READY'|'BLOCKED'|'COMPLETED'; steps:MarketplaceStep[];
  subtotal:Money; shipping:Money; commission:Money; sellerNet:Money; total:Money;
  fingerprint:string;
};
