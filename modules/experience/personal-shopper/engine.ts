import { queryCatalog } from '../../commerce/repository/catalog';
import type { Product } from '../../commerce/core/types';

export type ShopperPriority = 'price' | 'quality' | 'delivery' | 'trust' | 'returns';
export type ShopperMission = { query: string; budget?: number; deadline?: 'today' | 'tomorrow' | 'flexible'; priorities?: ShopperPriority[] };
export type ShopperRecommendation = { product: Product; score: number; fit: 'great' | 'good' | 'stretch'; reasons: string[]; tradeoff?: string };
export type PersonalShopperPlan = {
  interpretation: string;
  recommendations: ShopperRecommendation[];
  bundle: Product[];
  compare: Product[];
  nextSteps: string[];
  guardrails: string[];
};

const norm = (s: string) => s.toLowerCase().trim();
const tokens = (s: string) => norm(s).split(/[^\p{L}\p{N}]+/u).filter(Boolean);

function score(product: Product, mission: ShopperMission) {
  const priorities = new Set(mission.priorities ?? []);
  const relevance = tokens(mission.query).filter(t => tokens(`${product.name} ${product.category} ${product.tags.join(' ')} ${product.merchantName} ${product.region}`).some(h => h.includes(t) || t.includes(h))).length;
  let value = relevance * 24 + product.rating * 7;
  const reasons: string[] = [];
  if (relevance) reasons.push('مطابقة مباشرة مع طلبك');
  if (product.rating >= 4.8) { value += 10; reasons.push('تقييم قوي'); }
  if (product.stock > 20) { value += 5; reasons.push('مخزون مريح'); }
  if (product.oldPrice && product.oldPrice > product.price) { value += 8; reasons.push('يوجد خصم معلن'); }
  if (priorities.has('price')) { value += Math.max(0, 18 - product.price / 250); reasons.push('أولوية للسعر'); }
  if (priorities.has('quality')) value += product.rating * 4;
  if (priorities.has('trust')) { value += product.rating >= 4.8 ? 10 : 3; reasons.push('إشارة ثقة من التقييم'); }
  if (priorities.has('delivery') && /cairo|giza|mansoura|dakahlia/i.test(product.region)) { value += 14; reasons.push('موقع توريد محلي'); }
  if (priorities.has('returns')) reasons.push('راجع سياسة الإرجاع قبل الدفع');
  if (mission.deadline === 'today' && /cairo|giza/i.test(product.region)) { value += 12; reasons.push('أولوية للموقع المحلي'); }
  return { value: Math.round(value * 10) / 10, reasons };
}

export async function buildPersonalShopper(mission: ShopperMission, limit = 4): Promise<PersonalShopperPlan> {
  const { items: products } = await queryCatalog({ q: mission.query, limit: 60 });
  const ranked = products.map(product => {
    const s = score(product, mission);
    const fit = mission.budget && product.price > mission.budget ? 'stretch' : product.price <= (mission.budget ?? Infinity) * 0.8 ? 'great' : 'good';
    const tradeoff = fit === 'stretch' ? 'أعلى من الميزانية؛ احتفظ به كخيار بديل فقط.' : undefined;
    return { product, score: s.value, fit, reasons: s.reasons.slice(0, 4), tradeoff } as ShopperRecommendation;
  }).sort((a,b) => b.score - a.score);

  const inBudget = ranked.filter(r => !mission.budget || r.product.price <= mission.budget);
  const recommendations = [...inBudget, ...ranked.filter(r => !inBudget.includes(r))].slice(0, limit);
  const anchor = recommendations[0]?.product;
  const bundle = anchor ? products.filter(p => p.id !== anchor.id)
    .map(p => ({ p, s: p.tags.filter(t => anchor.tags.includes(t)).length * 10 + p.rating }))
    .sort((a,b) => b.s - a.s).slice(0, 2).map(x => x.p) : [];
  const compare = recommendations.slice(0, 3).map(r => r.product);

  return {
    interpretation: `حوّلنا طلبك إلى خطة شراء: ${mission.query}${mission.budget ? ` بحد أقصى ${mission.budget.toLocaleString()} EGP` : ''}. الترتيب هنا مبني على بيانات الكتالوج الحالي والأولويات، وليس على إعلان مدفوع مخفي.`,
    recommendations, bundle, compare,
    nextSteps: ['راجع أسباب الترشيح والـtrade-offs.', 'قارن أفضل 2–3 اختيارات قبل القرار.', 'قبل الدفع نتحقق من السعر والمخزون والتوصيل من المصدر الفعلي.', 'لو لم يناسبك الاختيار الأول، عدّل أولوية واحدة بدل إعادة البحث من الصفر.'],
    guardrails: ['المصدر الأساسي للمنتجات هو trust_products.', 'الأسعار والمخزون والتوصيل ليست وعودًا لحظية حتى تتصل بمصادر تشغيلية مباشرة.', 'لا يتم رفع ترتيب الرعاية/الإعلانات دون disclosure واضح.', 'لا يتم اختلاق confidence أو نتائج بحث بصري غير موصولة بمزود فعلي.', 'القرار النهائي للعميل.'],
  };
}

export function personalShopperSnapshot() {
  return { engine: 'TRUST Personal Shopper', version: 'V119', capabilities: ['mission-to-plan','explainable-ranking','budget-fit','bundle-builder','compare-path','decision-next-steps'], sourceOfTruth: 'trust_products', guardrails: ['source-validated checkout','disclosed sponsorship','no-fabricated-confidence','customer-controlled decision'] };
}
