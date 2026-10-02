export type ProviderEventStatus='RECEIVED'|'PROCESSED'|'DUPLICATE'|'REJECTED';
export type ProviderEvent={provider:string;eventId:string;type:string;occurredAt:string;reference:string;status:string;payload:Record<string,unknown>};
export type ReconciliationResult={provider:string;eventId:string;status:ProviderEventStatus;actionId?:string;reason:string};
export interface ProviderWebhookVerifier{verify(rawBody:string,signature:string,secret:string,timestamp?:string,maxSkewSeconds?:number):boolean;}
export type ReconciliationJobStatus='PENDING'|'PROCESSING'|'DONE'|'FAILED';
export type ReconciliationJob={id:string;provider:string;eventId:string;attempts:number;status:ReconciliationJobStatus;availableAt:string};
