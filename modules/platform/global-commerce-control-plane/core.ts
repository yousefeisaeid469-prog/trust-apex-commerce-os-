import { randomUUID } from 'node:crypto';
import { query } from '../db/postgres.ts';
import { runVerifiedOrderRecovery } from '../durable-events/reliability-recovery.ts';
import { appendOwnerAudit } from '../owner-control-room/core.ts';

export type ControlCommandId = 'OBSERVE_COMMERCE' | 'RECOVER_ORDER_LEASES';
export type CommandRisk = 'LOW' | 'HIGH' | 'CRITICAL';
export type ControlCommand = { id:ControlCommandId; title:string; risk:CommandRisk; requiresOwner:boolean; requiresApproval:boolean; description:string; mutationBoundary:string };

export const CONTROL_COMMANDS:ControlCommand[] = [
  { id:'OBSERVE_COMMERCE', title:'Observe Commerce', risk:'LOW', requiresOwner:false, requiresApproval:false, description:'Read the live cross-domain operational state.', mutationBoundary:'Read-only; never mutates commerce authorities.' },
  { id:'RECOVER_ORDER_LEASES', title:'Recover Order Leases', risk:'LOW', requiresOwner:true, requiresApproval:false, description:'Run the existing V373 verified order recovery for stale consumer/execution leases.', mutationBoundary:'Delegates only to V373 bounded stale-lease recovery; never writes payment, stock, fulfillment or revenue state directly.' },
];

const metric = async (table:string) => {
  const r = await query<any>(`select count(*)::int as count, coalesce(jsonb_object_agg(status,n order by status),'{}'::jsonb) statuses from (select status,count(*)::int n from ${table} group by status) s`);
  return { count:Number(r.rows[0]?.count||0), statuses:r.rows[0]?.statuses||{} };
};
const scalar = async (sql:string, params:any[]=[]) => (await query<any>(sql,params)).rows[0] ?? {};

export function commandById(id:string){ return CONTROL_COMMANDS.find(x=>x.id===id); }
export function requiresApproval(command:ControlCommand){ return command.requiresApproval || command.risk==='CRITICAL' || command.risk==='HIGH'; }

function classifyIncident(row:any){
  const staleConsumer=Number(row.stale_consumer||0), staleExecution=Number(row.stale_execution||0), failedPayments=Number(row.failed_payments||0);
  if(staleConsumer || staleExecution) return { code:'COMMERCE_WORK_STALLED', severity:'HIGH', title:'Commerce work is stalled', evidence:{staleConsumer,staleExecution,failedPayments} };
  if(failedPayments) return { code:'PAYMENT_FAILURE_CLUSTER', severity:'MEDIUM', title:'Recent payment failures detected', evidence:{staleConsumer,staleExecution,failedPayments} };
  return null;
}

export async function getGlobalCommerceControlPlaneOverview(){
  const [orders,payments,inventory,fulfillment,shipments,sellerOrders,revenue,events,deliveries,execution,stale,failed,recoveries] = await Promise.all([
    metric('trust_orders'),metric('trust_payments'),metric('trust_inventory_reservations'),metric('trust_marketplace_fulfillment_orders'),metric('trust_shipments'),metric('trust_seller_orders'),metric('trust_revenue_ledger'),metric('trust_commerce_events'),metric('trust_event_deliveries'),metric('trust_commerce_execution_jobs'),
    scalar(`select (select count(*) from trust_event_deliveries where status='PROCESSING' and locked_at < now()-interval '2 minutes')::int stale_consumer,(select count(*) from trust_commerce_execution_jobs where status='PROCESSING' and lease_until < now())::int stale_execution`),
    scalar(`select count(*)::int failed_payments from trust_payments where status in ('failed','FAILED','CANCELED','CANCELLED') and updated_at >= now()-interval '24 hours'`),
    scalar(`select count(*)::int count from trust_commerce_reliability_recovery_runs where created_at >= now()-interval '24 hours' and verified=true`),
  ]);
  const evidence={stale_consumer:Number(stale.stale_consumer||0),stale_execution:Number(stale.stale_execution||0),failed_payments:Number(failed.failed_payments||0)};
  const incident=classifyIncident(evidence);
  return {
    version:'V375.0.0', capturedAt:new Date().toISOString(),
    health: incident ? (incident.severity==='HIGH' ? 'DEGRADED' : 'ATTENTION') : 'HEALTHY',
    domains:{orders,payments,inventory,fulfillment,shipments,sellerOrders,revenue,events,deliveries,execution},
    incidentSummary:{active:incident?1:0, incidents:incident?[incident]:[]},
    staleWork:{consumerDeliveries:evidence.stale_consumer,executionJobs:evidence.stale_execution},
    commerce:{failedPayments24h:evidence.failed_payments,verifiedRecoveries24h:Number(recoveries.count||0)},
    commands:CONTROL_COMMANDS,
    authority:{businessSourceOfTruth:'existing domain authorities',controlPlaneRole:'cross-domain observation and bounded coordination',recoveryAuthority:'V373 verified order recovery',approvalBoundary:'HIGH/CRITICAL commands require approval and owner authorization',directBusinessMutation:false},
  };
}

export async function listGlobalCommerceIncidents(limit=50){
  const safe=Math.min(Math.max(Math.floor(limit),1),100);
  const rows=await query<any>(`select coalesce(e.payload->>'orderId',e.aggregate_id::text) as order_id,
      count(*) filter (where d.status='PROCESSING' and d.locked_at < now()-interval '2 minutes')::int stale_consumer,
      0::int stale_execution,
      0::int failed_payments
    from trust_event_deliveries d join trust_commerce_events e on e.tenant_id=d.tenant_id and e.event_id=d.event_id
    where d.status='PROCESSING' and d.locked_at < now()-interval '2 minutes'
    group by 1 order by stale_consumer desc limit $1`,[safe]);
  const execution=await query<any>(`select order_id,count(*)::int stale_execution from trust_commerce_execution_jobs where status='PROCESSING' and lease_until < now() group by order_id order by stale_execution desc limit $1`,[safe]);
  const byOrder=new Map<string,any>();
  for(const x of rows.rows){ if(x.order_id) byOrder.set(String(x.order_id),{orderId:String(x.order_id),staleConsumer:Number(x.stale_consumer),staleExecution:0}); }
  for(const x of execution.rows){ if(x.order_id){const id=String(x.order_id);const item=byOrder.get(id)||{orderId:id,staleConsumer:0,staleExecution:0};item.staleExecution=Number(x.stale_execution);byOrder.set(id,item);} }
  return [...byOrder.values()].map(x=>({id:`commerce:${x.orderId}`,severity:'HIGH',code:'COMMERCE_WORK_STALLED',orderId:x.orderId,evidence:x})).slice(0,safe);
}

export async function executeControlCommand(input:{commandId:ControlCommandId;orderId?:string;actorEmail?:string;reason?:string;requestId?:string}){
  const command=commandById(input.commandId); if(!command) throw new Error('UNKNOWN_CONTROL_COMMAND');
  const requestId=input.requestId||randomUUID();
  if(command.id==='OBSERVE_COMMERCE') return {status:'OBSERVED',requestId,command};
  if(command.id==='RECOVER_ORDER_LEASES'){
    if(!input.actorEmail) throw new Error('OWNER_AUTH_REQUIRED');
    if(!input.orderId) throw new Error('ORDER_ID_REQUIRED');
    const reason=(input.reason||'').trim(); if(reason.length<3) throw new Error('RECOVERY_REASON_REQUIRED');
    await query(`insert into trust_global_commerce_control_commands(command_id,request_id,actor_email,target_order_id,status,risk,reason) values($1,$2,$3,$4,'STARTED',$5,$6) on conflict(request_id) do nothing`,[command.id,requestId,input.actorEmail,input.orderId,command.risk,reason]);
    try{
      const result=await runVerifiedOrderRecovery(input.orderId,'v375-control-plane');
      const status=result.verified?'EXECUTED':'UNVERIFIED';
      await query(`update trust_global_commerce_control_commands set status=$1,result=$2::jsonb,completed_at=now() where request_id=$3`,[status,JSON.stringify({verified:result.verified,actions:result.actions}),requestId]);
      const audit=await appendOwnerAudit({actorEmail:input.actorEmail,action:'commerce.control.recover_order_leases',target:input.orderId,result:result.verified?'ACCEPTED':'FAILED',requestId,payload:{commandId:command.id,reason,verified:result.verified,actions:result.actions}}).catch(()=>null);
      return {status,requestId,command,result,audit};
    }catch(error){
      await query(`update trust_global_commerce_control_commands set status='FAILED',result=$1::jsonb,completed_at=now() where request_id=$2`,[JSON.stringify({error:error instanceof Error?error.message:'CONTROL_COMMAND_FAILED'}),requestId]).catch(()=>null);
      throw error;
    }
  }
  throw new Error('UNSUPPORTED_CONTROL_COMMAND');
}
