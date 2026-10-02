import { randomUUID } from 'node:crypto';
export type RequestContext={requestId:string;traceId:string;startedAt:number;actorId?:string;tenantId?:string;ip?:string;userAgent?:string};
export function createRequestContext(input:Partial<Omit<RequestContext,'requestId'|'traceId'|'startedAt'>>={}):RequestContext{return{requestId:randomUUID(),traceId:randomUUID(),startedAt:Date.now(),...input};}
export function contextHeaders(ctx:RequestContext){return{'x-request-id':ctx.requestId,'x-trace-id':ctx.traceId};}
