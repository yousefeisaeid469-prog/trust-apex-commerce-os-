import { NextResponse } from 'next/server';
import { chooseLogistics } from '../../../../../modules/platform/global-logistics-v305';
export async function POST(req:Request){try{const b=await req.json();return NextResponse.json(await chooseLogistics({orderId:String(b.orderId),shipmentId:b.shipmentId?String(b.shipmentId):null,country:String(b.country),currency:String(b.currency),mode:b.mode,priority:b.priority,decisionIdempotencyKey:String(b.decisionIdempotencyKey)}));}catch(e){return NextResponse.json({error:e instanceof Error?e.message:'LOGISTICS_DECISION_FAILED'},{status:400});}}
