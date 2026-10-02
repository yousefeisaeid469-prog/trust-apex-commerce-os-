export type MemorySignal = 'PREFERENCE' | 'PURCHASE' | 'WARRANTY' | 'REFILL' | 'FAMILY' | 'DEADLINE';
export type Mission = 'REPLENISH' | 'WARRANTY_CHECK' | 'FAMILY_BUY' | 'DEADLINE_BUY' | 'PREFERENCE_MATCH';
export type LifeInput = { mission: Mission; customerId?: string; productId?: string; daysUntilDeadline?: number; confidence?: number; quantity?: number };
export type LifeAction = { code: string; title: string; description: string; mode: 'SUGGEST' | 'CONFIRM' | 'HUMAN_REVIEW'; reversible: boolean };
export type LifePlan = { mission: Mission; priority: number; confidence: number; memoryUsed: string[]; action: LifeAction; alternatives: LifeAction[]; reasons: string[]; guardrails: string[] };

const A = {
  refill: { code:'REFILL_REMINDER', title:'ذكّرك قبل ما تخلص', description:'استخدم تاريخ الشراء والكمية المقدّرة لاقتراح إعادة شراء، بدون إنشاء طلب تلقائي.', mode:'SUGGEST', reversible:true } as LifeAction,
  warranty: { code:'WARRANTY_CHECK', title:'راجع الضمان قبل ما تدفع', description:'افحص أهلية الضمان/الصيانة إذا كانت بيانات المنتج والشراء متاحة.', mode:'SUGGEST', reversible:true } as LifeAction,
  family: { code:'FAMILY_CONFIRMATION', title:'شراء عائلي بموافقة', description:'جهّز خيارات مناسبة للميزانية والأولوية ثم اطلب تأكيد صاحب الحساب.', mode:'CONFIRM', reversible:true } as LifeAction,
  deadline: { code:'DEADLINE_SAFE_PLAN', title:'خطة شراء للموعد', description:'رتّب الخيارات حسب الموعد المطلوب مع عدم اختراع موعد توصيل غير مؤكد.', mode:'CONFIRM', reversible:true } as LifeAction,
  preference: { code:'MEMORY_MATCH', title:'استخدم تفضيلاتك', description:'طابق الخيارات مع تفضيلات محفوظة فقط إذا كان المستخدم قد سمح بالتخصيص.', mode:'SUGGEST', reversible:true } as LifeAction,
} as const;

export function buildLifePlan(input: LifeInput): LifePlan {
  const confidence = Math.max(0, Math.min(1, input.confidence ?? .8));
  const memoryUsed = input.mission === 'REPLENISH' ? ['purchase cadence','quantity preference'] : input.mission === 'WARRANTY_CHECK' ? ['purchase record','warranty metadata'] : input.mission === 'FAMILY_BUY' ? ['family role','budget preference'] : input.mission === 'DEADLINE_BUY' ? ['deadline','delivery constraints'] : ['saved preferences','past purchases'];
  const priority = input.mission === 'DEADLINE_BUY' ? 95 : input.mission === 'WARRANTY_CHECK' ? 88 : input.mission === 'REPLENISH' ? 80 : 72;
  const map = { REPLENISH:A.refill, WARRANTY_CHECK:A.warranty, FAMILY_BUY:A.family, DEADLINE_BUY:A.deadline, PREFERENCE_MATCH:A.preference };
  const action = map[input.mission];
  const reasons = input.mission === 'DEADLINE_BUY' && (input.daysUntilDeadline ?? 99) <= 2 ? ['الموعد قريب؛ الأولوية لتقليل مخاطر التأخير.'] : ['القرار مبني على إشارات قابلة للتفسير بدل افتراضات مخفية.'];
  return { mission:input.mission, priority, confidence, memoryUsed, action, alternatives:[A.preference, A.family].filter(x=>x.code!==action.code), reasons, guardrails:['لا يتم الشراء تلقائيًا.','لا نستخدم بيانات حساسة غير لازمة.','يمكن إيقاف التخصيص ومحو الذاكرة المسموح بها.','الموعد والأسعار والشروط الحقيقية تأتي من مزودين متصلين فقط.'] };
}

export function buildLifeSnapshot() { return { capabilities:['Commerce Memory','Warranty Intelligence','Refill Planning','Family Shopping','Deadline Buying','Preference Matching'], liveProvidersConnected:false, autonomousPurchasing:false, privacyByDefault:true }; }
