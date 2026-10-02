import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/modules/platform/auth/current-user';
import { query } from '@/modules/platform/db/postgres';
const privileged=['admin','support','operations'];
export const dynamic='force-dynamic'; export const runtime='nodejs';
export async function GET(req:NextRequest){
 const u=await getCurrentUser(req);if(!u)return NextResponse.json({ok:false,error:'AUTH_REQUIRED',surfaceStatus:'ERROR'},{status:401});
 if(!privileged.includes(u.role))return NextResponse.json({ok:false,error:'PRIVILEGED_ACCESS_REQUIRED',surfaceStatus:'ERROR'},{status:403});
 try{
  const [status,providers,exceptions,backlog,late]=await Promise.all([
   query(`select status,count(*)::int as count from trust_shipments group by status order by status`),
   query(`select carrier,count(*)::int as shipments,count(*) filter(where tracking_number is not null)::int as tracked,count(*) filter(where status='EXCEPTION')::int as exceptions,max(updated_at) as last_update from trust_shipments group by carrier order by shipments desc`),
   query(`select exception_code,count(*)::int as count,max(occurred_at) as last_seen from trust_shipment_tracking_events where event_type='EXCEPTION' group by exception_code order by count desc`),
   query(`select status,count(*)::int as count from trust_shipment_reconciliation_jobs group by status order by status`),
   query(`select count(*)::int as count from trust_shipments where status not in ('DELIVERED','CANCELLED') and eta_at is not null and eta_at < now()`),
  ]);
  return NextResponse.json({ok:true,surfaceStatus:'LIVE',generatedAt:new Date().toISOString(),summary:{activeShipments:Number(status.rows.filter((x:any)=>!['DELIVERED','CANCELLED'].includes(x.status)).reduce((n,x)=>n+Number(x.count),0)),lateShipments:Number(late.rows[0]?.count??0),exceptions:Number(exceptions.rows.reduce((n,x)=>n+Number(x.count),0)),reconciliationBacklog:Number(backlog.rows.filter((x:any)=>['PENDING','PROCESSING'].includes(x.status)).reduce((n,x)=>n+Number(x.count),0))},statuses:status.rows,providers:providers.rows,exceptions:exceptions.rows,reconciliation:backlog.rows},{headers:{'Cache-Control':'no-store'}});
 }catch(e){return NextResponse.json({ok:false,error:e instanceof Error?e.message:'CONTROL_TOWER_ERROR',surfaceStatus:'ERROR'},{status:400})}
}
