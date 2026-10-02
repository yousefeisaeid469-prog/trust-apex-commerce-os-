export type Membership = { id:string; customerId:string; tier:'free'|'plus'|'pro'; renewsAt?:string; points:number; benefits:string[] };
