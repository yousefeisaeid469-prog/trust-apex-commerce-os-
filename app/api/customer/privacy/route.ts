import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from './../../../../modules/platform/auth/current-user.ts';
export const dynamic='force-dynamic';
export async function customer(request:NextRequest){const user=await getCurrentUser(request);if(!user)return {error:NextResponse.json({ok:false,error:'AUTH_REQUIRED',surfaceStatus:'ERROR'},{status:401})};return {user};}
export function ok(data:Record<string,unknown>,status=200){return NextResponse.json({ok:true,surfaceStatus:'LIVE',...data},{status,headers:{'Cache-Control':'no-store'}});}
export function fail(error:unknown,status=400){const code=error instanceof Error?error.message:'REQUEST_FAILED';return NextResponse.json({ok:false,error:code,surfaceStatus:'ERROR'},{status,headers:{'Cache-Control':'no-store'}});}

import {requestExport,requestDeletion,listPrivacyJobs} from '../../../../modules/customer-experience/privacy';
export async function GET(request:NextRequest){const c=await customer(request);if(c.error)return c.error;try{return ok({jobs:await listPrivacyJobs(c.user.id)});}catch(e){return fail(e,500);}}
export async function POST(request:NextRequest){const c=await customer(request);if(c.error)return c.error;try{const action=String((await request.json()).action);if(action==='export')return ok({job:await requestExport(c.user.id)},202);if(action==='delete')return ok({job:await requestDeletion(c.user.id)},202);throw new Error('UNSUPPORTED_PRIVACY_ACTION');}catch(e){return fail(e);}}
