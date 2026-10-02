export type IntegrationEvent = { type:string; aggregateId:string; payload:unknown };
export type PaymentGateway = {
  readonly name:string;
  authorize(input:{tenantId:string;amountMinor:number;currency:string;idempotencyKey:string}):Promise<{providerReference:string;status:'authorized'|'declined'}>;
  capture(input:{providerReference:string;amountMinor:number;idempotencyKey:string}):Promise<{status:'captured'|'failed'}>;
  refund(input:{providerReference:string;amountMinor:number;idempotencyKey:string}):Promise<{status:'refunded'|'failed'}>;
};
export type FulfillmentGateway = {
  readonly name:string;
  createShipment(input:{tenantId:string;orderId:string;idempotencyKey:string}):Promise<{providerReference:string;status:'created'|'failed'}>;
};
export type OutboxPublisher = { publish(event:IntegrationEvent):Promise<void> };
export type ProductionIntegration = { payment:PaymentGateway; fulfillment:FulfillmentGateway; outbox:OutboxPublisher };
