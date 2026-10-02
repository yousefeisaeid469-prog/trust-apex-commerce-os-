export type EventStatus='APPENDED'|'PROCESSED'|'DUPLICATE'|'DEAD_LETTERED'|'REPLAYED';
export interface CommerceEvent<T=Record<string,unknown>>{eventId:string;tenantId:string;type:string;aggregateId:string;sequence:number;occurredAt:number;payload:T;correlationId?:string;causationId?:string;}
export interface EventEnvelope extends CommerceEvent{attempts:number;status:EventStatus;}
export interface EventPolicy{maxAttempts:number;maxPayloadBytes:number;strictOrdering:boolean;}
export interface EventHandlerResult{status:'SUCCESS'|'RETRY'|'DROP';reason?:string;effectKey?:string;}
export type EventHandler=(event:EventEnvelope)=>Promise<EventHandlerResult>|EventHandlerResult;
export interface Subscription{consumerId:string;eventTypes:string[];handler:EventHandler;}
export interface EventDelivery{eventId:string;tenantId:string;consumerId:string;status:'PROCESSED'|'DUPLICATE'|'RETRY'|'DEAD_LETTERED'|'SKIPPED';attempts:number;reason?:string;}
export interface DeadLetterEvent{event:EventEnvelope;consumerId:string;reason:string;createdAt:number;}
export interface ReplayResult{requested:number;replayed:number;skipped:number;}
