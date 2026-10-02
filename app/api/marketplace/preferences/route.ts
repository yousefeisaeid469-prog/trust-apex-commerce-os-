import { NextRequest, NextResponse } from 'next/server';
import { recordProductView } from '../../../../modules/marketplace/personalization';
import { randomUUID } from 'node:crypto';
export const dynamic='force-dynamic'; export const runtime='nodejs';
const COOKIE='trust_marketplace_session';
export async function POST(req:NextRequest){
  try{
    const body=await req.json();
    const session=req.cookies.get(COOKIE)?.value ?? randomUUID();
    await recordProductView(session,{productId:String(body.productId||''),category:String(body.category||''),price:Number(body.price||0)});
    const response=NextResponse.json({ok:true,surfaceStatus:'LIVE',personalization:'ORGANIC_ONLY'});
    if(!req.cookies.get(COOKIE)) response.cookies.set(COOKIE,session,{httpOnly:true,sameSite:'lax',secure:process.env.NODE_ENV==='production',maxAge:60*60*24*180,path:'/'});
    return response;
  }catch(e){return NextResponse.json({ok:false,error:e instanceof Error?e.message:'PREFERENCE_EVENT_FAILED'},{status:400});}
}
