import {NextResponse} from 'next/server';
import {requireUser} from '../../../../modules/platform/auth/current-user';
import {query} from '../../../../modules/platform/db/postgres';
import {chargeB2BService} from '../../../../modules/platform/v322';
export const dynamic='force-dynamic'; export const runtime='nodejs';
export async function POST(req:Request){try{const u=await requireUser(req as any);const b=await req.json();const account=(await query(`select id from trust_marketplace_b2b_accounts where id=$1 and customer_id=$2 and status='APPROVED'`,[String(b.b2bAccountId),u.id])).rows[0];if(!account)return NextResponse.json({ok:false,error:'B2B_ACCOUNT_NOT_FOUND_OR_NOT_APPROVED'},{status:403});const result=await chargeB2BService({b2bAccountId:account.id,serviceCode:String(b.serviceCode),amount:Number(b.amount),currency:b.currency,orderId:b.orderId,idempotencyKey:String(b.idempotencyKey),metadata:b.metadata});return NextResponse.json({ok:true,surfaceStatus:'LIVE',charge:result},{status:result.replay?200:201});}catch(e){const msg=e instanceof Error?e.message:'B2B_SERVICE_FAILED';return NextResponse.json({ok:false,error:msg},{status:msg==='DATABASE_NOT_CONFIGURED'?503:400});}}
