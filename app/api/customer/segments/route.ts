import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser, requirePermission } from '../../../../modules/platform/auth/current-user';
export const dynamic='force-dynamic';
export function ok(data:Record<string,unknown>,status=200){return NextResponse.json({ok:true,surfaceStatus:'LIVE',...data},{status,headers:{'Cache-Control':'no-store'}})}
export function fail(e:unknown,status=400){return NextResponse.json({ok:false,error:e instanceof Error?e.message:'REQUEST_FAILED',surfaceStatus:'ERROR'},{status,headers:{'Cache-Control':'no-store'}})}
export async function auth(request:NextRequest){const user=await getCurrentUser(request);if(!user)throw Object.assign(new Error('AUTH_REQUIRED'),{status:401});return user;}
export async function opsAuth(request:NextRequest){return requirePermission(request,'manage_system');}

import {listSegments,createSegment} from '../../../../modules/customer-experience/segments';
export async function GET(){try{return ok({segments:await listSegments()})}catch(e){return fail(e,500)}}
export async function POST(request:NextRequest){try{await opsAuth(request);return ok({segment:await createSegment(await request.json())},201)}catch(e){return fail(e,403)}}
