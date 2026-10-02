import type { IntelligenceSnapshot, Recommendation, Scenario, Signal } from './types';

const now = new Date().toISOString();

export function buildSnapshot(): IntelligenceSnapshot {
  const signals: Signal[] = [
    { id: 'sig-demand', domain: 'commerce', label: 'Demand momentum', value: 82, unit: 'score', confidence: 0.91, observedAt: now },
    { id: 'sig-conversion', domain: 'customer', label: 'Conversion opportunity', value: 14.2, unit: '%', confidence: 0.84, observedAt: now },
    { id: 'sig-stock', domain: 'inventory', label: 'Stock pressure', value: 23, unit: 'SKUs', confidence: 0.96, observedAt: now },
    { id: 'sig-delivery', domain: 'logistics', label: 'Delivery reliability', value: 94.6, unit: '%', confidence: 0.93, observedAt: now },
    { id: 'sig-risk', domain: 'risk', label: 'Checkout risk', value: 18, unit: 'score', confidence: 0.88, observedAt: now },
    { id: 'sig-merchant', domain: 'merchant', label: 'Merchant growth readiness', value: 76, unit: 'score', confidence: 0.8, observedAt: now },
  ];

  const recommendations: Recommendation[] = [
    { id: 'rec-stock', priority: 'critical', title: 'إعادة توزيع المخزون قبل نفاد المنتجات الأسرع طلبًا', rationale: 'ضغط المخزون مرتفع مع زخم طلب قوي.', impact: 'تقليل احتمالية فقد المبيعات وتحسين availability.', confidence: 0.93, requiresApproval: true },
    { id: 'rec-bundle', priority: 'high', title: 'اختبار Bundle للمنتجات ذات الارتباط الشرائي', rationale: 'هناك فرصة تحويل واضحة بدون خصم شامل.', impact: 'رفع AOV والتحويل مع حماية الهامش.', confidence: 0.86, requiresApproval: true },
    { id: 'rec-retention', priority: 'high', title: 'تشغيل رحلة استعادة للعملاء غير النشطين', rationale: 'إشارة الاحتفاظ أقل من فرصة الطلب الحالية.', impact: 'رفع repeat purchase.', confidence: 0.81, requiresApproval: true },
    { id: 'rec-routing', priority: 'medium', title: 'إعادة وزن Carrier routing حسب ETA والثقة', rationale: 'موثوقية التوصيل جيدة لكن يوجد هامش تحسين في زمن التسليم.', impact: 'ETA أدق وتقليل التأخير.', confidence: 0.78, requiresApproval: false },
  ];

  const scenarios: Scenario[] = [
    { id: 'scenario-bundle', name: 'Bundle-first', description: 'زيادة عرض الحزم للمنتجات المتكاملة.', assumptions: { bundleExposure: 0.2, discount: 0.03 }, projected: { revenueDelta: 8.4, conversionDelta: 4.1, marginDelta: 1.2, riskScore: 22 } },
    { id: 'scenario-retention', name: 'Retention push', description: 'تفعيل استعادة العملاء ذوي احتمالية العودة الأعلى.', assumptions: { reachableCustomers: 0.35, incentive: 0.04 }, projected: { revenueDelta: 6.1, conversionDelta: 2.8, marginDelta: 0.6, riskScore: 19 } },
    { id: 'scenario-fastest', name: 'Fastest delivery', description: 'رفع أولوية السرعة في اختيار الشحن.', assumptions: { speedWeight: 0.35, costWeight: -0.1 }, projected: { revenueDelta: 2.7, conversionDelta: 2.2, marginDelta: -1.4, riskScore: 15 } },
  ];

  return {
    version: '134.0.0', mode: 'decision-support', signals, recommendations, scenarios,
    guardrails: { autonomousFinancialActions: false, approvalRequiredFor: ['payments', 'refunds', 'pricing', 'inventory writes', 'merchant payouts', 'campaign spend'] },
  };
}

export function scoreScenario(snapshot: IntelligenceSnapshot, scenarioId: string) {
  const scenario = snapshot.scenarios.find((item) => item.id === scenarioId);
  if (!scenario) return null;
  const confidence = Math.round((snapshot.signals.reduce((sum, signal) => sum + signal.confidence, 0) / snapshot.signals.length) * 100);
  return { scenario, confidence, decision: scenario.projected.riskScore <= 25 ? 'review' : 'reject' };
}
