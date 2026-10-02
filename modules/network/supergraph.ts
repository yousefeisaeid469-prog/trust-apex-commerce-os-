import type { InventoryOffer, NetworkSeller, ReputationEdge } from './types';

export type MerchantNode = NetworkSeller & { categories?: string[]; fulfillmentScore?: number };
export type ProductEdge = { productId: string; sellerId: string; offerId: string; relation: 'OFFERS'|'FULFILLS'; weight?: number };
export type ServiceEdge = { sellerId: string; region: string; etaDays?: number; available: boolean };
export type MerchantSupergraph = { merchants: MerchantNode[]; offers: InventoryOffer[]; reputation: ReputationEdge[]; productEdges: ProductEdge[]; serviceEdges: ServiceEdge[] };

export type RoutingConstraints = { productId: string; quantity: number; region?: string; currency?: string; maxEtaDays?: number };
export type RoutedOffer = { offer: InventoryOffer; seller: MerchantNode; score: number; reasons: string[] };

export function buildMerchantSupergraph(input: Omit<MerchantSupergraph, 'productEdges'>): MerchantSupergraph {
  const productEdges = input.offers.map(o => ({ productId:o.productId, sellerId:o.sellerId, offerId:o.offerId, relation:'OFFERS' as const }));
  return { ...input, productEdges };
}

export function routeBestOffer(graph: MerchantSupergraph, constraints: RoutingConstraints): RoutedOffer[] {
  const reputation = new Map<string, ReputationEdge[]>();
  for (const edge of graph.reputation) reputation.set(edge.sellerId, [...(reputation.get(edge.sellerId) ?? []), edge]);
  const sellers = new Map(graph.merchants.map(s => [s.sellerId, s]));
  return graph.offers.filter(o => o.productId === constraints.productId && o.quantity >= constraints.quantity && o.verified)
    .filter(o => !constraints.currency || o.currency === constraints.currency)
    .filter(o => !constraints.region || o.region === constraints.region)
    .map(o => {
      const seller = sellers.get(o.sellerId);
      if (!seller || seller.status !== 'VERIFIED') return undefined;
      const service = graph.serviceEdges.find(x => x.sellerId === o.sellerId && (!constraints.region || x.region === constraints.region) && x.available);
      if (constraints.maxEtaDays !== undefined && service?.etaDays !== undefined && service.etaDays > constraints.maxEtaDays) return undefined;
      const edges = reputation.get(o.sellerId) ?? [];
      const reputationScore = edges.length ? edges.reduce((s,e)=>s+e.score,0)/edges.length : seller.trustScore;
      const priceScore = 100 - Math.min(100, o.priceMinor / 100);
      const etaScore = service?.etaDays === undefined ? 50 : Math.max(0, 100 - service.etaDays * 8);
      const score = Math.round((seller.trustScore * .35) + (reputationScore * .25) + (priceScore * .20) + (etaScore * .20));
      const reasons = [`TRUST seller ${seller.trustScore}/100`, `reputation ${Math.round(reputationScore)}/100`, `price signal ${Math.round(priceScore)}/100`];
      if (service?.etaDays !== undefined) reasons.push(`service ETA ${service.etaDays}d`); else reasons.push('ETA unverified');
      return { offer:o, seller, score, reasons };
    }).filter(Boolean) as RoutedOffer[];
}
