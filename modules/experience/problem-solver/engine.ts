export type ProblemType =
  | 'DELIVERY_LATE' | 'WRONG_ITEM' | 'DAMAGED_ITEM' | 'MISSING_ITEM'
  | 'PRICE_DROP' | 'SELLER_CONCERN' | 'RETURN_REQUEST' | 'PRODUCT_FIT';

export type ProblemInput = {
  type: ProblemType;
  orderId?: string;
  productId?: string;
  amountMinor?: number;
  currency?: string;
  daysLate?: number;
  evidence?: boolean;
  priority?: 'LOW' | 'NORMAL' | 'HIGH';
};

export type ResolutionAction = {
  code: string;
  title: string;
  description: string;
  automation: 'SELF_SERVICE' | 'ASSISTED' | 'HUMAN_REVIEW';
  requiresEvidence: boolean;
};

export type ProblemResolution = {
  problem: ProblemInput;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  recommendedAction: ResolutionAction;
  fallbackActions: ResolutionAction[];
  customerMessage: string;
  guardrails: string[];
};

const action = (code:string,title:string,description:string,automation:ResolutionAction['automation'],requiresEvidence=false):ResolutionAction => ({code,title,description,automation,requiresEvidence});

const ACTIONS = {
  TRACK: action('TRACK_ORDER','تتبع الطلب','اعرض آخر حالة مؤكدة وموعد التسليم المتوقع بدون اختراع بيانات.','SELF_SERVICE'),
  DELIVERY_RESCUE: action('DELIVERY_RESCUE','إنقاذ التوصيل','افتح مسار تصعيد للوجستيات مع الحفاظ على وعد العميل المعلن.','ASSISTED'),
  RETURN: action('RETURN','إرجاع ذكي','ابدأ طلب إرجاع وحدد السبب والخطوة التالية بوضوح.','SELF_SERVICE'),
  REFUND_REVIEW: action('REFUND_REVIEW','مراجعة استرداد','جهّز مطالبة قابلة للتدقيق قبل أي استرداد مالي.','HUMAN_REVIEW',true),
  PRICE_CLAIM: action('PRICE_CLAIM','Price Shield','تحقق من تغير السعر وفق سياسة الحماية قبل إصدار أي رصيد.','HUMAN_REVIEW'),
  SELLER_REVIEW: action('SELLER_REVIEW','فحص البائع','افتح مراجعة للثقة والأدلة وسجل القرار في Audit Trail.','HUMAN_REVIEW',true),
  FIT_HELP: action('FIT_HELP','مساعدة المقاس','حوّل بيانات المنتج والمقاس إلى توصية تقديرية مع تحذير واضح.','ASSISTED'),
};

export function resolveProblem(input: ProblemInput): ProblemResolution {
  const severity = input.type === 'MISSING_ITEM' || input.type === 'DAMAGED_ITEM' || input.type === 'SELLER_CONCERN' ? 'HIGH'
    : input.type === 'DELIVERY_LATE' && (input.daysLate ?? 0) >= 3 ? 'HIGH'
    : input.priority === 'HIGH' ? 'HIGH' : input.type === 'PRICE_DROP' || input.type === 'PRODUCT_FIT' ? 'LOW' : 'MEDIUM';

  switch (input.type) {
    case 'DELIVERY_LATE': return result(input,severity,ACTIONS.DELIVERY_RESCUE,[ACTIONS.TRACK,ACTIONS.RETURN],`طلبك متأخر ${input.daysLate ?? 0} يوم. TRUST يقترح تصعيد التوصيل بدل تركك تبحث بنفسك.`,['لا نعد بموعد جديد قبل وصول إشارة لوجستية مؤكدة.']);
    case 'WRONG_ITEM': return result(input,severity,ACTIONS.RETURN,[ACTIONS.REFUND_REVIEW], 'وصل منتج غير مطابق؟ ارفع صورة/دليل واحد، ثم نحدد الإرجاع أو الاسترداد المناسب.', ['لا يتم استرداد مالي تلقائي بدون تحقق من الحالة والسياسة.']);
    case 'DAMAGED_ITEM': return result(input,severity,ACTIONS.REFUND_REVIEW,[ACTIONS.RETURN], 'المنتج وصل تالفًا. أرسل دليل الحالة ليتم تجهيز مطالبة قابلة للمراجعة.', ['الاسترداد النهائي يخضع للتحقق من الدليل وسياسة الطلب.']);
    case 'MISSING_ITEM': return result(input,severity,ACTIONS.REFUND_REVIEW,[ACTIONS.SELLER_REVIEW], 'هناك قطعة ناقصة. سنطابق محتويات الشحنة مع الطلب وسجل التجهيز قبل اتخاذ قرار مالي.', ['لا يتم افتراض أن القطعة فُقدت من البائع قبل مطابقة سجل الشحنة.']);
    case 'PRICE_DROP': return result(input,severity,ACTIONS.PRICE_CLAIM,[ACTIONS.TRACK], 'انخفض السعر؟ TRUST يفحص الأهلية ضمن Price Shield بدل إعطاء وعد غير مؤكد.', ['أي رصيد مالي يجب أن يمر عبر سياسة واضحة وتدقيق.']);
    case 'SELLER_CONCERN': return result(input,severity,ACTIONS.SELLER_REVIEW,[ACTIONS.RETURN], 'لاحظت مشكلة في البائع؟ افتح بلاغًا بالأدلة وسيتم تصعيده إلى Trust & Risk.', ['لا نحكم على البائع من بلاغ واحد بدون أدلة وسياق.']);
    case 'RETURN_REQUEST': return result(input,severity,ACTIONS.RETURN,[ACTIONS.REFUND_REVIEW], 'ابدأ الإرجاع من سبب واضح وخطوة واحدة في كل مرة.', ['الأهلية النهائية تعتمد على سياسة المنتج والطلب.']);
    case 'PRODUCT_FIT': return result(input,severity,ACTIONS.FIT_HELP,[ACTIONS.RETURN], 'لا نريد أن تشتري وتندم. استخدم بيانات المقاس/المنتج للحصول على توصية تقديرية قبل الدفع.', ['التوصية ليست ضمانًا للمقاس؛ جدول المنتج يظل المرجع النهائي.']);
  }
}

function result(problem:ProblemInput,severity:ProblemResolution['severity'],recommendedAction:ResolutionAction,fallbackActions:ResolutionAction[],customerMessage:string,guardrails:string[]):ProblemResolution { return {problem,severity,recommendedAction,fallbackActions,customerMessage,guardrails}; }

export function buildProblemSnapshot() {
  return {
    principles: ['Solve before selling','One clear next step','Evidence before irreversible money action','Human escalation when confidence is low','No fabricated status'],
    problemTypes: 8,
    liveProvidersConnected: false,
    supportedActions: Object.values(ACTIONS).map(x => x.code),
  };
}
