export type PurchaseAlertSeverity='info'|'warning'|'critical';
export type PurchaseAlertType='return_window'|'warranty'|'delivery'|'attention';
export type PurchaseAlert={type:PurchaseAlertType;severity:PurchaseAlertSeverity;title:string;message:string;dueAt:string|null;action:string};
export type PurchasePassport={orderId:string;status:string;createdAt:string;total:number;currency:string;items:Array<{productId:string;name:string;quantity:number;unitPrice:number}>;returnWindowEndsAt:string|null;warrantyEndsAt:string|null;alerts:PurchaseAlert[]};
export type GuardianOverview={customerId:string;purchaseCount:number;activeWarranties:number;returnWindows:number;attentionRequired:number;purchases:PurchasePassport[]};
