import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from './../../../../modules/platform/auth/current-user.ts';
export const dynamic='force-dynamic';
export async function customer(request:NextRequest){const user=await getCurrentUser(request);if(!user)return {error:NextResponse.json({ok:false,error:'AUTH_REQUIRED',surfaceStatus:'ERROR'},{status:401})};return {user};}
export function ok(data:Record<string,unknown>,status=200){return NextResponse.json({ok:true,surfaceStatus:'LIVE',...data},{status,headers:{'Cache-Control':'no-store'}});}
export function fail(error:unknown,status=400){const code=error instanceof Error?error.message:'REQUEST_FAILED';return NextResponse.json({ok:false,error:code,surfaceStatus:'ERROR'},{status,headers:{'Cache-Control':'no-store'}});}

import {listTimeline} from '../../../../modules/customer-experience/core';
export async function GET(request:NextRequest){const c=await customer(request);if(c.error)return c.error;try{const limit=Number(request.nextUrl.searchParams.get('limit')??'100');return ok({events:await listTimeline(c.user.id,Number.isFinite(limit)?limit:100,request.nextUrl.searchParams.get('cursor')??undefined)});}catch(e){return fail(e,500);}}
