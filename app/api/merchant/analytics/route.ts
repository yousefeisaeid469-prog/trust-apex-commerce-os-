import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '../../../../modules/platform/auth/current-user';
import { getMerchantByUserId } from '../../../../modules/merchants/core/store';
import { listMerchantProducts } from '../../../../modules/commerce/repository/catalog';
import { listMerchantOrders } from '../../../../modules/commerce/merchant-ops/service';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const user = await getCurrentUser(request);
  if (!user) return NextResponse.json({ ok:false, error:'AUTH_REQUIRED' }, { status:401, headers:{'Cache-Control':'no-store'} });
  const merchant = await getMerchantByUserId(user.id);
  if (!merchant) return NextResponse.json({ ok:false, error:'MERCHANT_REQUIRED' }, { status:403, headers:{'Cache-Control':'no-store'} });

  const products = await listMerchantProducts(merchant.id);
  const orders = await listMerchantOrders(merchant.id);
  const revenue = orders.reduce((sum, order) => {
    const merchantProductIds = new Set(products.map((p) => p.id));
    const merchantItems = order.items.filter((item) => merchantProductIds.has(item.productId));
    return sum + merchantItems.reduce((s, item) => {
      const product = products.find((p) => p.id === item.productId);
      return s + (product?.price ?? 0) * item.qty;
    }, 0);
  }, 0);
  const lowStock = products.filter((p) => p.stock > 0 && p.stock <= 10).length;
  const outOfStock = products.filter((p) => p.stock === 0).length;
  const statusCounts = orders.reduce<Record<string, number>>((acc, order) => { acc[order.status] = (acc[order.status] ?? 0) + 1; return acc; }, {});

  return NextResponse.json({ ok:true, metrics:{ products:products.length, stockUnits:products.reduce((s,p)=>s+p.stock,0), lowStock, outOfStock, orders:orders.length, revenue, currency:'EGP' }, statusCounts }, { headers:{'Cache-Control':'no-store'} });
}
