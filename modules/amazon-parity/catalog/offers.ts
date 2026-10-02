export type Offer = { id: string; productId: string; merchantId: string; priceCents: number; shippingCents: number; stock: number; handlingDays: number; sellerScore: number };
export function rankOffers(offers: Offer[]) {
  return [...offers].sort((a,b) => ((b.sellerScore * 0.35) + (b.stock > 0 ? 25 : 0) + (1 / Math.max(1,b.handlingDays)) * 20) - ((a.sellerScore * 0.35) + (a.stock > 0 ? 25 : 0) + (1 / Math.max(1,a.handlingDays)) * 20) || (a.priceCents+a.shippingCents)-(b.priceCents+b.shippingCents));
}
