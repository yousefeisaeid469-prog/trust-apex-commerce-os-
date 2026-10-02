import { randomUUID } from 'node:crypto';
import { query } from '../db/postgres';
import { appendOwnerAudit } from './core';
import { getControlState, setControlMode, type ControlMode } from '../admin/control';
import { getOwnerLiveControlState, setOwnerLiveControl } from './live-control';

export type OwnerCommandAction = 'SET_SYSTEM_MODE'|'SET_LIVE_CONTROL';
export type OwnerTarget = 'NORMAL'|'SAFE'|'READONLY'|'EMERGENCY'|'MAINTENANCE_MODE'|'GLOBAL_FREEZE'|'AUTONOMY_KILL_SWITCH';
export const OWNER_COMMANDS = [
 {action:'SET_SYSTEM_MODE',targets:['NORMAL','SAFE','READONLY','EMERGENCY'],risk:'HIGH',requiresConfirmation:true},
 {action:'SET_LIVE_CONTROL',targets:['MAINTENANCE_MODE','GLOBAL_FREEZE','AUTONOMY_KILL_SWITCH'],risk:'CRITICAL',requiresConfirmation:true},
] as const;

async function persist(input:{commandId:string;actorEmail:string;action:string;target:string;risk:string;status:string;reason:string;payload:unknown;requestId:string;result?:unknown}){
 return query(`insert into trust_owner_control_commands(command_id,actor_email,action,target,risk,status,reason,payload,result,request_id,completed_at) values($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,case when $6 in ('ACCEPTED','REJECTED','FAILED') then now() end) on conflict(command_id) do update set status=excluded.status,reason=excluded.reason,payload=excluded.payload,result=excluded.result,completed_at=excluded.completed_at returning command_id,status,created_at,completed_at`,[input.commandId,input.actorEmail,input.action,input.target,input.risk,input.status,input.reason,input.payload??{},input.result??null,input.requestId]);
}

export async function getSuperControlSnapshot(){
 const [control,live,counts,audit,commands]=await Promise.all([
  getControlState(),getOwnerLiveControlState(),
  query(`select
   (select count(*) from trust_orders where created_at >= now()-interval '24 hours') as orders_24h,
   (select count(*) from trust_payments where created_at >= now()-interval '24 hours') as payments_24h,
   (select count(*) from trust_marketplace_offers) as offers,
   (select count(*) from trust_merchant_profiles) as merchants,
   (select count(*) from trust_marketplace_fulfillment_orders where status not in ('DELIVERED','CANCELLED')) as open_fulfillment,
   (select count(*) from trust_shipments where status not in ('DELIVERED','CANCELLED')) as open_shipments,
   (select count(*) from trust_returns where status not in ('completed','cancelled','CLOSED')) as open_returns,
   (select count(*) from trust_refunds where status in ('requested','processing')) as pending_refunds,
   (select count(*) from trust_marketplace_payout_requests where status in ('REQUESTED','PROCESSING','HELD')) as pending_payouts,
   (select count(*) from trust_commerce_execution_fabric_workflows where state in ('READY','PROCESSING','RETRYING','COMPENSATING')) as active_automation,
   (select count(*) from trust_commerce_incident_snapshots where captured_at >= now()-interval '24 hours') as incident_snapshots`),
  query(`select event_id,action,target,result,actor_email,created_at,event_hash from trust_owner_audit_events order by id desc limit 15`),
  query(`select command_id,action,target,risk,status,actor_email,reason,created_at,completed_at from trust_owner_control_commands order by id desc limit 15`)
 ]);
 const snapshot={generatedAt:new Date().toISOString(),control,live,counts:counts.rows[0],recentAudit:audit.rows,recentCommands:commands.rows,commandRegistry:OWNER_COMMANDS};
 await query(`insert into trust_owner_control_snapshots(snapshot_key,payload) values($1,$2) on conflict(snapshot_key) do update set payload=excluded.payload,captured_at=now()`,['global',snapshot]);
 return snapshot;
}

export async function executeOwnerCommand(input:{actorEmail:string;action:OwnerCommandAction;target:OwnerTarget;enabled?:boolean;reason:string;requestId:string}){
 const def=OWNER_COMMANDS.find(x=>x.action===input.action);
 if(!def || !(def.targets as readonly string[]).includes(input.target)) throw new Error('OWNER_COMMAND_NOT_ALLOWED');
 if(input.reason.trim().length<8) throw new Error('OWNER_REASON_REQUIRED');
 const commandId=randomUUID();
 await persist({commandId,...input,risk:def.risk,status:'REQUESTED',payload:{enabled:input.enabled??null}});
 try{
  let result:any;
  if(input.action==='SET_SYSTEM_MODE'){
   const mode=input.target.toLowerCase() as ControlMode;
   result=await setControlMode(mode,input.actorEmail,input.reason);
  } else {
   const enabled=Boolean(input.enabled);
   result=await setOwnerLiveControl(input.target as any,enabled,input.actorEmail,input.reason);
  }
  await persist({commandId,...input,risk:def.risk,status:'ACCEPTED',reason:input.reason,payload:{enabled:input.enabled??null},result});
  await appendOwnerAudit({actorEmail:input.actorEmail,action:'owner.super_control.execute',target:input.target,result:'ACCEPTED',requestId:input.requestId,payload:{commandId,action:input.action,enabled:input.enabled??null,reason:input.reason}});
  return {commandId,status:'ACCEPTED',result};
 }catch(error){
  const message=error instanceof Error?error.message:'OWNER_COMMAND_FAILED';
  await persist({commandId,...input,risk:def.risk,status:'FAILED',reason:input.reason,payload:{enabled:input.enabled??null},result:{error:message}});
  await appendOwnerAudit({actorEmail:input.actorEmail,action:'owner.super_control.execute',target:input.target,result:'FAILED',requestId:input.requestId,payload:{commandId,error:message}}).catch(()=>null);
  throw error;
 }
}
