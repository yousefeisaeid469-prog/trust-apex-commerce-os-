import {NextResponse} from 'next/server';
import {concurrentReservationProbe} from '../../../../../modules/platform/v318/integration-lab/index.ts';
export async function GET(){const probe=await concurrentReservationProbe(10,3);return NextResponse.json({version:'V318.0.0',mode:'verification-simulator',probe,liveDatabase:Boolean(process.env.DATABASE_URL),externalProvidersLive:false});}
