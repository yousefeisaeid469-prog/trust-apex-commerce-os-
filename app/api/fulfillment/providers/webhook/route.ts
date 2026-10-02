import { NextRequest, NextResponse } from 'next/server';
import { receiveShipmentWebhook } from '@/modules/platform/fulfillment-providers/execution';

export const dynamic='force-dynamic'; export const runtime='nodejs';
export async function POST(req:NextRequest){
  const raw=await req.text();
  const provider=req.headers.get('x-trust-provider')?.trim()??'';
  const eventId=req.headers.get('x-trust-event-id')?.trim()??'';
  const signature=req.headers.get('x-trust-signature');
  const timestamp=req.headers.get('x-trust-timestamp');
  if(!provider||!eventId)return NextResponse.json({ok:false,error:'WEBHOOK_HEADERS_REQUIRED',surfaceStatus:'ERROR'},{status:400});
  let payload:unknown;try{payload=JSON.parse(raw);}catch{return NextResponse.json({ok:false,error:'INVALID_JSON',surfaceStatus:'ERROR'},{status:400});}
  try{const result=await receiveShipmentWebhook({rawBody:raw,provider,eventId,signature,timestamp,payload});return NextResponse.json({ok:true,surfaceStatus:'LIVE',result},{status:result.duplicate?200:202,headers:{'Cache-Control':'no-store'}});}
  catch(e){const message=e instanceof Error?e.message:'WEBHOOK_REJECTED';const status=message==='INVALID_WEBHOOK_SIGNATURE'||message==='WEBHOOK_TIMESTAMP_INVALID'?401:message==='SHIPMENT_NOT_RESOLVED'?422:400;return NextResponse.json({ok:false,error:message,surfaceStatus:'ERROR'},{status});}
}
