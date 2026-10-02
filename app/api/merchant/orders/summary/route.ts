import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '../../../../../modules/platform/auth/current-user';
import { getMerchantByUserId } from '../../../../../modules/merchants/core/store';
import { listMerchantOrders } from '../../../../../modules/commerce/merchant-ops/service';
export const dynamic='force-dynamic'; export const runtime='nodejs';
export async function GET(req:NextRequest){const u=await getCurrentUser(req);if(!u)return NextResponse.json({ok:false,error:'AUTH_REQUIRED'},{status:401});const m=await getMerchantByUserId(u.id);if(!m)return NextResponse.json({ok:false,error:'MERCHANT_REQUIRED'},{status:403});const orders=await listMerchantOrders(m.id);const summary=orders.reduce((a,o)=>{a.orders++;a.revenue+=o.total;a.byStatus[o.status]=(a.byStatus[o.status]??0)+1;return a},{orders:0,revenue:0,byStatus:{} as Record<string,number>});return NextResponse.json({ok:true,summary,currency:'EGP'},{headers:{'Cache-Control':'no-store'}});}
