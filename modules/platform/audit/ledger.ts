import { createHash } from 'node:crypto';
import type { PoolClient } from 'pg';
import { withPgTransaction } from '../db/postgres';
const hash=(v:string)=>createHash('sha256').update(v).digest('hex');
export async function appendAuditEvent(input:{actorId?:string;action:string;resourceType:string;resourceId?:string;requestId?:string;payload:unknown;outbox?:{eventType:string;aggregateId:string;payload:unknown}}){
 return withPgTransaction(async(client:PoolClient)=>{
  await client.query(`select pg_advisory_xact_lock(hashtext('trust:audit-chain'))`);
  const previous=await client.query<{chain_hash:string}>(`select chain_hash from trust_audit_events order by id desc limit 1`);
  const previousHash=previous.rows[0]?.chain_hash??null; const payloadHash=hash(JSON.stringify(input.payload)); const chainHash=hash(`${previousHash??''}:${input.action}:${input.resourceType}:${input.resourceId??''}:${payloadHash}`);
  await client.query(`insert into trust_audit_events(actor_id,action,resource_type,resource_id,request_id,payload_hash,previous_hash,chain_hash) values($1,$2,$3,$4,$5,$6,$7,$8)`,[input.actorId??null,input.action,input.resourceType,input.resourceId??null,input.requestId??null,payloadHash,previousHash,chainHash]);
  if(input.outbox) await client.query(`insert into trust_outbox_events(event_type,aggregate_id,payload_json) values($1,$2,$3)`,[input.outbox.eventType,input.outbox.aggregateId,JSON.stringify(input.outbox.payload)]);
  return {chainHash,payloadHash,persisted:true,outboxPersisted:Boolean(input.outbox)};
 });
}
