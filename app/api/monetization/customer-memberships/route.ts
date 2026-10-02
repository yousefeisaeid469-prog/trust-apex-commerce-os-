import {NextResponse} from 'next/server';
import {requireUser} from '../../../../modules/platform/auth/current-user';
import {query,withPgTransaction} from '../../../../modules/platform/db/postgres';
import {billMembershipRenewal} from '../../../../modules/platform/v322';
export const dynamic='force-dynamic'; export const runtime='nodejs';
export async function POST(req:Request){try{const u=await requireUser(req as any);const b=await req.json();const membership=(await query(`select m.id from trust_marketplace_customer_memberships m where m.id=$1 and m.customer_id=$2`,[String(b.membershipId),u.id])).rows[0];if(!membership)return NextResponse.json({ok:false,error:'MEMBERSHIP_NOT_FOUND'},{status:404});const result=await billMembershipRenewal({membershipId:membership.id,idempotencyKey:String(b.idempotencyKey),provider:b.provider,providerReference:b.providerReference});return NextResponse.json({ok:true,surfaceStatus:'LIVE',billingEvent:result},{status:result.replay?200:201});}catch(e){const msg=e instanceof Error?e.message:'MEMBERSHIP_RENEWAL_FAILED';return NextResponse.json({ok:false,error:msg},{status:msg==='DATABASE_NOT_CONFIGURED'?503:400});}}
