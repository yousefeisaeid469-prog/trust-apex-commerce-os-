export type ShoppingIntent = 'DISCOVER'|'COMPARE'|'RESEARCH'|'REORDER'|'DEAL'|'TRACK_PRICE'|'BUILD_CART'|'SHOPPING_GUIDE';
export type ApprovalLevel = 'NONE'|'CHECKOUT_CONFIRMATION'|'EXTERNAL_PURCHASE_CONFIRMATION';
export interface ShoppingRequest { id:string; query:string; locale:string; currency:string; budgetMinor?:bigint; intent?:ShoppingIntent; }
export interface ProductSignal { productId:string; rating:number; reviewCount:number; priceMinor:bigint; currency:string; stock:number; deliveryDays:number; sellerTrust:number; attributes:Record<string,string>; tags:string[]; }
export interface Recommendation { productId:string; score:number; reasons:string[]; }
export interface ComparisonRow { key:string; values:Record<string,string|number|bigint>; winnerId?:string; }
export interface PriceInsight { currentMinor:bigint; lowestMinor:bigint; highestMinor:bigint; percentile:number; verdict:'LOW'|'TYPICAL'|'HIGH'|'UNKNOWN'; }
export interface ShoppingPlanStep { id:string; action:'SEARCH'|'FILTER'|'COMPARE'|'ADD_TO_CART'|'SET_ALERT'|'REORDER'|'CHECKOUT'; requiresApproval:boolean; description:string; }
export interface ShoppingPlan { requestId:string; steps:ShoppingPlanStep[]; approvalLevel:ApprovalLevel; }
export interface GuideSection { title:string; bullets:string[]; productIds:string[]; }
