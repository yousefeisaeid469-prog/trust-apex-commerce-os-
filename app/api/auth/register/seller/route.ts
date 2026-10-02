import { NextRequest, NextResponse } from 'next/server';
import { registerUser, createSession, getUserById } from '../../../../../modules/platform/auth/store';
import { setSessionCookie } from '../../../../../modules/platform/auth/http';
import { createSellerStore } from '../../../../../modules/platform/product-core';
export const dynamic='force-dynamic'; export const runtime='nodejs';
export async function POST(req:NextRequest){try{const b=await req.json();const user=await registerUser({email:String(b?.email??''),password:String(b?.password??''),role:'merchant'});const merchant=await createSellerStore(user.id,{storeName:String(b?.storeName??''),description:b?.description,countryCode:b?.countryCode,currency:b?.currency,language:b?.language});const sellerUser=await getUserById(user.id);const session=await createSession(user.id);const r=NextResponse.json({ok:true,user:sellerUser,merchant},{status:201,headers:{'Cache-Control':'no-store'}});setSessionCookie(r,session.id);return r}catch(e){return NextResponse.json({ok:false,error:e instanceof Error?e.message:'SELLER_REGISTRATION_FAILED'},{status:400,headers:{'Cache-Control':'no-store'}})}}
