import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/modules/platform/auth/current-user';
import { createProviderLabel } from '@/modules/platform/fulfillment-providers/execution';

const privileged=['admin','support','operations'];
export const dynamic='force-dynamic'; export const runtime='nodejs';
export async function POST(req:NextRequest,{params}:{params:{id:string}}){
  const user=await getCurrentUser(req);
  if(!user)return NextResponse.json({ok:false,error:'AUTH_REQUIRED',surfaceStatus:'ERROR'},{status:401});
  if(!privileged.includes(user.role))return NextResponse.json({ok:false,error:'PRIVILEGED_ACCESS_REQUIRED',surfaceStatus:'ERROR'},{status:403});
  try{const result=await createProviderLabel(params.id);return NextResponse.json({ok:true,surfaceStatus:'LIVE',result},{headers:{'Cache-Control':'no-store'}});}
  catch(e){const message=e instanceof Error?e.message:'LABEL_CREATION_ERROR';const status=message.startsWith('PROVIDER_REQUIRED')?501:message==='SHIPMENT_NOT_FOUND'?404:400;return NextResponse.json({ok:false,error:message,surfaceStatus:status===501?'PROVIDER_REQUIRED':'ERROR'},{status});}
}
