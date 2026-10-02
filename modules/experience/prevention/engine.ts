export type PreventionSignalType =
  | 'DELIVERY_RISK'
  | 'STOCKOUT_RISK'
  | 'RETURN_RISK'
  | 'PRICE_VOLATILITY'
  | 'SELLER_RISK'
  | 'PAYMENT_FRICTION'
  | 'FIT_RISK'
  | 'CART_ABANDONMENT';

export type PreventionInput = {
  signal: PreventionSignalType;
  confidence?: number;
  severity?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  orderId?: string;
  productId?: string;
  region?: string;
  daysToExpected?: number;
};

export type PreventionIntervention = {
  code: string;
  title: string;
  description: string;
  mode: 'NOTIFY' | 'ASSIST' | 'REQUIRE_CONFIRMATION' | 'HUMAN_REVIEW';
  reversible: boolean;
};

export type PreventionDecision = {
  signal: PreventionInput;
  riskScore: number;
  confidence: number;
  intervention: PreventionIntervention;
  alternatives: PreventionIntervention[];
  customerMessage: string;
  guardrails: string[];
};

const intervention = (
  code: string,
  title: string,
  description: string,
  mode: PreventionIntervention['mode'],
  reversible = true,
): PreventionIntervention => ({ code, title, description, mode, reversible });

const ACTIONS = {
  DELIVERY: intervention('PROACTIVE_DELIVERY_ALERT', 'تنبيه قبل التأخير', 'أبلغ العميل فقط عندما توجد إشارة موثوقة لاحتمال التأخير، مع عرض آخر حالة مؤكدة.', 'NOTIFY'),
  STOCK: intervention('STOCKOUT_PREVENTION', 'منع نفاد المنتج', 'اعرض بدائل مطابقة أو اسمح بحفظ المنتج قبل نفاد المخزون المؤكد.', 'ASSIST'),
  RETURN: intervention('RETURN_RISK_CHECK', 'فحص قبل الشراء', 'اعرض نقاط المقاس/الوصف/التوقعات التي قد تسبب إرجاعًا قبل إتمام الشراء.', 'ASSIST'),
  PRICE: intervention('PRICE_TRANSPARENCY', 'شفافية السعر', 'اعرض سجل السعر أو حالة العرض بوضوح بدل خلق إحساس زائف بالندرة.', 'NOTIFY'),
  SELLER: intervention('SELLER_TRUST_HOLD', 'حاجز ثقة للبائع', 'قلل التعرض أو اطلب مراجعة بشرية عندما تتراكم إشارات موثوقة على خطر البائع.', 'HUMAN_REVIEW', false),
  PAYMENT: intervention('PAYMENT_FRICTION_ASSIST', 'مساعدة الدفع', 'اقترح خطوة آمنة لإكمال الدفع أو وسيلة بديلة دون إعادة المحاولة بلا حدود.', 'ASSIST'),
  FIT: intervention('FIT_PRECHECK', 'فحص المقاس قبل الشراء', 'اطلب معلومات ناقصة وقدم توصية تقديرية مع إبقاء جدول المقاس هو المرجع.', 'REQUIRE_CONFIRMATION'),
  CART: intervention('CART_RECOVERY_HELP', 'مساعدة السلة', 'اعرض السلة المحفوظة وخيارات واضحة للعودة بدل الضغط أو التضليل.', 'NOTIFY'),
} as const;

export function preventProblem(input: PreventionInput): PreventionDecision {
  const base = Math.max(0, Math.min(100, Math.round((input.confidence ?? 0.72) * 100)));
  const severityBoost = input.severity === 'CRITICAL' ? 20 : input.severity === 'HIGH' ? 12 : input.severity === 'MEDIUM' ? 6 : 0;
  const riskScore = Math.min(100, Math.max(0, base * 0.72 + severityBoost));
  const confidence = Math.max(0, Math.min(1, input.confidence ?? 0.72));

  switch (input.signal) {
    case 'DELIVERY_RISK': return decision(input, riskScore, confidence, ACTIONS.DELIVERY, [ACTIONS.CART], 'قد يكون هناك خطر تأخير. سننبهك فقط إذا ظهرت إشارة مؤكدة من مصدر لوجستي متصل.', ['لا نعرض موعدًا جديدًا غير مؤكد.', 'التنبيه لا يساوي إثباتًا أن الشحنة ستتأخر.']);
    case 'STOCKOUT_RISK': return decision(input, riskScore, confidence, ACTIONS.STOCK, [ACTIONS.FIT], 'المخزون قد يصبح محدودًا. سنقترح بديلًا أو حفظًا للمنتج بدل دفعك لشراء غير ضروري.', ['لا ندّعي أن المخزون سينفد دون بيانات مخزون حقيقية.', 'لا يتم إنشاء طلب تلقائيًا.']);
    case 'RETURN_RISK': return decision(input, riskScore, confidence, ACTIONS.RETURN, [ACTIONS.FIT], 'هناك عوامل قد تزيد احتمال الإرجاع. راجع المواصفات والمقاس قبل الدفع لتقليل المفاجآت.', ['هذا تقدير احتمالي وليس حكمًا على العميل أو المنتج.']);
    case 'PRICE_VOLATILITY': return decision(input, riskScore, confidence, ACTIONS.PRICE, [ACTIONS.CART], 'السعر قد يتغير. نعرض السعر الحالي بوضوح ونستخدم Price Watch بدل ضغط مصطنع.', ['لا نستخدم عدادًا زائفًا أو ندعي ندرة غير مثبتة.', 'أي تعويض مالي يحتاج سياسة وأهلية واضحة.']);
    case 'SELLER_RISK': return decision(input, riskScore, confidence, ACTIONS.SELLER, [ACTIONS.CART], 'تم رصد إشارة ثقة تحتاج مراجعة. لن نخفيها ولن نصدر حكمًا نهائيًا قبل الأدلة.', ['لا يتم حظر البائع من إشارة واحدة.', 'القرار المؤثر يحتاج Audit Trail ومراجعة بشرية.']);
    case 'PAYMENT_FRICTION': return decision(input, riskScore, confidence, ACTIONS.PAYMENT, [ACTIONS.CART], 'يبدو أن إتمام الدفع قد يواجه احتكاكًا. سنقترح خطوة واحدة آمنة بدل تكرار المحاولة بلا حدود.', ['لا نعيد خصم المبلغ تلقائيًا.', 'لا نطلب بيانات دفع حساسة داخل طبقة التشخيص.']);
    case 'FIT_RISK': return decision(input, riskScore, confidence, ACTIONS.FIT, [ACTIONS.RETURN], 'قبل الشراء، أكمل بيانات المقاس والمواصفات للحصول على توصية تقديرية.', ['التوصية ليست ضمانًا للملاءمة.', 'جدول المنتج وسياسة الإرجاع هما المرجع النهائي.']);
    case 'CART_ABANDONMENT': return decision(input, riskScore, confidence, ACTIONS.CART, [ACTIONS.PRICE], 'السلة محفوظة. لو رجعت، سنكمل من حيث توقفت بدون ضغط أو رسائل مضللة.', ['لا نرسل رسائل تسويقية دون موافقة مناسبة.', 'لا نخلق خصمًا وهميًا لاستعادة السلة.']);
  }
}

function decision(
  signal: PreventionInput,
  riskScore: number,
  confidence: number,
  intervention: PreventionIntervention,
  alternatives: PreventionIntervention[],
  customerMessage: string,
  guardrails: string[],
): PreventionDecision {
  return { signal, riskScore: Math.round(riskScore), confidence, intervention, alternatives, customerMessage, guardrails };
}

export function buildPreventionSnapshot() {
  return {
    principles: ['Prevent before rescue', 'Only act on evidence', 'Prefer reversible interventions', 'No dark patterns', 'Human review for material trust decisions'],
    signalTypes: 8,
    liveProvidersConnected: false,
    supportedInterventions: Object.values(ACTIONS).map(x => x.code),
  };
}
