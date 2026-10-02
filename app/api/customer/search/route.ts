import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser, requirePermission } from '../../../../modules/platform/auth/current-user';
export const dynamic='force-dynamic';
export function ok(data:Record<string,unknown>,status=200){return NextResponse.json({ok:true,surfaceStatus:'LIVE',...data},{status,headers:{'Cache-Control':'no-store'}})}
export function fail(e:unknown,status=400){return NextResponse.json({ok:false,error:e instanceof Error?e.message:'REQUEST_FAILED',surfaceStatus:'ERROR'},{status,headers:{'Cache-Control':'no-store'}})}
export async function auth(request:NextRequest){const user=await getCurrentUser(request);if(!user)throw Object.assign(new Error('AUTH_REQUIRED'),{status:401});return user;}
export async function opsAuth(request:NextRequest){return requirePermission(request,'manage_system');}

import {searchCustomers} from '../../../../modules/customer-experience/search';
export async function GET(request:NextRequest){try{await opsAuth(request);return ok({customers:await searchCustomers({q:request.nextUrl.searchParams.get('q')??undefined,status:request.nextUrl.searchParams.get('status')??undefined,limit:Number(request.nextUrl.searchParams.get('limit')??25)})})}catch(e){return fail(e,403)}}
