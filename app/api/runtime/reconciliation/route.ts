import { NextResponse } from 'next/server';
import { query } from '../../../../modules/platform/db/postgres';
import { getCurrentUser } from '../../../../modules/platform/auth/current-user';

export const dynamic='force-dynamic';

export async function GET(req:any){
  const user=await getCurrentUser(req);
  if(!user || !['admin','operations'].includes(String(user.role))) return NextResponse.json({error:'FORBIDDEN'}, {status:403,headers:{'Cache-Control':'no-store'}});
  const rows=(await query(`select order_id,observed_state,expected_next_state,reconciliation_status,divergence_codes_json,recommended_action,observed_hash,last_reconciled_at,updated_at from trust_commerce_state_reconciliation order by updated_at desc limit 200`)).rows;
  const counts=(await query(`select reconciliation_status,count(*)::int count from trust_commerce_state_reconciliation group by reconciliation_status`)).rows;
  return NextResponse.json({version:'V419.0.0',counts,orders:rows},{headers:{'Cache-Control':'no-store'}});
}
