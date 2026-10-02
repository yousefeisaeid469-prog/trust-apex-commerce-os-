import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '../../../../modules/platform/auth/current-user';
import { getMerchantByUserId } from '../../../../modules/merchants/core/store';
import { listMerchantProducts } from '../../../../modules/commerce/repository/catalog';
import { listMerchantOrders } from '../../../../modules/commerce/merchant-ops/service';

export const dynamic='force-dynamic'; export const runtime='nodejs';

export async function GET(req:NextRequest){
  const user=await getCurrentUser(req); if(!user) return NextResponse.json({ok:false,error:'AUTH_REQUIRED'},{status:401,headers:{'Cache-Control':'no-store'}});
  const merchant=await getMerchantByUserId(user.id); if(!merchant) return NextResponse.json({ok:false,error:'MERCHANT_REQUIRED'},{status:403,headers:{'Cache-Control':'no-store'}});
  const products=await listMerchantProducts(merchant.id), orders=await listMerchantOrders(merchant.id);
  const productIds=new Set(products.map(p=>p.id));
  const revenue=orders.reduce((sum,o)=>sum+o.items.filter(i=>productIds.has(i.productId)).reduce((s,i)=>s+(products.find(p=>p.id===i.productId)?.price??0)*i.qty,0),0);
  const lowStock=products.filter(p=>p.stock>0&&p.stock<=10).length, outOfStock=products.filter(p=>p.stock===0).length;
  const processing=orders.filter(o=>o.status==='processing').length, shipped=orders.filter(o=>o.status==='shipped').length;
  const aov=orders.length?revenue/orders.length:0;
  return NextResponse.json({ok:true,merchant:{id:merchant.id,storeName:merchant.storeName,verificationStatus:merchant.verificationStatus},metrics:{products:products.length,stockUnits:products.reduce((s,p)=>s+p.stock,0),lowStock,outOfStock,orders:orders.length,revenue,aov,currency:'EGP'},operations:{processing,shipped},recommendations:[lowStock?'إعادة تخزين المنتجات منخفضة المخزون':'المخزون مستقر',orders.length?'تحليل أفضل المنتجات حسب الإيراد':'ابدأ ببناء أول كتالوج','اختبار عرض واحد على شريحة محددة من العملاء']},{headers:{'Cache-Control':'no-store'}});
}
