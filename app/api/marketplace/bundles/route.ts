import {NextRequest,NextResponse} from 'next/server';
import {recommendSmartBundle} from '../../../../modules/marketplace/smart-bundles';
export const dynamic='force-dynamic'; export const runtime='nodejs';
export async function POST(req:NextRequest){try{const b=await req.json();const result=await recommendSmartBundle({productId:String(b?.productId??''),budget:Number.isFinite(Number(b?.budget))?Number(b.budget):undefined,region:String(b?.region??'GLOBAL'),limit:Number.isFinite(Number(b?.limit))?Number(b.limit):5});return NextResponse.json({ok:true,...result},{headers:{'Cache-Control':'no-store'}})}catch(e){return NextResponse.json({ok:false,error:e instanceof Error?e.message:'BUNDLE_FAILED'},{status:400})}}
