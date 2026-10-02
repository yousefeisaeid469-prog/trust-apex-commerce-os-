import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '../../../../modules/platform/auth/current-user';
import { getMerchantByUserId } from '../../../../modules/merchants/core/store';
import { appendMerchantEvent, buildControlSnapshot, createControlAlert, listCommerceRecords, listControlAlerts, upsertCommerceRecord } from '../../../../modules/merchant-commerce/store';

export const dynamic='force-dynamic';
export const runtime='nodejs';
const noStore={'Cache-Control':'no-store'};
function json(body:unknown,status=200){return NextResponse.json(body,{status,headers:noStore});}

export async function GET(req:NextRequest){
  const user=await getCurrentUser(req); if(!user)return json({ok:false,error:'AUTH_REQUIRED',surfaceStatus:'ERROR'},401);
  const merchant=await getMerchantByUserId(user.id); if(!merchant)return json({ok:false,error:'MERCHANT_REQUIRED',surfaceStatus:'ERROR'},403);
  const type=req.nextUrl.searchParams.get('type')||undefined;
  try{
    const [snapshot,alerts,records]=await Promise.all([buildControlSnapshot(merchant.id),listControlAlerts(merchant.id),listCommerceRecords(merchant.id,type,100)]);
    return json({ok:true,surfaceStatus:'LIVE',merchant:{id:merchant.id,storeName:merchant.storeName,verificationStatus:merchant.verificationStatus},snapshot,alerts,records});
  }catch(error){return json({ok:false,error:error instanceof Error?error.message:'CONTROL_PLANE_ERROR',surfaceStatus:'ERROR'},500);}
}

export async function POST(req:NextRequest){
  const user=await getCurrentUser(req); if(!user)return json({ok:false,error:'AUTH_REQUIRED',surfaceStatus:'ERROR'},401);
  const merchant=await getMerchantByUserId(user.id); if(!merchant)return json({ok:false,error:'MERCHANT_REQUIRED',surfaceStatus:'ERROR'},403);
  let body:any; try{body=await req.json();}catch{return json({ok:false,error:'INVALID_JSON',surfaceStatus:'ERROR'},400);}
  const action=String(body?.action??'').trim();
  try{
    if(action==='upsert_record'){
      const record=await upsertCommerceRecord({...body,merchantId:merchant.id});
      await appendMerchantEvent({merchantId:merchant.id,actorId:user.id,eventType:'RECORD_UPSERTED',aggregateType:record.recordType,aggregateId:record.recordKey,payload:{status:record.status}});
      return json({ok:true,surfaceStatus:'LIVE',record});
    }
    if(action==='create_alert'){
      const alert=await createControlAlert({...body,merchantId:merchant.id});
      return json({ok:true,surfaceStatus:'LIVE',alert});
    }
    if(action==='snapshot'){
      const snapshot=await buildControlSnapshot(merchant.id); return json({ok:true,surfaceStatus:'LIVE',snapshot});
    }
    return json({ok:false,error:'ACTION_NOT_SUPPORTED',surfaceStatus:'ERROR'},400);
  }catch(error){return json({ok:false,error:error instanceof Error?error.message:'CONTROL_PLANE_ERROR',surfaceStatus:'ERROR'},500);}
}
