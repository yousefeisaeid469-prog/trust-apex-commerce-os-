import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '../../../../../modules/platform/auth/current-user';
import { externalEffectRecoverySnapshot } from '../../../../../modules/platform/transaction-consistency';
import { query } from '../../../../../modules/platform/db/postgres';

export const dynamic='force-dynamic';
export const runtime='nodejs';

export async function GET(req:NextRequest){
  const user=await getCurrentUser(req);
  if(!user) return NextResponse.json({ok:false,error:'AUTH_REQUIRED'},{status:401});
  if(!['admin','operations'].includes(String(user.role))) return NextResponse.json({ok:false,error:'FORBIDDEN'},{status:403});
  const snapshot=await externalEffectRecoverySnapshot();
  const stale=await query(`select id,scope,effect_key,status,provider,attempts,lease_until,available_at,last_error,updated_at from trust_external_effect_intents where status='EXECUTING' and lease_until<now() order by lease_until asc limit 100`);
  return NextResponse.json({ok:true,externalEffects:{...snapshot,staleExecuting:stale.rows}},{headers:{'Cache-Control':'no-store'}});
}
