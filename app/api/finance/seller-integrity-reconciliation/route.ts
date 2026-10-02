import {NextRequest,NextResponse} from 'next/server';
import {getCurrentUser} from '../../../../modules/platform/security/route-auth';
import {query,withPgTransaction} from '../../../../modules/platform/db/postgres';
import {runSellerFinancialIntegrityReconciliationTx} from '../../../../modules/marketplace/financial-integrity';

export const dynamic='force-dynamic';
const allowed=(role:string)=>['admin','operations'].includes(role);

export async function GET(req:NextRequest){
  const u=await getCurrentUser(req);
  if(!u||!allowed(u.role))return NextResponse.json({ok:false,error:u?'FORBIDDEN':'AUTH_REQUIRED'},{status:u?403:401});
  const status=req.nextUrl.searchParams.get('status');
  const limit=Math.min(100,Math.max(1,Number(req.nextUrl.searchParams.get('limit')||50)));
  const params:any[]=[];
  const where=status&&['OPEN','ACKNOWLEDGED','RESOLVED'].includes(status)?`where f.status=$${params.push(status)}`:'';
  params.push(limit);
  const rows=await query(`select f.id,f.run_id,f.merchant_id,f.currency,f.finding_type,f.severity,f.expected_amount,f.observed_amount,f.delta,f.status,f.details_json,f.created_at,f.updated_at from trust_marketplace_reconciliation_findings f ${where} order by f.created_at desc limit $${params.length}`,params);
  return NextResponse.json({ok:true,findings:rows.rows,surfaceStatus:'LIVE'},{headers:{'Cache-Control':'no-store'}});
}

export async function POST(req:NextRequest){
  const u=await getCurrentUser(req);
  if(!u||!allowed(u.role))return NextResponse.json({ok:false,error:u?'FORBIDDEN':'AUTH_REQUIRED'},{status:u?403:401});
  const key=req.headers.get('idempotency-key')?.trim();
  if(!key)return NextResponse.json({ok:false,error:'IDEMPOTENCY_KEY_REQUIRED'},{status:400});
  try{
    const b=await req.json();
    const result=await withPgTransaction(tx=>runSellerFinancialIntegrityReconciliationTx(tx,{merchantId:typeof b.merchantId==='string'?b.merchantId:undefined,currency:typeof b.currency==='string'?b.currency:undefined,idempotencyKey:key}));
    return NextResponse.json({ok:true,result,surfaceStatus:'LIVE'},{status:result.replay?200:201});
  }catch(e){
    const m=e instanceof Error?e.message:'FINANCIAL_RECONCILIATION_FAILED';
    return NextResponse.json({ok:false,error:m,surfaceStatus:'ERROR'},{status:409});
  }
}
