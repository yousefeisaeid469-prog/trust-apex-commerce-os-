export const amazonParityFeatures = [
  'buy-box-and-offer-ranking', 'subscriptions-and-replenishment', 'deals-coupons-and-vouchers',
  'gift-cards-and-gifting', 'wishlists-and-registry', 'price-alerts-and-price-history',
  'product-qa-and-community', 'personalized-home-and-recommendations', 'one-click-reorder',
  'membership-and-loyalty', 'fast-fulfillment-and-delivery-promises', 'multi-warehouse-fulfillment',
  'merchant-finance-and-settlements', 'seller-performance-and-account-health', 'automated-pricing',
  'sponsored-products-and-brand-ads', 'brand-store-and-rich-content', 'b2b-pricing-and-quantity-discounts',
  'business-accounts-and-approval-workflows', 'purchase-orders-and-invoice-support',
  'global-catalog-and-localization', 'tax-and-compliance-boundaries', 'returns-refunds-and-claims',
  'customer-support-cases', 'product-comparison', 'personalized-reorder', 'fulfillment-by-platform',
  'seller-fulfilled-delivery', 'delivery-tracking-and-promises', 'inventory-forecasting',
  'restock-recommendations', 'review-quality-and-moderation', 'brand-protection', 'affiliate-and-referral',
  'analytics-and-business-reports', 'experimentation-and-ranking', 'omnichannel-inventory',
] as const;

export type AmazonParityFeature = typeof amazonParityFeatures[number];

export function featureMatrix() {
  return amazonParityFeatures.map((id) => ({
    id,
    status: 'foundation',
    productionReady: false,
  }));
}
