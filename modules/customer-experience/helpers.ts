import { randomUUID } from 'node:crypto';
import { query, withPgTransaction } from '../platform/db/postgres';
import type { PoolClient } from 'pg';
import type { TimelineKind } from './contracts';

export function normalizeText(value: unknown, max=500): string {
  return String(value ?? '').trim().replace(/[\u0000-\u001f]/g,'').slice(0,max);
}
export function normalizeOptionalText(value: unknown, max=500): string|null {
  const text=normalizeText(value,max); return text || null;
}
export function normalizeCountry(value: unknown): string { return normalizeText(value,2).toUpperCase(); }
export function normalizeLocale(value: unknown): string { return normalizeText(value,20).replace(/[^A-Za-z0-9_-]/g,'') || 'en'; }
export function normalizeTimezone(value: unknown): string { return normalizeText(value,80) || 'UTC'; }
export function positiveInt(value: unknown, fallback=1, max=1000): number { const n=Number(value); return Number.isFinite(n)?Math.min(Math.max(Math.floor(n),1),max):fallback; }
export function rating(value: unknown): number { const n=Number(value); if(!Number.isInteger(n)||n<1||n>5) throw new Error('INVALID_RATING'); return n; }
export function assertNonEmpty(value: unknown, code:string): string { const text=normalizeText(value); if(!text) throw new Error(code); return text; }
export function safeId(value: unknown, code='ID_REQUIRED'): string { const id=normalizeText(value,100); if(!/^[A-Za-z0-9_-]+$/.test(id)) throw new Error(code); return id; }
export function utcNow(): string { return new Date().toISOString(); }
export function stableHash(input:string): string { let h=2166136261; for(let i=0;i<input.length;i++){h^=input.charCodeAt(i);h=Math.imul(h,16777619);} return (h>>>0).toString(16).padStart(8,'0'); }

export async function appendTimeline(input:{customerId:string;kind:TimelineKind;entityType:string;entityId:string;action:string;summary:string;metadata?:Record<string,unknown>}, client?:PoolClient) {
  const args=[randomUUID(),input.customerId,input.kind,input.entityType,input.entityId,input.action,input.summary,JSON.stringify(input.metadata??{})];
  const sql=`insert into trust_customer_timeline(id,customer_id,kind,entity_type,entity_id,action,summary,metadata,occurred_at) values($1,$2,$3,$4,$5,$6,$7,$8::jsonb,now()) on conflict(customer_id,entity_type,entity_id,action) do nothing returning id`;
  return client ? client.query(sql,args) : query(sql,args);
}
export async function appendAuditTrail(input:{customerId:string;action:string;entityType:string;entityId:string;metadata?:Record<string,unknown>}, client?:PoolClient) {
  const args=[randomUUID(),input.customerId,input.action,input.entityType,input.entityId,JSON.stringify(input.metadata??{})];
  const sql=`insert into trust_customer_activity(id,customer_id,action,entity_type,entity_id,metadata,created_at) values($1,$2,$3,$4,$5,$6::jsonb,now()) returning id`;
  return client ? client.query(sql,args) : query(sql,args);
}
export async function transaction<T>(work:(client:PoolClient)=>Promise<T>):Promise<T>{ return withPgTransaction(work); }
export function parseJsonObject(value:unknown):Record<string,unknown>{ if(!value||typeof value!=='object'||Array.isArray(value)) return {}; return value as Record<string,unknown>; }
export function redactAddress(address:Record<string,unknown>){ return {...address, phone:address.phone?'[REDACTED]':null}; }
export function normalizeEmail(value:unknown){ const e=normalizeText(value,320).toLowerCase(); if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) throw new Error('INVALID_EMAIL'); return e; }
export function pagination(limitRaw:unknown, cursorRaw:unknown){ return {limit:positiveInt(limitRaw,50,100),cursor:normalizeOptionalText(cursorRaw,200)}; }
