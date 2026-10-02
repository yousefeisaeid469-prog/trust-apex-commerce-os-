import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser, requirePermission } from '../../../../modules/platform/auth/current-user';
export const dynamic='force-dynamic';
export function ok(data:Record<string,unknown>,status=200){return NextResponse.json({ok:true,surfaceStatus:'LIVE',...data},{status,headers:{'Cache-Control':'no-store'}})}
export function fail(e:unknown,status=400){return NextResponse.json({ok:false,error:e instanceof Error?e.message:'REQUEST_FAILED',surfaceStatus:'ERROR'},{status,headers:{'Cache-Control':'no-store'}})}
export async function auth(request:NextRequest){const user=await getCurrentUser(request);if(!user)throw Object.assign(new Error('AUTH_REQUIRED'),{status:401});return user;}
export async function opsAuth(request:NextRequest){return requirePermission(request,'manage_system');}

import {customerOpsSnapshot,rebuildSegment,cleanupCustomerData} from '../../../../modules/customer-experience/ops';
export async function GET(request:NextRequest){try{await opsAuth(request);return ok({snapshot:await customerOpsSnapshot()})}catch(e){return fail(e,403)}}
export async function POST(request:NextRequest){try{await opsAuth(request);const b=await request.json();if(b.action==='rebuild_segment')return ok({result:await rebuildSegment(String(b.segmentId),Number(b.limit??1000))});if(b.action==='cleanup')return ok({result:await cleanupCustomerData(Number(b.days??730))});throw new Error('UNSUPPORTED_OPERATION')}catch(e){return fail(e,403)}}
