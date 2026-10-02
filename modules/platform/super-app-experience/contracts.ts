export type SuperAppSurface = 'HOME'|'SHOP'|'AI'|'ORDERS'|'PROTECTION'|'LOYALTY'|'SAVINGS'|'SELLER';
export type SuperAppAction = {id:string; title:string; description:string; surface:SuperAppSurface; href:string; priority:number; requiresApproval:boolean; evidence:string};
export type SuperAppPlan = {version:'V209'; headline:string; surfaces:{id:SuperAppSurface;label:string;href:string;enabled:boolean}[]; actions:SuperAppAction[]; trustPrinciples:string[]; unavailable:string[]};
