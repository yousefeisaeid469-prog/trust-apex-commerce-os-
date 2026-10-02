export type MerchantHealth={sales:number;fulfillment:number;returns:number;chargebacks:number;tenureDays:number};
export function score(h:MerchantHealth){return Math.max(0,Math.min(100,Math.round(h.sales*.35+h.fulfillment*.25+(100-h.returns)*.15+(100-h.chargebacks)*.15+Math.min(h.tenureDays/365,1)*10)));}
export function lenderSummary(score:number){return {score,decision:"not_provided",regulatedLendingRequired:true};}
