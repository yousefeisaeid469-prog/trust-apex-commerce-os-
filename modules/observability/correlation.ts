import { randomUUID } from 'node:crypto';
export function correlationId(input?:string){const id=(input||'').trim();return /^[A-Za-z0-9._:-]{8,128}$/.test(id)?id:randomUUID()}
export function withCorrelation(headers:Headers, id?:string){const value=correlationId(id);const out=new Headers(headers);out.set('x-request-id',value);return {id:value,headers:out}}
