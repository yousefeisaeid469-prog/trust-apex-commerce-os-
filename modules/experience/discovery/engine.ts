import { queryCatalog } from '../../commerce/repository/catalog';
import type { Product } from '../../commerce/core/types';

export type DiscoveryIntent = 'best-value' | 'fastest' | 'highest-rated' | 'style' | 'mission';
export type DiscoverySignal = { type: string; label: string; weight: number; reason: string };
export type DiscoveryResult = { product: Product; score: number; reasons: string[] };

export type ShoppingMission = {
  query: string;
  budget?: number;
  deadline?: 'today' | 'tomorrow' | 'flexible';
  priority?: 'price' | 'speed' | 'quality' | 'trust';
};

const normalize = (value: string) => value.toLowerCase().trim();
const tokens = (value: string) => normalize(value).split(/[^\p{L}\p{N}]+/u).filter(Boolean);

export async function discover(query: string, intent: DiscoveryIntent = 'mission', limit = 8): Promise<DiscoveryResult[]> {
  const q = tokens(query);
  const { items: products } = await queryCatalog({ q: query, limit: Math.max(limit, 60) });
  return products.map((product) => {
    const haystack = tokens(`${product.name} ${product.category} ${product.tags.join(' ')} ${product.merchantName} ${product.region}`);
    const overlap = q.filter((token) => haystack.some((item) => item.includes(token) || token.includes(item))).length;
    let score = overlap * 20 + product.rating * 8;
    const reasons: string[] = [];
    if (overlap) reasons.push(`مطابقة قوية مع: ${q.slice(0, 3).join('، ')}`);
    if (product.rating >= 4.7) { score += 12; reasons.push('تقييم مرتفع'); }
    if (product.stock > 20) { score += 4; reasons.push('مخزون مريح'); }
    if (product.oldPrice && product.oldPrice > product.price) { score += 8; reasons.push('سعر مخفّض'); }
    if (intent === 'best-value' && product.oldPrice) score += 16;
    if (intent === 'fastest' && /cairo|giza|delta/i.test(product.region)) { score += 18; reasons.push('إشارة لتوريد محلي'); }
    if (intent === 'highest-rated') score += product.rating * 10;
    if (intent === 'style' && product.tags.some((tag) => ['night', 'black', 'dark', 'utility'].includes(tag))) { score += 18; reasons.push('متوافق مع الستايل'); }
    return { product, score: Math.round(score * 10) / 10, reasons: reasons.slice(0, 4) };
  }).sort((a, b) => b.score - a.score).slice(0, limit);
}

export async function missionSearch(mission: ShoppingMission, limit = 6): Promise<DiscoveryResult[]> {
  let results = await discover(mission.query, mission.priority === 'quality' ? 'highest-rated' : mission.priority === 'price' ? 'best-value' : mission.priority === 'speed' ? 'fastest' : 'mission', 20);
  const budget = mission.budget;
  if (budget !== undefined && budget > 0) {
    results = results.filter((r) => r.product.price <= budget).concat(results.filter((r) => r.product.price > budget).slice(0, 3));
    results = results.map((r) => r.product.price <= budget ? { ...r, score: r.score + 22, reasons: [...r.reasons, 'داخل الميزانية'] } : r);
  }
  if (mission.deadline === 'today') results = results.map((r) => ({ ...r, score: r.score + (/cairo|giza/i.test(r.product.region) ? 20 : 0), reasons: [...r.reasons, 'أولوية لمخزون محلي'] }));
  return results.sort((a, b) => b.score - a.score).slice(0, limit);
}

export async function buildBundle(seed: Product, limit = 3): Promise<Product[]> {
  const { items } = await queryCatalog({ category: seed.category, limit: 60 });
  const seedTags = new Set(seed.tags);
  return items.filter((p) => p.id !== seed.id)
    .map((p) => ({ p, score: p.tags.filter((t) => seedTags.has(t)).length * 10 + p.rating }))
    .sort((a, b) => b.score - a.score).slice(0, limit).map((x) => x.p);
}

export async function compareProducts(ids: string[]): Promise<Product[]> {
  const { items } = await queryCatalog({ limit: 60 });
  return items.filter((p) => ids.includes(p.id)).slice(0, 4);
}

export function discoverySnapshot() {
  return {
    engine: 'TRUST Discovery Revolution', version: 'V117',
    capabilities: ['mission-search', 'reasoned-ranking', 'smart-bundles', 'compare-anywhere', 'visual-search-boundary', 'deal-intelligence', 'personal-feed'],
    sourceOfTruth: 'trust_products',
    guardrails: ['no fabricated AI confidence', 'no hidden sponsored ranking', 'budget is advisory until checkout validation', 'visual search uses explicit provider boundary'],
  };
}
