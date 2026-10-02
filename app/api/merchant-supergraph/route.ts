import { NextResponse } from 'next/server';
import { query } from '../../../modules/platform/db/postgres';
import { buildMerchantSupergraph, routeBestOffer } from '../../../modules/network/supergraph';
import type { InventoryOffer, NetworkSeller, ReputationEdge } from '../../../modules/network/types';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const productId = url.searchParams.get('productId') ?? undefined;
    const region = url.searchParams.get('region') ?? undefined;

    const sellersResult = await query(
      `select s.seller_id,s.merchant_id,s.country_code,s.status,s.trust_score,coalesce(m.store_name,'') as display_name
       from trust_network_sellers s
       left join trust_merchant_profiles m on m.id::text=s.merchant_id
       order by s.trust_score desc`,
    );
    const offersResult = await query(
      `select offer_id,seller_id,product_id,quantity,price_minor,currency,region_code,verified
       from trust_network_inventory_offers
       where ($1::text is null or product_id=$1) and ($2::text is null or region_code=$2)
       order by price_minor asc`,
      [productId ?? null, region ?? null],
    );
    const reputationResult = await query(
      `select seller_id,dimension,score,sample_size from trust_network_reputation_edges`,
    );

    const sellers: NetworkSeller[] = sellersResult.rows.map((r: any) => ({
      sellerId: String(r.seller_id), merchantId: String(r.merchant_id), displayName: String(r.display_name || r.merchant_id),
      country: String(r.country_code), status: r.status, trustScore: Number(r.trust_score),
    }));
    const offers: InventoryOffer[] = offersResult.rows.map((r: any) => ({
      offerId: String(r.offer_id), sellerId: String(r.seller_id), productId: String(r.product_id), quantity: Number(r.quantity),
      currency: String(r.currency), priceMinor: Number(r.price_minor), region: String(r.region_code), verified: Boolean(r.verified),
    }));
    const reputation: ReputationEdge[] = reputationResult.rows.map((r: any) => ({
      sellerId: String(r.seller_id), dimension: r.dimension, score: Number(r.score), sampleSize: Number(r.sample_size),
    }));

    const graph = buildMerchantSupergraph({ merchants: sellers, offers, reputation, serviceEdges: [] });
    const routes = productId ? routeBestOffer(graph, { productId, quantity: 1, region }) : [];

    return NextResponse.json({
      surfaceStatus: 'LIVE',
      source: 'trust_network_sellers + trust_network_inventory_offers + trust_network_reputation_edges',
      routes,
      graph: { merchants: graph.merchants.length, offers: graph.offers.length, productEdges: graph.productEdges.length },
      liveProvidersConnected: false,
    }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (e) {
    const code = e instanceof Error ? e.message : 'MERCHANT_SUPERGRAPH_ERROR';
    const status = code === 'DATABASE_NOT_CONFIGURED' ? 503 : 400;
    return NextResponse.json({ ok: false, surfaceStatus: 'ERROR', error: code }, { status });
  }
}
