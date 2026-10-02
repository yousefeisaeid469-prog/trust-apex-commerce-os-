export type ControlRisk = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type AdminRole = 'SUPER_ADMIN' | 'OPERATIONS' | 'AI_OPERATOR' | 'AUDITOR';
export type ControlAction = 'SIMULATE' | 'READ' | 'APPROVE' | 'EXECUTE';
const roles: Record<AdminRole, ControlRisk[]> = {
  SUPER_ADMIN: ['LOW','MEDIUM','HIGH','CRITICAL'],
  OPERATIONS: ['LOW','MEDIUM','HIGH'],
  AI_OPERATOR: ['LOW','MEDIUM'],
  AUDITOR: ['LOW'],
};
export function canAttemptControl(role: AdminRole, risk: ControlRisk, action: ControlAction, safeMode=false) {
  if (action === 'READ' || action === 'SIMULATE') return true;
  if (safeMode && action === 'EXECUTE') return false;
  return roles[role].includes(risk) && (action !== 'EXECUTE' || risk !== 'CRITICAL');
}
export function approvalRequirement(risk: ControlRisk) { return risk === 'HIGH' || risk === 'CRITICAL' ? 2 : 1; }
