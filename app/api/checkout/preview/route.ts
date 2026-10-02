import { NextRequest, NextResponse } from 'next/server';
import { query, databaseConfigured } from '../../../../modules/platform/db/postgres';
import { reconcileCart } from '../../../../modules/commerce/cart/experience-3';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export async function POST(req: NextRequest) {
  if (!databaseConfigured()) return NextResponse.json({ ok:false, error:'DATABASE_NOT_CONFIGURED' }, { status:503 });
  try {
    const body=await req.json().catch(()=>({}));
    const lines=Array.isArray(body?.items)?body.items.map((item:any)=>({productId:String(item.productId??''),qty:Number(item.qty??item.quantity)})):[];
    const ids=[...new Set(lines.map((line:any)=>line.productId).filter(Boolean))];
    const result=ids.length?await query<{id:string;name:string;price:string|number;stock:number;image:string|null;active:boolean}>(`select id,name,price,stock,image,active from trust_products where id = any($1::text[])`,[ids]):{rows:[] as any[]};
    const products=result.rows.filter(p=>p.active).map(p=>({productId:String(p.id),name:p.name,unitPrice:Number(p.price),stock:Number(p.stock),image:p.image??undefined}));
    const state=reconcileCart(lines,products);
    const priceChanged=Array.isArray(body?.clientItems)&&state.items.some((item:any)=>{const old=body.clientItems.find((x:any)=>String(x?.productId)===String(item.productId));return old&&Number(old.unitPrice)!==Number(item.unitPrice)});
    return NextResponse.json({ok:true,checkout:{...state,priceChanged,authoritative:true,generatedAt:new Date().toISOString()}},{headers:{'Cache-Control':'no-store'}});
  } catch(error){const message=error instanceof Error?error.message:'CHECKOUT_PREVIEW_FAILED';return NextResponse.json({ok:false,error:message},{status:400,headers:{'Cache-Control':'no-store'}})}
}
