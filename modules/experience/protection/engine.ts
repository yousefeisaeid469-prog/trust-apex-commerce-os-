export type ProtectionCheck =
  | 'COUNTERFEIT_RISK'
  | 'SCAM_RISK'
  | 'PRICE_FAIRNESS'
  | 'SELLER_INTEGRITY'
  | 'WARRANTY_GAP'
  | 'RETURN_CLAUSE'
  | 'PAYMENT_SAFETY'
  | 'LISTING_MISMATCH';

export type ProtectionInput = {
  check: ProtectionCheck;
  confidence?: number;
  price?: number;
  referencePrice?: number;
  sellerAgeDays?: number;
  sellerVerified?: boolean;
  warrantyDays?: number;
  returnDays?: number;
  paymentMethod?: 'CARD' | 'COD' | 'WALLET' | 'UNKNOWN';
  listingCompleteness?: number;
};

export type ProtectionFinding = {
  code: string;
  severity: 'INFO' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  title: string;
  explanation: string;
  action: 'SHOW' | 'WARN' | 'BLOCK_CHECKOUT' | 'HUMAN_REVIEW';
  reversible: boolean;
};

export type ProtectionDecision = {
  check: ProtectionCheck;
  score: number;
  confidence: number;
  finding: ProtectionFinding;
  evidenceNeeded: string[];
  customerMessage: string;
  guardrails: string[];
};

const clamp=(n:number,min=0,max=100)=>Math.max(min,Math.min(max,n));
const sev=(n:number):ProtectionFinding['severity']=>n>=90?'CRITICAL':n>=75?'HIGH':n>=55?'MEDIUM':n>=30?'LOW':'INFO';

export function protectPurchase(input: ProtectionInput): ProtectionDecision {
  const confidence=clamp(input.confidence ?? .8,0,1);
  let score=0, finding:ProtectionFinding, evidenceNeeded:string[]=[];
  switch(input.check){
    case 'COUNTERFEIT_RISK':
      score=(input.sellerVerified===false?38:0)+(input.listingCompleteness!==undefined?(100-input.listingCompleteness)*.35:18)+(input.sellerAgeDays!==undefined&&input.sellerAgeDays<30?28:0);
      finding={code:'AUTHENTICITY_REVIEW',severity:sev(score),title:'فحص الأصالة قبل الدفع',explanation:'توجد إشارات تستحق التحقق من البائع، بيانات المنتج أو إثبات المصدر قبل اعتبار العرض آمنًا.',action:score>=75?'HUMAN_REVIEW':'WARN',reversible:true};
      evidenceNeeded=['هوية/توثيق البائع','مصدر المنتج أو إثبات الأصالة','صور ومواصفات كاملة']; break;
    case 'SCAM_RISK':
      score=(input.sellerVerified===false?40:0)+(input.sellerAgeDays!==undefined&&input.sellerAgeDays<14?30:0)+(input.listingCompleteness!==undefined?(100-input.listingCompleteness)*.3:15);
      finding={code:'SCAM_PATTERN_REVIEW',severity:sev(score),title:'فحص نمط الاحتيال',explanation:'نراجع إشارات الحساب والعرض معًا بدل الحكم على البائع من إشارة واحدة.',action:score>=90?'BLOCK_CHECKOUT':score>=70?'HUMAN_REVIEW':'WARN',reversible:true};
      evidenceNeeded=['سجل البائع','بيانات الطلبات/الإلغاءات','وسيلة تواصل وسياسة إرجاع واضحة']; break;
    case 'PRICE_FAIRNESS':
      score=input.price&&input.referencePrice&&input.referencePrice>0?clamp(((input.referencePrice-input.price)/input.referencePrice)*100):20;
      finding={code:'PRICE_FAIRNESS_CHECK',severity:sev(score),title:'فحص عدالة السعر',explanation:'نقارن السعر بمرجع معروف عندما تتوفر بيانات حقيقية، ولا نعرض خصمًا أو ندرة غير مثبتة.',action:score>=90?'HUMAN_REVIEW':'SHOW',reversible:true};
      evidenceNeeded=['سجل أسعار موثوق','تكلفة الشحن/الرسوم إن وجدت']; break;
    case 'SELLER_INTEGRITY':
      score=(input.sellerVerified===false?45:0)+(input.sellerAgeDays!==undefined&&input.sellerAgeDays<60?20:0);
      finding={code:'SELLER_INTEGRITY_CHECK',severity:sev(score),title:'فحص نزاهة البائع',explanation:'تقييم البائع يجب أن يعتمد على مجموعة أدلة قابلة للتدقيق وليس على تقييم واحد.',action:score>=75?'HUMAN_REVIEW':'SHOW',reversible:true};
      evidenceNeeded=['توثيق الهوية التجارية','سجل الشكاوى والمرتجعات','أداء الشحن']; break;
    case 'WARRANTY_GAP':
      score=input.warrantyDays===undefined?45:input.warrantyDays<=0?90:input.warrantyDays<30?65:0;
      finding={code:'WARRANTY_GAP_ALERT',severity:sev(score),title:'فجوة في الضمان',explanation:'نوضح مدة الضمان وما إذا كانت البيانات مؤكدة قبل الشراء.',action:score>=75?'WARN':'SHOW',reversible:true};
      evidenceNeeded=['شروط الضمان الرسمية','الجهة المسؤولة عن الخدمة']; break;
    case 'RETURN_CLAUSE':
      score=input.returnDays===undefined?40:input.returnDays<=0?85:input.returnDays<7?55:0;
      finding={code:'RETURN_CLAUSE_CHECK',severity:sev(score),title:'فحص سياسة الإرجاع',explanation:'نحوّل الشروط المهمة إلى نقاط واضحة قبل الدفع بدل دفنها في نص طويل.',action:score>=75?'WARN':'SHOW',reversible:true};
      evidenceNeeded=['سياسة الإرجاع الحالية','الاستثناءات والرسوم']; break;
    case 'PAYMENT_SAFETY':
      score=input.paymentMethod==='UNKNOWN'?65:input.paymentMethod==='COD'?5:15;
      finding={code:'PAYMENT_SAFETY_CHECK',severity:sev(score),title:'فحص أمان الدفع',explanation:'نُبقي بيانات الدفع الحساسة خارج طبقة التحليل، ونوضح الوسيلة والمخاطر المعروفة فقط.',action:score>=55?'WARN':'SHOW',reversible:true};
      evidenceNeeded=['اسم مزود الدفع','حالة المعاملة من مزود الدفع']; break;
    case 'LISTING_MISMATCH':
      score=input.listingCompleteness!==undefined?clamp((100-input.listingCompleteness)*1.1):35;
      finding={code:'LISTING_MISMATCH_CHECK',severity:sev(score),title:'مطابقة العرض بالمنتج',explanation:'نبحث عن نقص أو تعارض بين العنوان والمواصفات والصور قبل اعتماد القرار.',action:score>=80?'HUMAN_REVIEW':'WARN',reversible:true};
      evidenceNeeded=['المواصفات الأصلية','صور المنتج','الـSKU/الموديل']; break;
  }
  return {check:input.check,score:Math.round(score),confidence,finding,evidenceNeeded,customerMessage:`قبل الدفع، TRUST يوضح مستوى الحماية الحالي وما الدليل الناقص بدل أن يطلب منك الثقة العمياء.`,guardrails:['لا نثبت أن المنتج مقلد أو أن البائع محتال دون أدلة كافية.','لا نعرض خصمًا أو ندرة وهمية.','الإجراءات المالية أو الحظر المؤثر لا تُنفذ من هذا المحرك وحده.','البيانات الحساسة للدفع لا تدخل في التحليل.','كل قرار مؤثر يجب أن يكون قابلًا للتدقيق والمراجعة.']};
}

export function buildProtectionSnapshot(){return {capabilities:['Counterfeit Risk','Scam Detection','Price Fairness','Seller Integrity','Warranty Gap','Return Clause','Payment Safety','Listing Match'],checks:8,liveProvidersConnected:false,automaticFinancialAction:false,humanReviewForMaterialRisk:true,evidenceFirst:true};}
