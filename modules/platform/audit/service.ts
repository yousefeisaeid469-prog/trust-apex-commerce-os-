import { query, withPgTransaction } from '../db/postgres';

export type AuditEvent = { actorId?:string; tenantId?:string; action:string; resourceType:string; resourceId?:string; requestId?:string; traceId?:string; payload?:unknown };
export async function appendAuditEvent(event: AuditEvent) {
  const r = await query(`insert into trust_audit_events(actor_id,tenant_id,action,resource_type,resource_id,request_id,trace_id,payload_json) values($1,$2,$3,$4,$5,$6,$7,$8::jsonb) returning id,created_at`, [event.actorId??null,event.tenantId??null,event.action,event.resourceType,event.resourceId??null,event.requestId??null,event.traceId??null,JSON.stringify(event.payload??{})]);
  return { id:String(r.rows[0].id), createdAt:new Date(r.rows[0].created_at).toISOString() };
}
export async function listAuditEvents(limit=100) {
  const safe=Math.min(Math.max(Math.floor(limit),1),200);
  return (await query(`select id,actor_id,tenant_id,action,resource_type,resource_id,request_id,trace_id,payload_json,created_at from trust_audit_events order by created_at desc limit $1`,[safe])).rows;
}
export { withPgTransaction };
