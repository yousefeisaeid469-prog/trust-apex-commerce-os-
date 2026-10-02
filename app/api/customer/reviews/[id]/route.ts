import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from './../../../../../modules/platform/auth/current-user.ts';
export const dynamic='force-dynamic';
export async function customer(request:NextRequest){const user=await getCurrentUser(request);if(!user)return {error:NextResponse.json({ok:false,error:'AUTH_REQUIRED',surfaceStatus:'ERROR'},{status:401})};return {user};}
export function ok(data:Record<string,unknown>,status=200){return NextResponse.json({ok:true,surfaceStatus:'LIVE',...data},{status,headers:{'Cache-Control':'no-store'}});}
export function fail(error:unknown,status=400){const code=error instanceof Error?error.message:'REQUEST_FAILED';return NextResponse.json({ok:false,error:code,surfaceStatus:'ERROR'},{status,headers:{'Cache-Control':'no-store'}});}

import {editReview,removeReview} from '../../../../../modules/customer-experience/reviews';
export async function PATCH(request:NextRequest,{params}:{params:Promise<{id:string}>}){const c=await customer(request);if(c.error)return c.error;try{return ok({review:await editReview(c.user.id,(await params).id,await request.json())});}catch(e){return fail(e);}}
export async function DELETE(request:NextRequest,{params}:{params:Promise<{id:string}>}){const c=await customer(request);if(c.error)return c.error;try{return ok(await removeReview(c.user.id,(await params).id));}catch(e){return fail(e,404);}}
