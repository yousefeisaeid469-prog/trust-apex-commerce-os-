export type PricePoint={at:string;amountMinor:bigint;currency:string};
export type PriceAlert={id:string;productId:string;targetMinor:bigint;currency:string;active:boolean};
export type Interest={id:string;query:string;createdAt:string;active:boolean};
export type DecisionCandidate={id:string;title:string;priceMinor:bigint;currency:string;rating:number;deliveryDays:number;stock:number;features:string[]};
export type DecisionResult={winnerId:string;score:number;reasons:string[]};
