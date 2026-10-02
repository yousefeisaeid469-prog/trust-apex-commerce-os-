import type { GlobalQuote, InventoryOffer, NetworkCart, NetworkSeller, ReputationEdge } from './types';

export function rankNetworkSellers(sellers: NetworkSeller[]): NetworkSeller[] {
  return [...sellers].filter(s => s.status === 'VERIFIED').sort((a,b) => b.trustScore - a.trustScore);
}

export function buildUniversalCart(cartId: string, lines: NetworkCart['lines']): NetworkCart {
  const currencies = new Set(lines.map(l => l.currency));
  if (currencies.size > 1) throw new Error('CART_CURRENCY_MIX_REQUIRES_FX_BOUNDARY');
  const sellers = new Set(lines.map(l => l.sellerId));
  return { cartId, lines, splitCount: sellers.size, currency: lines[0]?.currency ?? 'EGP' };
}

export function quoteCrossBorder(offer: InventoryOffer, shippingMinor: number, dutiesMinor = 0): GlobalQuote {
  if (!offer.verified || offer.quantity <= 0) throw new Error('OFFER_NOT_PURCHASABLE');
  const itemTotalMinor = offer.priceMinor;
  const totalMinor = itemTotalMinor + shippingMinor + dutiesMinor;
  return { sellerId: offer.sellerId, productId: offer.productId, itemTotalMinor, shippingMinor, dutiesMinor, totalMinor, currency: offer.currency, etaDays: offer.etaDays, confidence: offer.etaDays === undefined ? 'LOW' : 'MEDIUM' };
}

export function reputationGraph(edges: ReputationEdge[]) {
  const bySeller = new Map<string, ReputationEdge[]>();
  for (const edge of edges) bySeller.set(edge.sellerId, [...(bySeller.get(edge.sellerId) ?? []), edge]);
  return [...bySeller.entries()].map(([sellerId, items]) => ({ sellerId, score: Math.round(items.reduce((sum, x) => sum + x.score, 0) / Math.max(items.length,1)), dimensions: items.length }));
}
