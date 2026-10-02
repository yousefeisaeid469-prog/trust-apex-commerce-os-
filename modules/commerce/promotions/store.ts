export type Promotion={code:string;type:'percent'|'fixed';value:number;minSubtotal:number;active:boolean;expiresAt?:string};
const promotions=new Map<string,Promotion>([['TRUST10',{code:'TRUST10',type:'percent',value:10,minSubtotal:500,active:true}],['WELCOME150',{code:'WELCOME150',type:'fixed',value:150,minSubtotal:800,active:true}]]);
export function listPromotions(){return [...promotions.values()].filter(p=>p.active).map(({code,type,value,minSubtotal})=>({code,type,value,minSubtotal}));}
