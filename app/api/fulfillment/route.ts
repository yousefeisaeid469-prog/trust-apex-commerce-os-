import {NextResponse} from 'next/server';
import {planFulfillment} from '@/modules/platform/omnichannel-fulfillment/core.ts';
export async function POST(req:Request){const body=await req.json();const plan=planFulfillment(body.orderId,body.channel??'WEB',body.lines??[],body.warehouses??[],body.inventory??[]);return NextResponse.json(plan);}
