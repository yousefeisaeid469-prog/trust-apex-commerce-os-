export const RETURN_REASON_CODES = ['WRONG_ITEM','DAMAGED','DEFECTIVE','NOT_AS_DESCRIBED','SIZE_OR_FIT','CHANGED_MIND','LATE_DELIVERY','OTHER'] as const;
export type ReturnReasonCode = typeof RETURN_REASON_CODES[number];
export const RETURN_STATUSES = ['REQUESTED','APPROVED','REJECTED','RECEIVED','INSPECTING','APPROVED_REFUND','REFUND_PENDING','REFUNDED','CLOSED'] as const;
export type ReturnStatus = typeof RETURN_STATUSES[number];
export const RETURN_ITEM_CONDITIONS = ['UNKNOWN','SEALED','OPENED','USED','DAMAGED','DEFECTIVE'] as const;
export type ReturnItemCondition = typeof RETURN_ITEM_CONDITIONS[number];
export const INSPECTION_DECISIONS = ['PENDING','ACCEPT','PARTIAL','REJECT'] as const;
export type InspectionDecision = typeof INSPECTION_DECISIONS[number];
export const RETURN_OUTCOMES = ['REFUND','REPLACEMENT','STORE_CREDIT','REJECTED','NO_ACTION'] as const;
export type ReturnOutcome = typeof RETURN_OUTCOMES[number];
export type ReturnItemInput = { orderItemId:string; quantity:number };
export type CreateReturnInput = { orderId:string; customerId:string; reasonCode:ReturnReasonCode; reasonNote?:string; items:ReturnItemInput[]; idempotencyKey:string };
export type ReturnRecord = { id:string; orderId:string; customerId:string|null; status:ReturnStatus; reasonCode:ReturnReasonCode; reasonNote:string|null; requestedAt:string; updatedAt:string };
export type ReturnItemRecord = { id:string; returnId:string; orderItemId:string; quantity:number; condition:ReturnItemCondition; inspectionNote:string|null };
export type InspectionInput = { returnId:string; decision:InspectionDecision; condition:ReturnItemCondition; recoverable:boolean; restockable:boolean; note?:string; actorId:string };
export type SettlementCalculation = { grossAmount:number; restockingFee:number; shippingAdjustment:number; netAmount:number; currency:'EGP'; eligible:boolean; reason:string };
export type ReturnCommandResult = { returnId:string; status:ReturnStatus; replay:boolean; itemCount:number };
export function isReturnReason(value:unknown):value is ReturnReasonCode { return typeof value==='string' && (RETURN_REASON_CODES as readonly string[]).includes(value); }
export function isReturnStatus(value:unknown):value is ReturnStatus { return typeof value==='string' && (RETURN_STATUSES as readonly string[]).includes(value); }
export function isReturnCondition(value:unknown):value is ReturnItemCondition { return typeof value==='string' && (RETURN_ITEM_CONDITIONS as readonly string[]).includes(value); }
export function isInspectionDecision(value:unknown):value is InspectionDecision { return typeof value==='string' && (INSPECTION_DECISIONS as readonly string[]).includes(value); }
export function isOutcome(value:unknown):value is ReturnOutcome { return typeof value==='string' && (RETURN_OUTCOMES as readonly string[]).includes(value); }
export function normalizeNote(value:unknown,max=2000){ return typeof value==='string' ? value.trim().slice(0,max) || undefined : undefined; }
export function normalizePositiveInteger(value:unknown){ const n=typeof value==='number'?value:Number(value); return Number.isInteger(n)&&n>0?n:undefined; }
export function normalizePositiveMoney(value:unknown){ const n=typeof value==='number'?value:Number(value); return Number.isFinite(n)&&n>0?Math.round(n*100)/100:undefined; }
