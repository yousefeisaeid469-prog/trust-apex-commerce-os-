import {NextRequest,NextResponse} from 'next/server';
import {getCurrentUser} from '../../../../modules/platform/auth/current-user';
import {query,withPgTransaction} from '../../../../modules/platform/db/postgres';
import {listPostSaleCasesTx} from '../../../../modules/platform/post-sale-orchestration';
export const dynamic='force-dynamic';
export async function GET(req:NextRequest){const u=await getCurrentUser(req);if(!u)return NextResponse.json({ok:false,error:'AUTH_REQUIRED'},{status:401});if(!['admin','operations','support'].includes(u.role))return NextResponse.json({ok:false,error:'PRIVILEGED_ACCESS_REQUIRED'},{status:403});const stage=req.nextUrl.searchParams.get('stage')||undefined;const limit=Number(req.nextUrl.searchParams.get('limit')||50);const cases=await listPostSaleCasesTx({query,transaction:withPgTransaction},{stage,limit});return NextResponse.json({ok:true,surfaceStatus:'LIVE',cases,stage:stage??'ALL'},{headers:{'Cache-Control':'no-store'}})}
