import type { ReturnStatus, InspectionDecision } from './contracts';
const transitions:Record<ReturnStatus,readonly ReturnStatus[]>={
 REQUESTED:['APPROVED','REJECTED'],
 APPROVED:['RECEIVED','REJECTED'],
 REJECTED:['CLOSED'],
 RECEIVED:['INSPECTING'],
 INSPECTING:['APPROVED_REFUND','REJECTED'],
 APPROVED_REFUND:['REFUND_PENDING'],
 REFUND_PENDING:['REFUNDED','INSPECTING'],
 REFUNDED:['CLOSED'],
 CLOSED:[],
};
export function canTransitionReturn(from:ReturnStatus,to:ReturnStatus){return from===to||transitions[from].includes(to);}
export function assertReturnTransition(from:ReturnStatus,to:ReturnStatus){if(!canTransitionReturn(from,to))throw new Error(`INVALID_RETURN_TRANSITION:${from}->${to}`);}
export function nextStatusForInspection(decision:InspectionDecision):ReturnStatus{if(decision==='ACCEPT'||decision==='PARTIAL')return 'APPROVED_REFUND';return 'REJECTED';}
export function statusLabel(status:ReturnStatus){return status.replaceAll('_',' ');}
export function isTerminalReturn(status:ReturnStatus){return status==='CLOSED';}
export function isRefundPath(status:ReturnStatus){return ['APPROVED_REFUND','REFUND_PENDING','REFUNDED'].includes(status);}
export function isCustomerActionable(status:ReturnStatus){return ['REQUESTED','APPROVED','RECEIVED','INSPECTING'].includes(status);}
export function isOperationsActionable(status:ReturnStatus){return ['REQUESTED','RECEIVED','INSPECTING','REFUND_PENDING'].includes(status);}
export function allowedTransitions(status:ReturnStatus){return transitions[status];}
export function transitionReason(from:ReturnStatus,to:ReturnStatus){
 if(from===to)return 'NO_OP';
 if(from==='REQUESTED'&&to==='APPROVED')return 'RETURN_APPROVED';
 if(from==='REQUESTED'&&to==='REJECTED')return 'RETURN_REJECTED';
 if(from==='APPROVED'&&to==='RECEIVED')return 'RETURN_RECEIVED';
 if(from==='RECEIVED'&&to==='INSPECTING')return 'INSPECTION_STARTED';
 if(from==='INSPECTING'&&to==='APPROVED_REFUND')return 'REFUND_ELIGIBLE';
 if(from==='APPROVED_REFUND'&&to==='REFUND_PENDING')return 'REFUND_REQUESTED';
 if(from==='REFUND_PENDING'&&to==='REFUNDED')return 'REFUND_SETTLED';
 if(to==='CLOSED')return 'RETURN_CLOSED';
 return 'RETURN_STATUS_CHANGED';
}
