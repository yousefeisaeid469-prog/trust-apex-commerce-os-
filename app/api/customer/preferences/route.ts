import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from './../../../../modules/platform/auth/current-user.ts';
export const dynamic='force-dynamic';
export async function customer(request:NextRequest){const user=await getCurrentUser(request);if(!user)return {error:NextResponse.json({ok:false,error:'AUTH_REQUIRED',surfaceStatus:'ERROR'},{status:401})};return {user};}
export function ok(data:Record<string,unknown>,status=200){return NextResponse.json({ok:true,surfaceStatus:'LIVE',...data},{status,headers:{'Cache-Control':'no-store'}});}
export function fail(error:unknown,status=400){const code=error instanceof Error?error.message:'REQUEST_FAILED';return NextResponse.json({ok:false,error:code,surfaceStatus:'ERROR'},{status,headers:{'Cache-Control':'no-store'}});}

import {listPreferences,setPreference,bulkSetPreferences} from '../../../../modules/customer-experience/preferences';
export async function GET(request:NextRequest){const c=await customer(request);if(c.error)return c.error;try{return ok({preferences:await listPreferences(c.user.id)});}catch(e){return fail(e,500);}}
export async function PATCH(request:NextRequest){const c=await customer(request);if(c.error)return c.error;try{const body=await request.json();if(Array.isArray(body.items))return ok({preferences:await bulkSetPreferences(c.user.id,body.items)});return ok({preference:await setPreference(c.user.id,String(body.scope),String(body.key),Boolean(body.enabled),body.value??null)});}catch(e){return fail(e);}}
