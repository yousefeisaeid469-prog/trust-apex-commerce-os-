import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '../../../../modules/platform/auth/current-user';
import { recoverySnapshot } from '../../../../modules/commerce/core/recovery-closure';
import { query } from '../../../../modules/platform/db/postgres';

export const dynamic='force-dynamic';
export const runtime='nodejs';

export async function GET(req:NextRequest){
  const user=await getCurrentUser(req);
  if(!user) return NextResponse.json({ok:false,error:'AUTH_REQUIRED'},{status:401});
  if(!['admin','operations'].includes(String(user.role))) return NextResponse.json({ok:false,error:'FORBIDDEN'},{status:403});
  const status=req.nextUrl.searchParams.get('status')||undefined;
  const boundary=req.nextUrl.searchParams.get('boundary')||undefined;
  const limit=Number(req.nextUrl.searchParams.get('limit')||50);
  const [cases,counts]=await Promise.all([
    recoverySnapshot({status,boundary,limit}),
    query(`select status,count(*)::int as count from trust_commerce_recovery_cases group by status order by status`),
  ]);
  return NextResponse.json({ok:true,recovery:{cases,counts:counts.rows}},{headers:{'Cache-Control':'no-store'}});
}
