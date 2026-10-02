import {NextRequest,NextResponse} from 'next/server';
import {queryCatalog} from '../../../modules/commerce/repository/catalog';
import {buildMarketplaceIntelligence} from '../../../modules/platform/marketplace-intelligence';
export const dynamic='force-dynamic'; export const runtime='nodejs';
export async function GET(req:NextRequest){const p=req.nextUrl.searchParams;const catalog=await queryCatalog({limit:60});const result=buildMarketplaceIntelligence(catalog.items,{q:p.get('q')||'',category:p.get('category')||undefined,region:p.get('region')||undefined,maxPrice:p.has('maxPrice')?Number(p.get('maxPrice')):undefined,minRating:p.has('minRating')?Number(p.get('minRating')):undefined,inStock:p.get('inStock')==='1'});return NextResponse.json({ok:true,...result},{headers:{'Cache-Control':'no-store'}})}
