import {NextResponse} from 'next/server';
import {listGlobalTracking,trackingReconciliationSummary} from '../../../../../modules/platform/global-logistics-v307';
export async function GET(req:Request){
  try{const orderId=new URL(req.url).searchParams.get('orderId');if(!orderId)return NextResponse.json({error:'ORDER_ID_REQUIRED'},{status:400});return NextResponse.json({events:await listGlobalTracking(orderId),summary:await trackingReconciliationSummary(orderId)});}catch(error){return NextResponse.json({error:error instanceof Error?error.message:'GLOBAL_TRACKING_LOOKUP_FAILED'},{status:400});}
}
