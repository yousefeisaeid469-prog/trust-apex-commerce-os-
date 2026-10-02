export type DiscoveryProduct = {
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
  image?: string;
};

export type DiscoveryFilters = {
  category?: string;
  region?: string;
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  inStock?: boolean;
};

export type DiscoveryContext = {
  recentProductIds?: string[];
  wishlistProductIds?: string[];
};

export type DiscoveryQuery = {
  q?: string;
  filters?: DiscoveryFilters;
  context?: DiscoveryContext;
  page?: number;
  limit?: number;
};

export type DiscoveryHit<T = DiscoveryProduct> = {
  product: T;
  score: number;
  reasons: string[];
};

function normalize(value: string): string {
  return value
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[\u064B-\u065F\u0670\u06D6-\u06ED]/g, '')
    .replace(/[إأآٱ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه')
    .replace(/ؤ/g, 'و')
    .replace(/ئ/g, 'ي')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();
}

function tokens(value: string): string[] {
  return normalize(value).split(/\s+/).filter(Boolean);
}

function editDistance(a: string, b: string): number {
  if (a === b) return 0;
  if (!a) return b.length;
  if (!b) return a.length;
  const prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let left = i;
    const current = [i];
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      const value = Math.min(prev[j] + 1, current[j - 1] + 1, prev[j - 1] + cost);
      current.push(value);
      left = value;
    }
    prev.splice(0, prev.length, ...current);
  }
  return prev[b.length];
}

function fuzzyTokenScore(queryToken: string, fieldToken: string): number {
  if (queryToken === fieldToken) return 1;
  if (fieldToken.startsWith(queryToken) || queryToken.startsWith(fieldToken)) return 0.82;
  const max = Math.max(queryToken.length, fieldToken.length);
  if (max < 3) return 0;
  const distance = editDistance(queryToken, fieldToken);
  return distance <= (max >= 7 ? 2 : 1) ? 0.58 : 0;
}

function productFields(product: DiscoveryProduct) {
  return {
    name: normalize(product.name),
    category: normalize(product.category),
    merchant: normalize(product.merchant),
    region: normalize(product.region),
    tags: product.tags.map(normalize).filter(Boolean),
  };
}

function matchesFilters(product: DiscoveryProduct, filters: DiscoveryFilters = {}): boolean {
  if (filters.category && normalize(product.category) !== normalize(filters.category)) return false;
  if (filters.region && normalize(product.region) !== normalize(filters.region)) return false;
  if (filters.minPrice !== undefined && product.price < filters.minPrice) return false;
  if (filters.maxPrice !== undefined && product.price > filters.maxPrice) return false;
  if (filters.minRating !== undefined && product.rating < filters.minRating) return false;
  if (filters.inStock && product.stock <= 0) return false;
  return true;
}

function scoreProduct(product: DiscoveryProduct, q: string, context: DiscoveryContext = {}): DiscoveryHit {
  const fields = productFields(product);
  const query = normalize(q);
  let score = 0;
  const reasons: string[] = [];

  if (query) {
    const queryTokens = tokens(query);
    const nameTokens = tokens(fields.name);
    const categoryTokens = tokens(fields.category);
    const merchantTokens = tokens(fields.merchant);
    const tagTokens = fields.tags.flatMap(tokens);
    let matched = 0;
    let fuzzy = 0;

    if (fields.name === query) { score += 160; reasons.push('exact name match'); }
    else if (fields.name.includes(query)) { score += 105; reasons.push('name match'); }
    if (fields.category === query || fields.category.includes(query)) { score += 48; reasons.push('category match'); }
    if (fields.tags.some(tag => tag === query || tag.includes(query))) { score += 42; reasons.push('tag match'); }
    if (fields.merchant.includes(query)) { score += 25; reasons.push('merchant match'); }

    for (const qt of queryTokens) {
      const candidates = [
        ...nameTokens.map(t => ({ t, weight: 1 })),
        ...categoryTokens.map(t => ({ t, weight: 0.7 })),
        ...tagTokens.map(t => ({ t, weight: 0.78 })),
        ...merchantTokens.map(t => ({ t, weight: 0.35 })),
      ];
      let best = 0;
      for (const candidate of candidates) best = Math.max(best, fuzzyTokenScore(qt, candidate.t) * candidate.weight);
      if (best > 0) { matched++; fuzzy += best; }
    }
    if (matched) score += (matched / Math.max(1, queryTokens.length)) * 70 + fuzzy * 16;
    else return { product, score: -Infinity, reasons: [] };
  } else {
    score += product.rating * 9;
    if (product.stock > 0) score += 18;
    if (product.oldPrice && product.oldPrice > product.price) {
      score += Math.min(22, ((product.oldPrice - product.price) / product.oldPrice) * 30);
      reasons.push('active deal');
    }
  }

  if (product.rating >= 4.5) { score += 14; reasons.push('high rating'); }
  else if (product.rating >= 4) score += 7;
  if (product.stock > 0) score += Math.min(10, Math.log10(product.stock + 1) * 5);

  const recent = new Set(context.recentProductIds ?? []);
  const wishlist = new Set(context.wishlistProductIds ?? []);
  if (recent.has(product.id)) { score += 12; reasons.push('recently viewed'); }
  if (wishlist.has(product.id)) { score += 18; reasons.push('in wishlist'); }

  return { product, score, reasons: reasons.slice(0, 4) };
}

function diversify<T extends DiscoveryProduct>(hits: DiscoveryHit<T>[], limit: number): DiscoveryHit<T>[] {
  const remaining = [...hits];
  const picked: DiscoveryHit<T>[] = [];
  const merchantCounts = new Map<string, number>();
  while (remaining.length && picked.length < limit) {
    let bestIndex = 0;
    let bestAdjusted = -Infinity;
    for (let i = 0; i < remaining.length; i++) {
      const hit = remaining[i];
      const count = merchantCounts.get(hit.product.merchant) ?? 0;
      const penalty = count === 0 ? 0 : count * 18;
      const adjusted = hit.score - penalty;
      if (adjusted > bestAdjusted) { bestAdjusted = adjusted; bestIndex = i; }
    }
    const [hit] = remaining.splice(bestIndex, 1);
    picked.push(hit);
    merchantCounts.set(hit.product.merchant, (merchantCounts.get(hit.product.merchant) ?? 0) + 1);
  }
  return picked;
}

export function discoverProducts(products: DiscoveryProduct[], input: DiscoveryQuery = {}) {
  const page = Math.max(1, Number.isInteger(input.page) ? input.page! : 1);
  const limit = Math.min(60, Math.max(1, Number.isInteger(input.limit) ? input.limit! : 24));
  const filtered = products.filter(p => matchesFilters(p, input.filters));
  const ranked = filtered
    .map(p => scoreProduct(p, input.q ?? '', input.context))
    .filter(hit => Number.isFinite(hit.score))
    .sort((a, b) => b.score - a.score || b.product.rating - a.product.rating || a.product.price - b.product.price);
  const diversified = diversify(ranked, ranked.length);
  const start = (page - 1) * limit;
  const hits = diversified.slice(start, start + limit);
  return { hits, total: diversified.length, page, limit, pages: Math.max(1, Math.ceil(diversified.length / limit)) };
}
