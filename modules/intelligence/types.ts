export type Signal = {
  id: string;
  domain: 'commerce' | 'customer' | 'merchant' | 'inventory' | 'logistics' | 'risk';
  label: string;
  value: number;
  unit?: string;
  confidence: number;
  observedAt: string;
};

export type Recommendation = {
  id: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  rationale: string;
  impact: string;
  confidence: number;
  requiresApproval: boolean;
};

export type Scenario = {
  id: string;
  name: string;
  description: string;
  assumptions: Record<string, number>;
  projected: { revenueDelta: number; conversionDelta: number; marginDelta: number; riskScore: number };
};

export type IntelligenceSnapshot = {
  version: '134.0.0';
  mode: 'decision-support';
  signals: Signal[];
  recommendations: Recommendation[];
  scenarios: Scenario[];
  guardrails: { autonomousFinancialActions: false; approvalRequiredFor: string[] };
};
