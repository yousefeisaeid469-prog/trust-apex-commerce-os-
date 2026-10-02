import {NextResponse} from 'next/server';
import {requireUser} from '../../../../modules/platform/auth/current-user';
import {getMerchantByUserId} from '../../../../modules/merchants/core/store';
import {purchaseSellerService,SELLER_SERVICES} from '../../../../modules/platform/v322';
export const dynamic='force-dynamic'; export const runtime='nodejs';
export async function GET(){return NextResponse.json({ok:true,surfaceStatus:'LIVE',services:Object.entries(SELLER_SERVICES).map(([code,v])=>({code,...v}))});}
export async function POST(req:Request){try{const u=await requireUser(req as any);const m=await getMerchantByUserId(u.id);if(!m)return NextResponse.json({ok:false,error:'MERCHANT_REQUIRED'},{status:403});const b=await req.json();const result=await purchaseSellerService({merchantId:m.id,serviceCode:String(b.serviceCode) as keyof typeof SELLER_SERVICES,amount:b.amount,currency:b.currency,provider:b.provider,providerReference:b.providerReference,idempotencyKey:String(b.idempotencyKey)});return NextResponse.json({ok:true,surfaceStatus:'LIVE',serviceOrder:result},{status:result.replay?200:201});}catch(e){const msg=e instanceof Error?e.message:'SELLER_SERVICE_FAILED';return NextResponse.json({ok:false,error:msg},{status:msg==='DATABASE_NOT_CONFIGURED'?503:400});}}
