import type { AiAction, AiExperienceSnapshot, AiSignal } from './contracts';

export type AiExperienceInput = {
  mission?: string;
  budget?: number;
  priorities?: string[];
  catalogSize?: number;
  inStockCount?: number;
  activeOrders?: number;
  merchantHealth?: number;
};

function confidence(value:number){ return Math.max(0, Math.min(100, Math.round(value))); }

export function buildAiExperience(input:AiExperienceInput = {}):AiExperienceSnapshot {
  const signals:AiSignal[] = [];
  if (input.mission?.trim()) signals.push({id:'mission',label:'Shopping mission',value:input.mission.trim(),confidence:94,source:'user-input',domain:'shopping'});
  if (typeof input.budget==='number' && Number.isFinite(input.budget)) signals.push({id:'budget',label:'Budget boundary',value:input.budget,confidence:100,source:'user-input',domain:'shopping'});
  if (typeof input.catalogSize==='number') signals.push({id:'catalog',label:'Catalog size',value:input.catalogSize,confidence:100,source:'catalog',domain:'merchant'});
  if (typeof input.inStockCount==='number') signals.push({id:'availability',label:'Available products',value:input.inStockCount,confidence:100,source:'catalog',domain:'shopping'});
  if (typeof input.activeOrders==='number') signals.push({id:'active-orders',label:'Active orders',value:input.activeOrders,confidence:100,source:'orders',domain:'customer'});
  if (typeof input.merchantHealth==='number') signals.push({id:'merchant-health',label:'Merchant health',value:input.merchantHealth,confidence:100,source:'merchant-os',domain:'merchant'});

  const actions:AiAction[] = [];
  if (input.mission?.trim()) actions.push({id:'refine-mission',title:'تحسين مهمة الشراء',rationale:'تحويل وصف العميل إلى معايير قابلة للترتيب والمقارنة.',confidence:confidence(92),risk:'LOW',requiresApproval:false,target:'/concierge'});
  if (typeof input.budget==='number') actions.push({id:'compare-value',title:'مقارنة أفضل قيمة داخل الميزانية',rationale:'استخدام الميزانية كحد واضح بدل افتراض قدرة شرائية غير معروفة.',confidence:confidence(90),risk:'LOW',requiresApproval:false,target:'/discovery'});
  actions.push({id:'explain-decision',title:'عرض أسباب التوصية',rationale:'كل قرار يجب أن يوضح الإشارات التي أثرت في النتيجة وحدود المعرفة.',confidence:96,risk:'LOW',requiresApproval:false,target:'/intelligence-brain'});
  if ((input.activeOrders ?? 0) > 0) actions.push({id:'protect-purchase',title:'مراجعة ما بعد الشراء',rationale:'وجود طلبات نشطة يجعل Purchase Guardian سطحًا مفيدًا للمراجعة.',confidence:88,risk:'LOW',requiresApproval:false,target:'/purchase-guardian'});

  return {
    version:'2.0', mode:'DECISION_SUPPORT', signals, actions:actions.slice(0,4),
    guardrails:[
      'لا يتم تنفيذ دفع أو استرداد أو تغيير مالي من طبقة AI Experience.',
      'التوصيات قابلة للتفسير ولا تدّعي بيانات لحظية بدون مصدر مباشر.',
      'الإجراءات الحساسة تحتاج Approval Gate وExecution Boundary منفصلين.',
    ],
    unavailable:[
      'Live provider availability غير متاحة بدون adapter وcredentials حقيقية.',
      'لا يتم اختراع أسعار أو مخزون أو أداء تجاري لحظي.',
    ],
  };
}
