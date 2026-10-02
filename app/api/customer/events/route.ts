import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser, requirePermission } from '../../../../modules/platform/auth/current-user';
export const dynamic='force-dynamic';
export function ok(data:Record<string,unknown>,status=200){return NextResponse.json({ok:true,surfaceStatus:'LIVE',...data},{status,headers:{'Cache-Control':'no-store'}})}
export function fail(e:unknown,status=400){return NextResponse.json({ok:false,error:e instanceof Error?e.message:'REQUEST_FAILED',surfaceStatus:'ERROR'},{status,headers:{'Cache-Control':'no-store'}})}
export async function auth(request:NextRequest){const user=await getCurrentUser(request);if(!user)throw Object.assign(new Error('AUTH_REQUIRED'),{status:401});return user;}
export async function opsAuth(request:NextRequest){return requirePermission(request,'manage_system');}

import {appendCustomerEvent,listCustomerEvents} from '../../../../modules/customer-experience/events';
export async function GET(request:NextRequest){try{const u=await auth(request);return ok({events:await listCustomerEvents(u.id,Number(request.nextUrl.searchParams.get('limit')??100))})}catch(e){return fail(e,401)}}
export async function POST(request:NextRequest){try{const u=await auth(request);const b=await request.json();return ok({event:await appendCustomerEvent({...b,customerId:u.id})},201)}catch(e){return fail(e)}}
