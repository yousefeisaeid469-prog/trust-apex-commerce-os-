export type CommerceEvent = {
  eventId:string; tenantId:string; type:string; occurredAt:string;
  actor:{type:string; id:string}; payload:Record<string,unknown>;
  traceId:string;
};
