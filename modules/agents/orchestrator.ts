import { AgentDecision, AgentId, AgentMode, AgentRisk } from './contracts';
import { AGENTS } from './registry';

const riskRank: Record<AgentRisk,number>={LOW:1,MEDIUM:2,HIGH:3,CRITICAL:4};
const safeMode = true;

export function buildAgentDecisions(): AgentDecision[] {
 return [
  {id:'price-001',agentId:'pricing',title:'اختبار Bundle بدل خصم شامل',rationale:'يحافظ على قيمة السلة ويقلل ضغط الخصم المباشر.',risk:'HIGH',confidence:.89,mode:'simulate',requiresApproval:true},
  {id:'inv-001',agentId:'inventory',title:'إعادة توزيع مخزون SKU سريع الحركة',rationale:'الطلب المتوقع أعلى من المخزون المحلي في عقدة واحدة.',risk:'MEDIUM',confidence:.93,mode:'recommend',requiresApproval:false},
  {id:'cust-001',agentId:'customer',title:'حملة استعادة للعملاء غير النشطين',rationale:'استهداف شريحة ذات احتمالية عودة أعلى من المتوسط.',risk:'MEDIUM',confidence:.84,mode:'recommend',requiresApproval:false},
  {id:'growth-001',agentId:'growth',title:'تجربة صفحة منتج عالية النية',rationale:'اختبار اجتماعي/ثقة أفضل قبل تعميم التغيير.',risk:'HIGH',confidence:.78,mode:'simulate',requiresApproval:true},
  {id:'risk-001',agentId:'risk',title:'مراجعة نمط دفع غير اعتيادي',rationale:'الإشارة تستحق مراجعة بشرية قبل أي حظر أو رفض.',risk:'CRITICAL',confidence:.97,mode:'recommend',requiresApproval:true},
  {id:'log-001',agentId:'logistics',title:'توجيه الشحن وفق ETA والثقة',rationale:'المسار المقترح يحسن موعد الوصول المتوقع مع مخاطرة أقل.',risk:'HIGH',confidence:.86,mode:'recommend',requiresApproval:true},
 ];
}

export function dispatch(agentId:AgentId, mode:AgentMode, decisionId?:string){
 const agent=AGENTS.find(a=>a.id===agentId); if(!agent) return {ok:false,error:'AGENT_NOT_FOUND'};
 if(!agent.allowedModes.includes(mode)) return {ok:false,error:'MODE_NOT_ALLOWED'};
 const decision=buildAgentDecisions().find(d=>d.agentId===agentId && (!decisionId || d.id===decisionId));
 if(!decision) return {ok:false,error:'DECISION_NOT_FOUND'};
 const blocked=safeMode && mode==='execute';
 const approvalRequired=decision.requiresApproval || riskRank[decision.risk]>=3;
 return {ok:!blocked, status:blocked?'BLOCKED_BY_AUTONOMY_FIREWALL':approvalRequired?'PENDING_APPROVAL':'READY', agent, decision, policy:{safeMode,approvalRequired,executionAllowed:!blocked && !approvalRequired}};
}
