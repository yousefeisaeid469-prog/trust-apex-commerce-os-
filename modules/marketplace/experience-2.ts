export type MarketplaceProduct = {
  id: string;
  name: string;
  category: string;
  price: number;
  oldPrice?: number;
  merchant: string;
  rating: number;
  stock: number;
  region: string;
  tags: string[];
};

export type MarketplaceContext = {
  query?: string;
  category?: string;
  maxPrice?: number;
  preferredTags?: string[];
};

export type MarketplaceRank = MarketplaceProduct & {
  match: number;
  reasons: string[];
};

function tokenize(value: string): string[] {
  return value.toLowerCase().split(/[^\p{L}\p{N}]+/u).filter(Boolean);
}

export function rankMarketplaceProducts(products: MarketplaceProduct[], context: MarketplaceContext = {}): MarketplaceRank[] {
  const queryTokens = tokenize(context.query ?? '');
  const preferred = new Set((context.preferredTags ?? []).map(x => x.toLowerCase()));
  return products.map(product => {
    const haystack = tokenize(`${product.name} ${product.category} ${product.tags.join(' ')} ${product.merchant}`);
    const overlap = queryTokens.length ? queryTokens.filter(token => haystack.includes(token)).length / queryTokens.length : 0;
    const tagHit = product.tags.filter(tag => preferred.has(tag.toLowerCase())).length;
    const discount = product.oldPrice && product.oldPrice > product.price ? Math.min(1, (product.oldPrice - product.price) / product.oldPrice) : 0;
    const quality = Math.min(1, Math.max(0, product.rating / 5));
    const availability = product.stock > 0 ? Math.min(1, product.stock / 20) : 0;
    const budget = context.maxPrice == null ? 1 : product.price <= context.maxPrice ? 1 : Math.max(0, 1 - (product.price - context.maxPrice) / Math.max(context.maxPrice, 1));
    const raw = overlap * 0.38 + Math.min(1, tagHit / Math.max(preferred.size, 1)) * 0.16 + quality * 0.18 + availability * 0.10 + discount * 0.08 + budget * 0.10;
    const match = Math.round(Math.max(0, Math.min(99, raw * 100)));
    const reasons: string[] = [];
    if (overlap > 0) reasons.push('مطابقة مباشرة لبحثك');
    if (tagHit > 0) reasons.push('ستايل قريب من تفضيلاتك');
    if (product.rating >= 4.7) reasons.push('تقييم قوي');
    if (discount > 0) reasons.push('يوجد سعر مخفّض معلن');
    if (product.stock > 0) reasons.push('متاح حاليًا');
    if (!reasons.length) reasons.push('ترشيح عام من الكتالوج الحالي');
    return {...product, match, reasons: reasons.slice(0, 3)};
  }).sort((a, b) => b.match - a.match || b.rating - a.rating || a.price - b.price);
}

export function buildMarketplaceFacets(products: MarketplaceProduct[]) {
  const categories = [...new Set(products.map(p => p.category))].sort();
  const regions = [...new Set(products.map(p => p.region))].sort();
  const priceMax = products.reduce((max, p) => Math.max(max, p.price), 0);
  return { categories, regions, priceMin: products.length ? Math.min(...products.map(p => p.price)) : 0, priceMax };
}
