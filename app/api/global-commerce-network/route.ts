import { NextResponse } from 'next/server';
import { query } from '../../../modules/platform/db/postgres';
import { rankNetworkSellers } from '../../../modules/network/engine';
import type { NetworkSeller } from '../../../modules/network/types';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  try {
    const result = await query(
      `select seller_id,merchant_id,country_code,status,trust_score
       from trust_network_sellers
       where status='VERIFIED'
       order by trust_score desc`,
    );
    const sellers: NetworkSeller[] = result.rows.map((r: any) => ({
      sellerId: String(r.seller_id), merchantId: String(r.merchant_id), displayName: String(r.merchant_id),
      country: String(r.country_code), status: r.status, trustScore: Number(r.trust_score),
    }));
    return NextResponse.json({
      surfaceStatus: 'LIVE',
      version: 134,
      sellers: rankNetworkSellers(sellers),
      liveProvidersConnected: false,
      source: 'trust_network_sellers',
    }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (e) {
    const code = e instanceof Error ? e.message : 'GLOBAL_COMMERCE_NETWORK_ERROR';
    const status = code === 'DATABASE_NOT_CONFIGURED' ? 503 : 400;
    return NextResponse.json({ ok:false, surfaceStatus:'ERROR', error:code }, { status });
  }
}
