import {createHash} from 'node:crypto';
import {query} from '../db/postgres.ts';
import type {RevenueCharge} from './contracts.ts';

export function revenueEventId(tenantId:string,idempotencyKey:string){return createHash('sha256').update(`${tenantId}:${idempotencyKey}`).digest('hex');}
export async function persistRevenueCharge(input:{tenantId:string;charge:RevenueCharge;status?:RevenueCharge['status']}){
 const status=input.status??input.charge.status; const eventId=revenueEventId(input.tenantId,input.charge.idempotencyKey??`${input.charge.sourceId}:${input.charge.occurredAt}`);
 const r=await query(`insert into trust_revenue_ledger(event_id,tenant_id,program_id,surface,source_id,amount_minor,currency,status,evidence_type,evidence_id,idempotency_key,occurred_at) values($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) on conflict(event_id) do update set status=excluded.status,evidence_type=excluded.evidence_type,evidence_id=excluded.evidence_id,updated_at=now() returning *`,[eventId,input.tenantId,input.charge.programId,input.charge.surface,input.charge.sourceId,input.charge.amountMinor.toString(),input.charge.currency,status,input.charge.evidenceType??null,input.charge.evidenceId??null,input.charge.idempotencyKey??eventId,input.charge.occurredAt]);
 return r.rows[0];
}
export async function listRevenueLedger(tenantId:string,limit=50){const safe=Math.min(Math.max(Math.floor(limit),1),100);return (await query(`select event_id,tenant_id,program_id,surface,source_id,amount_minor,currency,status,evidence_type,evidence_id,idempotency_key,occurred_at,created_at,updated_at from trust_revenue_ledger where tenant_id=$1 order by occurred_at desc limit $2`,[tenantId,safe])).rows;}
