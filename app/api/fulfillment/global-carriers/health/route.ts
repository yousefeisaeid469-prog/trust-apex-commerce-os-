import { NextResponse } from 'next/server';
import { getCarrierNetworkHealth } from '../../../../../modules/platform/global-carrier-v304';
export async function GET(){try{return NextResponse.json({items:await getCarrierNetworkHealth()});}catch(e){return NextResponse.json({error:e instanceof Error?e.message:'CARRIER_HEALTH_FAILED'},{status:500});}}
