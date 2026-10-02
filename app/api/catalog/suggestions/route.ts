import { NextRequest, NextResponse } from 'next/server';
import { searchMarketplace } from '../../../../modules/marketplace/discovery';
export const dynamic='force-dynamic'; export const runtime='nodejs';
export async function GET(request:NextRequest){
 const q=request.nextUrl.searchParams.get('q')?.trim().slice(0,120)??'';
 if(q.length<2)return NextResponse.json({ok:true,query:q,suggestions:[]});
 try{const result=await searchMarketplace({q,limit:8,page:1,sort:'relevance',inStock:false});const seen=new Set<string>();const suggestions=result.items.filter((item:any)=>{const key=`${item.name}|${item.category}`;if(seen.has(key))return false;seen.add(key);return true}).slice(0,8).map((item:any)=>({id:item.id,name:item.name,category:item.category,merchantName:item.merchantName,price:item.price,image:item.image}));return NextResponse.json({ok:true,query:q,suggestions});}catch(error){return NextResponse.json({ok:false,error:error instanceof Error?error.message:'SUGGESTIONS_FAILED'},{status:400});}
}
