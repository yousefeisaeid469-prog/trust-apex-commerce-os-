import { NextResponse } from 'next/server';
import { withPgTransaction } from '../../../../../modules/platform/db/postgres';
import { failoverShipmentTx } from '../../../../../modules/platform/global-carrier-v304';
export async function POST(req:Request){try{const b=await req.json();const result=await withPgTransaction(tx=>failoverShipmentTx(tx,{shipmentId:String(b.shipmentId),orderId:String(b.orderId),country:String(b.country),currency:String(b.currency),mode:b.mode,idempotencyKey:String(b.idempotencyKey),fromCarrier:String(b.fromCarrier),reason:String(b.reason)}));return NextResponse.json(result);}catch(e){return NextResponse.json({error:e instanceof Error?e.message:'CARRIER_FAILOVER_FAILED'},{status:400});}}
