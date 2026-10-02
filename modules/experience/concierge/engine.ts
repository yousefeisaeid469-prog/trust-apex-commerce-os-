export type ShoppingMission = {
  query: string;
  budget?: number;
  currency?: string;
  deadline?: string;
  priorities?: Array<'price' | 'delivery' | 'quality' | 'authenticity' | 'returns' | 'reviews'>;
};

export type ConciergeRecommendation = {
  title: string;
  category: string;
  estimatedPrice: number;
  score: number;
  reasons: string[];
  confidence: number;
  nextAction: 'COMPARE' | 'VIEW' | 'REFINE';
};

export type ConciergeResponse = {
  interpretation: string;
  recommendations: ConciergeRecommendation[];
  clarifyingQuestions: string[];
  guardrails: string[];
};

function scoreForMission(mission: ShoppingMission, index: number) {
  const priorityBoost = (mission.priorities?.length ?? 0) * 1.2;
  return Math.max(70, Math.min(98, 94 - index * 5 + priorityBoost));
}

export function runShoppingConcierge(mission: ShoppingMission): ConciergeResponse {
  const budgetText = mission.budget ? `${mission.currency ?? 'EGP'} ${mission.budget.toLocaleString()}` : 'بدون سقف محدد';
  const deadlineText = mission.deadline ? ` قبل ${mission.deadline}` : '';
  const base = [
    ['Best Match', 'مطابقة أساسية', 0],
    ['Value Pick', 'قيمة مقابل السعر', 1],
    ['Trust Pick', 'ثقة وأصالة', 2],
  ] as const;

  return {
    interpretation: `فهمت إنك بتدور على: “${mission.query}” بميزانية ${budgetText}${deadlineText}. هنرتب الاختيارات حسب أولوياتك بدل ترتيب مدفوع أو عشوائي.`,
    recommendations: base.map(([title, category, index]) => ({
      title,
      category,
      estimatedPrice: mission.budget ? Math.round(mission.budget * (0.58 + index * 0.11)) : 0,
      score: Math.round(scoreForMission(mission, index)),
      reasons: [
        mission.priorities?.includes('price') ? 'متوافق مع أولوية السعر' : 'مطابقة قوية مع الطلب',
        mission.priorities?.includes('delivery') ? 'أولوية للتوصيل' : 'توازن جيد بين العوامل',
        mission.priorities?.includes('authenticity') ? 'يُفضّل التحقق من الأصالة' : 'سبب الاختيار ظاهر للعميل',
      ],
      confidence: Math.max(62, 91 - index * 9),
      nextAction: index === 0 ? 'VIEW' : index === 1 ? 'COMPARE' : 'REFINE',
    })),
    clarifyingQuestions: [
      'هل الأهم السعر أم الوصول الأسرع؟',
      'هل تقبل بدائل من نفس الفئة لو كانت أفضل قيمة؟',
    ],
    guardrails: [
      'لا يتم ادعاء توفر أو سعر لحظي بدون مصدر بيانات مباشر.',
      'الإعلانات والرعايات يجب أن تكون معلنة بوضوح ولا تتجاوز قواعد الترتيب.',
      'القرار النهائي يظل للعميل؛ النظام يقدم توصيات قابلة للتفسير.',
    ],
  };
}
