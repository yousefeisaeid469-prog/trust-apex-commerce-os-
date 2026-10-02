import { NextResponse } from 'next/server';
import { queueGlobalLogisticsExecution, getGlobalLogisticsExecution } from '../../../../../modules/platform/global-logistics-v306/runtime';

export async function POST(req:Request){
  try{return NextResponse.json(await queueGlobalLogisticsExecution(await req.json()),{status:202});}
  catch(error){return NextResponse.json({error:error instanceof Error?error.message:'GLOBAL_LOGISTICS_EXECUTION_FAILED'},{status:400});}
}

export async function GET(req:Request){
  try{const orderId=new URL(req.url).searchParams.get('orderId');if(!orderId)return NextResponse.json({error:'ORDER_ID_REQUIRED'},{status:400});return NextResponse.json({executions:await getGlobalLogisticsExecution(orderId)});}
  catch(error){return NextResponse.json({error:error instanceof Error?error.message:'GLOBAL_LOGISTICS_EXECUTION_LOOKUP_FAILED'},{status:400});}
}
