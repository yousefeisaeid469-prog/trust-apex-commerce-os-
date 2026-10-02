import { NextRequest, NextResponse } from 'next/server';
import { searchMarketplace } from '../../../../modules/marketplace/discovery';
import { randomUUID } from 'node:crypto';
export const dynamic='force-dynamic'; export const runtime='nodejs';
export async function GET(req: NextRequest) {
  try {
    const p=req.nextUrl.searchParams;
    const num=(k:string)=>{const v=Number(p.get(k)); return Number.isFinite(v)?v:undefined;};
    const session=req.cookies.get('trust_marketplace_session')?.value ?? randomUUID();
    const result=await searchMarketplace({sessionKey:session, q:p.get('q')??undefined,category:p.get('category')??undefined,merchant:p.get('merchant')??undefined,region:p.get('region')??undefined,tag:p.get('tag')??undefined,minPrice:num('minPrice'),maxPrice:num('maxPrice'),minRating:num('minRating'),inStock:p.get('inStock')==='true',sort:(p.get('sort') as any)||'relevance',page:num('page'),limit:num('limit')});
    const response=NextResponse.json({ok:true,...result},{headers:{'Cache-Control':'no-store'}});
    if(!req.cookies.get('trust_marketplace_session')) response.cookies.set('trust_marketplace_session',session,{httpOnly:true,sameSite:'lax',secure:process.env.NODE_ENV==='production',maxAge:60*60*24*180,path:'/'});
    return response;
  } catch (e) { return NextResponse.json({ok:false,error:e instanceof Error?e.message:'MARKETPLACE_SEARCH_FAILED'},{status:400}); }
}
