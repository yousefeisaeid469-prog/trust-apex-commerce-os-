import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '../../../../modules/platform/auth/current-user';
import { getMerchantByUserId } from '../../../../modules/merchants/core/store';
import { listMerchantProducts } from '../../../../modules/commerce/repository/catalog';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const user = await getCurrentUser(request);
  if (!user) return NextResponse.json({ok:false,error:'AUTH_REQUIRED'},{status:401});
  const merchant = await getMerchantByUserId(user.id);
  if (!merchant) return NextResponse.json({ok:false,error:'MERCHANT_REQUIRED'},{status:403});
  const products = await listMerchantProducts(merchant.id);
  const stockUnits = products.reduce((sum,p)=>sum+p.stock,0);
  const lowStock = products.filter(p=>p.stock>0 && p.stock<=10).length;
  return NextResponse.json({
    ok:true, merchant,
    metrics:{catalogProducts:products.length,stockUnits,lowStock},
    governance:{consentAware:true,approvalGates:true,auditability:true,tenantIsolation:true}
  },{headers:{'Cache-Control':'no-store'}});
}
