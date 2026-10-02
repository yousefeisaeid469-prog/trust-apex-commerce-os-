import {NextResponse} from 'next/server';
import {getGlobalLogisticsControlTower,getGlobalLogisticsFleetControlTower,snapshotGlobalLogisticsControlTower} from '../../../../../modules/platform/global-logistics-v308';
export async function GET(req:Request){
  try{const u=new URL(req.url);const orderId=u.searchParams.get('orderId');if(orderId)return NextResponse.json(await getGlobalLogisticsControlTower(orderId));return NextResponse.json(await getGlobalLogisticsFleetControlTower());}
  catch(error){return NextResponse.json({error:error instanceof Error?error.message:'GLOBAL_LOGISTICS_CONTROL_TOWER_FAILED'},{status:400});}
}
export async function POST(req:Request){
  try{const body=await req.json();const orderId=String(body.orderId||'');if(!orderId)return NextResponse.json({error:'ORDER_ID_REQUIRED'},{status:400});return NextResponse.json(await snapshotGlobalLogisticsControlTower(orderId),{status:201});}
  catch(error){return NextResponse.json({error:error instanceof Error?error.message:'GLOBAL_LOGISTICS_CONTROL_TOWER_SNAPSHOT_FAILED'},{status:400});}
}
