import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '../../../../modules/platform/auth/current-user';
import { recoveryEngineSnapshot } from '../../../../modules/commerce/core/recovery-engine';
import { query } from '../../../../modules/platform/db/postgres';

export const dynamic='force-dynamic';
export const runtime='nodejs';

export async function GET(req:NextRequest){
  const user=await getCurrentUser(req);
  if(!user) return NextResponse.json({ok:false,error:'AUTH_REQUIRED'},{status:401});
  if(!['admin','operations'].includes(String(user.role))) return NextResponse.json({ok:false,error:'FORBIDDEN'},{status:403});
  const limit=Number(req.nextUrl.searchParams.get('limit')||100);
  const [plans,counts]=await Promise.all([
    recoveryEngineSnapshot({query:(sql:string,params?:unknown[])=>query(sql,params)},limit),
    query(`select status,count(*)::int as count from trust_commerce_recovery_plans group by status order by status`),
  ]);
  return NextResponse.json({ok:true,version:'V418.0.0',recoveryEngine:{plans,counts:counts.rows}},{headers:{'Cache-Control':'no-store'}});
}
