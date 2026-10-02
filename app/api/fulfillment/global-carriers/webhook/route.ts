import {NextResponse} from 'next/server';
import {ingestCarrierTracking} from '../../../../../modules/platform/global-logistics-v307';
export async function POST(req:Request){
  try{
    const body=await req.json();
    const result=await ingestCarrierTracking({carrierCode:String(body.carrierCode),externalEventId:String(body.externalEventId),trackingNumber:String(body.trackingNumber),status:body.status,occurredAt:String(body.occurredAt),location:body.location?String(body.location):undefined,description:body.description?String(body.description):undefined,exceptionCode:body.exceptionCode,etaAt:body.etaAt?String(body.etaAt):undefined,payload:body.payload??body});
    return NextResponse.json(result,{status:result.reconciliation==='DUPLICATE'?200:202});
  }catch(error){return NextResponse.json({error:error instanceof Error?error.message:'GLOBAL_TRACKING_INGEST_FAILED'},{status:400});}
}
