export type V317Stage = 'TENANT'|'SELLER'|'CATALOG'|'INVENTORY'|'ORDER'|'PAYMENT'|'FULFILLMENT'|'FINANCE'|'ANALYTICS';
export type V317Status = 'READY'|'RUNNING'|'BLOCKED'|'COMPLETED'|'FAILED';
export type MarketplaceExecutionCommand = {
  tenantId:string; sellerId:string; productId:string; offerId:string; customerId:string;
  quantity:number; unitPriceMinor:bigint; shippingMinor:bigint; currency:string;
  commissionBps:number; idempotencyKey:string; destinationRegion?:string;
};
export type MarketplaceExecutionResult = {
  executionId:string; workflowId:string; status:'COMPLETED'; orderId:string; paymentId:string;
  reservationId:string; shipmentId:string; fulfillmentOrderId:string; settlementId:string;
  subtotalMinor:bigint; shippingMinor:bigint; totalMinor:bigint; commissionMinor:bigint;
  fulfillmentFeeMinor:bigint; sellerNetMinor:bigint; currency:string; providerReference:string;
  stages:Record<V317Stage,'COMPLETED'>; replaySafe:true;
};
