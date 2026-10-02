import { query, withPgTransaction } from '../db/postgres';
import type { OwnerControlId } from './contracts';

export type OwnerLiveControlState={
  maintenanceMode:boolean;
  globalFreeze:boolean;
  autonomyKillSwitch:boolean;
  version:number;
  updatedAt:string;
  actorEmail?:string;
  reason?:string;
};

const defaults:OwnerLiveControlState={maintenanceMode:false,globalFreeze:false,autonomyKillSwitch:false,version:0,updatedAt:new Date(0).toISOString()};

export async function getOwnerLiveControlState():Promise<OwnerLiveControlState>{
  const r=await query(`select maintenance_mode,global_freeze,autonomy_kill_switch,version,updated_at,actor_email,reason from trust_owner_live_control_state where singleton=true limit 1`);
  if(!r.rows[0]) return defaults;
  const x=r.rows[0];
  return {maintenanceMode:Boolean(x.maintenance_mode),globalFreeze:Boolean(x.global_freeze),autonomyKillSwitch:Boolean(x.autonomy_kill_switch),version:Number(x.version),updatedAt:new Date(x.updated_at).toISOString(),actorEmail:x.actor_email??undefined,reason:x.reason??undefined};
}

export function desiredLiveState(controlId:OwnerControlId,enabled:boolean,current:OwnerLiveControlState):OwnerLiveControlState{
  const next={...current,updatedAt:new Date().toISOString()};
  if(controlId==='MAINTENANCE_MODE') next.maintenanceMode=enabled;
  else if(controlId==='GLOBAL_FREEZE') next.globalFreeze=enabled;
  else if(controlId==='AUTONOMY_KILL_SWITCH') next.autonomyKillSwitch=enabled;
  else throw new Error('CONTROL_NOT_LIVE_TOGGLE');
  return next;
}

export async function setOwnerLiveControl(controlId:OwnerControlId,enabled:boolean,actorEmail:string,reason=''){
  return withPgTransaction(async client=>{
    const current=(await client.query(`select maintenance_mode,global_freeze,autonomy_kill_switch,version from trust_owner_live_control_state where singleton=true for update`)).rows[0];
    const state={maintenanceMode:Boolean(current?.maintenance_mode),globalFreeze:Boolean(current?.global_freeze),autonomyKillSwitch:Boolean(current?.autonomy_kill_switch),version:Number(current?.version??0),updatedAt:'',actorEmail,reason:reason.trim().slice(0,500)} as OwnerLiveControlState;
    const next=desiredLiveState(controlId,enabled,state); const version=state.version+1;
    await client.query(`update trust_owner_live_control_state set maintenance_mode=$1,global_freeze=$2,autonomy_kill_switch=$3,version=$4,updated_at=now(),actor_email=$5,reason=$6 where singleton=true`,[next.maintenanceMode,next.globalFreeze,next.autonomyKillSwitch,version,actorEmail,next.reason]);
    const row=(await client.query(`select maintenance_mode,global_freeze,autonomy_kill_switch,version,updated_at,actor_email,reason from trust_owner_live_control_state where singleton=true`)).rows[0];
    return {maintenanceMode:Boolean(row.maintenance_mode),globalFreeze:Boolean(row.global_freeze),autonomyKillSwitch:Boolean(row.autonomy_kill_switch),version:Number(row.version),updatedAt:new Date(row.updated_at).toISOString(),actorEmail:row.actor_email,reason:row.reason??undefined};
  });
}

export function isAutonomyBlocked(state:OwnerLiveControlState){return state.autonomyKillSwitch||state.globalFreeze;}
