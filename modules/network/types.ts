export type SellerNetworkStatus = 'PENDING' | 'VERIFIED' | 'SUSPENDED';
export type InventoryScope = 'LOCAL' | 'NETWORK';
export type NetworkSeller = { sellerId: string; merchantId: string; displayName: string; country: string; status: SellerNetworkStatus; trustScore: number };
export type InventoryOffer = { offerId: string; sellerId: string; productId: string; quantity: number; currency: string; priceMinor: number; region: string; etaDays?: number; verified: boolean };
export type ReputationEdge = { sellerId: string; dimension: 'FULFILLMENT'|'AUTHENTICITY'|'RETURNS'|'SERVICE'; score: number; sampleSize: number };
export type NetworkCartLine = { productId: string; sellerId: string; quantity: number; unitPriceMinor: number; currency: string };
export type NetworkCart = { cartId: string; lines: NetworkCartLine[]; splitCount: number; currency: string };
export type GlobalQuote = { sellerId: string; productId: string; itemTotalMinor: number; shippingMinor: number; dutiesMinor: number; totalMinor: number; currency: string; etaDays?: number; confidence: 'HIGH'|'MEDIUM'|'LOW' };
