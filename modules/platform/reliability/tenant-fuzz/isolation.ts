export type AccessCase={actorTenant:string;resourceTenant:string;role:string;resourceId:string};
export function authorizeTenant(c:AccessCase):boolean{return c.actorTenant===c.resourceTenant && c.resourceTenant.length>0;}
export function fuzzTenantIsolation(cases:AccessCase[]):{checked:number;violations:number}{let violations=0;for(const c of cases){const allowed=authorizeTenant(c);if(c.actorTenant!==c.resourceTenant&&allowed)violations++;}return{checked:cases.length,violations};}
