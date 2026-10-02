import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '../../../../modules/platform/auth/current-user';
import { query, withPgTransaction } from '../../../../modules/platform/db/postgres';
import { reconcileReturn, reconcileAllOpenReturns } from '../../../../modules/commerce/reverse-commerce';
export const dynamic='force-dynamic'; export const runtime='nodejs';
const out=(body:unknown,status=200)=>NextResponse.json(body,{status,headers:{'Cache-Control':'no-store'}});
export async function GET(req:NextRequest){const u=await getCurrentUser(req);if(!u||!['admin','operations','support'].includes(u.role))return out({ok:false,error:u?'FORBIDDEN':'AUTH_REQUIRED',surfaceStatus:'ERROR'},u?403:401);try{const id=req.nextUrl.searchParams.get('returnId');const report=id?await reconcileReturn({query,transaction:withPgTransaction},id):await reconcileAllOpenReturns({query,transaction:withPgTransaction},Number(req.nextUrl.searchParams.get('limit')||100));return out({ok:true,report,surfaceStatus:'LIVE'});}catch(e){return out({ok:false,error:e instanceof Error?e.message:'RETURN_RECONCILIATION_FAILED',surfaceStatus:'ERROR'},500);}}
