import { AgentDefinition, AgentId } from './contracts';

export const AGENTS: AgentDefinition[] = [
 {id:'pricing',name:'Pricing Agent',mission:'تحسين السعر والعروض مع حماية الهامش.',allowedModes:['observe','recommend','simulate'],defaultRisk:'HIGH'},
 {id:'inventory',name:'Inventory Agent',mission:'التنبؤ بالطلب واقتراح إعادة توزيع المخزون.',allowedModes:['observe','recommend','simulate'],defaultRisk:'MEDIUM'},
 {id:'customer',name:'Customer Agent',mission:'تحسين الاحتفاظ والـNext Best Action.',allowedModes:['observe','recommend','simulate'],defaultRisk:'MEDIUM'},
 {id:'growth',name:'Growth Agent',mission:'اقتراح تجارب نمو قابلة للقياس قبل إطلاقها.',allowedModes:['observe','recommend','simulate'],defaultRisk:'HIGH'},
 {id:'risk',name:'Risk Agent',mission:'كشف الإشارات غير الطبيعية وحماية الثقة.',allowedModes:['observe','recommend','simulate','execute'],defaultRisk:'CRITICAL'},
 {id:'logistics',name:'Logistics Agent',mission:'تحسين الـETA واختيار مسار التنفيذ.',allowedModes:['observe','recommend','simulate'],defaultRisk:'HIGH'},
];

export function getAgent(id:string){ return AGENTS.find(a=>a.id===id as AgentId); }
