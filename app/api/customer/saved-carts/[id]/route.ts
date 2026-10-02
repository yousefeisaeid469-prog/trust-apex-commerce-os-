import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from './../../../../../modules/platform/auth/current-user.ts';
export const dynamic='force-dynamic';
export async function customer(request:NextRequest){const user=await getCurrentUser(request);if(!user)return {error:NextResponse.json({ok:false,error:'AUTH_REQUIRED',surfaceStatus:'ERROR'},{status:401})};return {user};}
export function ok(data:Record<string,unknown>,status=200){return NextResponse.json({ok:true,surfaceStatus:'LIVE',...data},{status,headers:{'Cache-Control':'no-store'}});}
export function fail(error:unknown,status=400){const code=error instanceof Error?error.message:'REQUEST_FAILED';return NextResponse.json({ok:false,error:code,surfaceStatus:'ERROR'},{status,headers:{'Cache-Control':'no-store'}});}

import {getSavedCart,addSavedCartItem,removeSavedCartItem,markSavedCartStatus} from '../../../../../modules/customer-experience/saved-carts';
export async function GET(request:NextRequest,{params}:{params:Promise<{id:string}>}){const c=await customer(request);if(c.error)return c.error;try{return ok({savedCart:await getSavedCart(c.user.id,(await params).id)});}catch(e){return fail(e,404);}}
export async function PATCH(request:NextRequest,{params}:{params:Promise<{id:string}>}){const c=await customer(request);if(c.error)return c.error;try{const id=(await params).id;const body=await request.json();return ok({savedCart:await markSavedCartStatus(c.user.id,id,String(body.status))});}catch(e){return fail(e);}}
export async function POST(request:NextRequest,{params}:{params:Promise<{id:string}>}){const c=await customer(request);if(c.error)return c.error;try{const id=(await params).id;const body=await request.json();if(body.action==='remove')return ok(await removeSavedCartItem(c.user.id,id,String(body.itemId)));return ok({item:await addSavedCartItem(c.user.id,id,body)},201);}catch(e){return fail(e);}}
